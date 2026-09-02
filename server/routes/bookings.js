import express from 'express';
import { Booking } from '../models/Booking.js';
import { Slot } from '../models/Slot.js';
import { Tournament } from '../models/Tournament.js';
import { protect, userProtect } from '../middleware/auth.js';
import { getCashfreeConfig } from '../config/cashfree.js';

const router = express.Router();

// GET /api/bookings — get all bookings (admin only)
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'phone teamName registrationNumber')
      .populate('slotId', 'matchName slotTime price entryFee')
      .populate('tournamentId', 'title game date location prizePool entryFee')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/bookings/create — create a pending booking + initiate Cashfree order (for Slots or Tournaments)
router.post('/create', userProtect, async (req, res) => {
  const config = getCashfreeConfig(req);
  const { slotId, tournamentId } = req.body;
  const userId = req.user._id;
  const rawPhone = req.user.phone ? req.user.phone.replace(/\D/g, '') : '';
  const userPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9999999999';
  const userName = (req.user.name || req.user.username || req.user.teamName || 'Gamer').trim();
  const userEmail = (req.user.email || `${userPhone}@risingesports.online`).trim();

  if (!slotId && !tournamentId) {
    return res.status(400).json({ message: 'slotId or tournamentId is required' });
  }

  try {
    let amountInRupees = 0;
    let type = 'slot';
    let targetName = 'Event';
    let query = { userId };

    if (slotId) {
      const slot = await Slot.findById(slotId);
      if (!slot) {
        return res.status(404).json({ message: 'Slot not found' });
      }

      const bookingCount = await Booking.countDocuments({
        slotId,
        paymentStatus: { $in: ['pending', 'paid'] },
      });
      if (bookingCount >= (slot.maxTeams || 20)) {
        return res.status(400).json({ message: 'This slot is full' });
      }

      amountInRupees = Number(slot.price || slot.entryFee || 0);
      type = 'slot';
      targetName = slot.matchName || 'Match Slot';
      query.slotId = slotId;
    } else if (tournamentId) {
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }

      amountInRupees = Number(tournament.entryFee || 0);
      type = 'tournament';
      targetName = tournament.title || 'Tournament';
      query.tournamentId = tournamentId;
    }

    if (amountInRupees <= 0) {
      return res.status(400).json({ message: 'Invalid entry fee amount' });
    }

    // Check for existing booking
    let existingBooking = await Booking.findOne(query);
    if (existingBooking) {
      if (existingBooking.paymentStatus === 'paid') {
        return res.status(400).json({ message: 'You have already registered and paid for this.' });
      }
      if (existingBooking.paymentStatus === 'failed') {
        await Booking.findByIdAndDelete(existingBooking._id);
        existingBooking = null;
      }
    }

    // Generate unique order ID for Cashfree (alphanumeric with _ or -, max 45 chars)
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const orderId = `CF_${type.toUpperCase().slice(0, 4)}_${uniqueSuffix}`;

    // Build Cashfree Order Request Payload
    const returnUrl = `${config.returnBaseUrl}/api/bookings/cashfree-redirect?order_id={order_id}`;
    const notifyUrl = `${config.returnBaseUrl}/api/webhooks/cashfree`;

    const orderRequest = {
      order_id: orderId,
      order_amount: amountInRupees,
      order_currency: 'INR',
      customer_details: {
        customer_id: `cust_${userId.toString()}`,
        customer_name: userName,
        customer_email: userEmail,
        customer_phone: userPhone,
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
      },
      order_note: `${targetName} Booking - Rising Esports`,
    };

    console.log(`[Cashfree Init] Creating order ${orderId} for ₹${amountInRupees} (User: ${userId})`);

    const response = await config.cashfreeClient.PGCreateOrder(orderRequest);
    const responseData = response?.data;

    if (!responseData || !responseData.payment_session_id) {
      console.error('[Cashfree Init Error] Unexpected response:', responseData);
      return res.status(400).json({
        message: 'Failed to generate payment session with Cashfree.',
      });
    }

    const paymentSessionId = responseData.payment_session_id;
    const cfOrderId = responseData.cf_order_id ? String(responseData.cf_order_id) : undefined;

    console.log(`[Cashfree Init Success] Order created: ${orderId}, Session: ${paymentSessionId}`);

    // Create or update pending booking in DB
    let booking;
    if (existingBooking) {
      existingBooking.merchantTransactionId = orderId;
      existingBooking.cfOrderId = cfOrderId;
      existingBooking.paymentSessionId = paymentSessionId;
      existingBooking.amount = amountInRupees;
      existingBooking.paymentStatus = 'pending';
      booking = await existingBooking.save();
    } else {
      booking = await Booking.create({
        userId,
        slotId: slotId || undefined,
        tournamentId: tournamentId || undefined,
        type,
        amount: amountInRupees,
        paymentStatus: 'pending',
        merchantTransactionId: orderId,
        cfOrderId,
        paymentSessionId,
      });
    }

    res.status(201).json({
      success: true,
      paymentSessionId,
      orderId,
      cfOrderId,
      bookingId: booking._id,
      amount: amountInRupees,
      type,
      targetName,
      environment: config.env.toLowerCase(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You already have an active booking for this.' });
    }
    console.error('Booking/Cashfree creation error:', error?.response?.data || error);
    const errMsg = error?.response?.data?.message || error.message || 'Failed to initiate Cashfree order';
    res.status(500).json({ message: errMsg });
  }
});

// ALL (POST & GET) /api/bookings/cashfree-redirect — Cashfree browser return endpoint
// Cashfree sends the user back here after checkout.
// We verify the order status with Cashfree server, update MongoDB, and redirect to the React frontend.
router.all('/cashfree-redirect', async (req, res) => {
  const config = getCashfreeConfig(req);
  try {
    const orderId = req.query.order_id || req.query.orderId || req.body?.order_id || req.query.txnId;

    if (!orderId) {
      console.warn('[Cashfree Redirect] No order_id found in query or body');
      return res.redirect(`${config.clientUrl}/payment-status?error=no_order_id`);
    }

    console.log(`[Cashfree Redirect] Return received for order: ${orderId}`);

    // Fetch order details directly from Cashfree
    const orderResponse = await config.cashfreeClient.PGFetchOrder(orderId);
    const orderData = orderResponse?.data;

    let paymentId = '';
    try {
      const paymentsResponse = await config.cashfreeClient.PGOrderFetchPayments(orderId);
      if (Array.isArray(paymentsResponse?.data) && paymentsResponse.data.length > 0) {
        const successfulPayment = paymentsResponse.data.find(p => p.payment_status === 'SUCCESS') || paymentsResponse.data[0];
        paymentId = successfulPayment.cf_payment_id ? String(successfulPayment.cf_payment_id) : '';
      }
    } catch (payErr) {
      console.warn('[Cashfree Redirect] Error fetching payments list:', payErr.message);
    }

    const booking = await Booking.findOne({ merchantTransactionId: orderId });
    if (booking) {
      if (orderData?.order_status === 'PAID') {
        booking.paymentStatus = 'paid';
        booking.paymentId = paymentId || (orderData.cf_order_id ? String(orderData.cf_order_id) : 'CASHFREE_PAID');
        booking.paidAt = new Date();
        await booking.save();
        console.log(`[Cashfree Redirect] Booking ${booking._id} marked as PAID for order ${orderId}`);
      } else if (orderData?.order_status === 'ACTIVE') {
        booking.paymentStatus = 'pending';
        await booking.save();
        console.log(`[Cashfree Redirect] Booking ${booking._id} marked as PENDING for order ${orderId}`);
      } else if (orderData?.order_status === 'EXPIRED' || orderData?.order_status === 'TERMINATED' || orderData?.order_status === 'FAILED') {
        if (booking.paymentStatus !== 'paid') {
          booking.paymentStatus = 'failed';
          await booking.save();
          console.log(`[Cashfree Redirect] Booking ${booking._id} marked as FAILED for order ${orderId}`);
        }
      }
    }

    // Cleanly redirect user to the React frontend Payment Status screen
    return res.redirect(302, `${config.clientUrl}/payment-status?order_id=${encodeURIComponent(orderId)}`);
  } catch (error) {
    console.error('[Cashfree Redirect Error]:', error?.response?.data || error.message);
    const orderId = req.query.order_id || req.query.orderId || '';
    return res.redirect(302, `${config.clientUrl}/payment-status?order_id=${encodeURIComponent(orderId)}`);
  }
});

// GET /api/bookings/status/:orderId — check payment status directly with Cashfree and return full populated booking
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    let booking = await Booking.findOne({
      $or: [
        { merchantTransactionId: orderId },
        { cfOrderId: orderId },
      ],
    })
      .populate('userId', 'name username phone teamName registrationNumber email')
      .populate('slotId', 'matchName slotTime price entryFee maxTeams mode date timing teams')
      .populate('tournamentId', 'title game date entryFee prizePool');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found for this order ID' });
    }

    // If already verified as paid in DB, return immediately
    if (booking.paymentStatus === 'paid') {
      return res.json({
        success: true,
        paymentStatus: 'paid',
        booking,
        message: 'Payment completed successfully!',
      });
    }

    // Otherwise, query Cashfree server-to-server for real-time status
    const config = getCashfreeConfig();
    const orderResponse = await config.cashfreeClient.PGFetchOrder(booking.merchantTransactionId || orderId);
    const orderData = orderResponse?.data;

    if (orderData?.order_status === 'PAID') {
      let paymentId = '';
      try {
        const paymentsResponse = await config.cashfreeClient.PGOrderFetchPayments(booking.merchantTransactionId || orderId);
        if (Array.isArray(paymentsResponse?.data) && paymentsResponse.data.length > 0) {
          const successfulPayment = paymentsResponse.data.find(p => p.payment_status === 'SUCCESS') || paymentsResponse.data[0];
          paymentId = successfulPayment.cf_payment_id ? String(successfulPayment.cf_payment_id) : '';
        }
      } catch (e) {
        // ignore
      }

      booking.paymentStatus = 'paid';
      booking.paymentId = paymentId || (orderData.cf_order_id ? String(orderData.cf_order_id) : 'CASHFREE_PAID');
      booking.paidAt = new Date();
      await booking.save();

      // Refetch populated booking
      booking = await Booking.findById(booking._id)
        .populate('userId', 'name username phone teamName registrationNumber email')
        .populate('slotId', 'matchName slotTime price entryFee maxTeams mode date timing teams')
        .populate('tournamentId', 'title game date entryFee prizePool');

      return res.json({
        success: true,
        paymentStatus: 'paid',
        booking,
        message: 'Payment completed successfully!',
      });
    } else if (orderData?.order_status === 'ACTIVE') {
      return res.json({
        success: false,
        paymentStatus: 'pending',
        booking,
        message: 'Payment is pending. Please wait or complete checkout.',
      });
    } else {
      booking.paymentStatus = 'failed';
      await booking.save();

      return res.json({
        success: false,
        paymentStatus: 'failed',
        booking,
        message: 'Payment failed, expired, or was cancelled.',
      });
    }
  } catch (error) {
    console.error('Cashfree status check error:', error?.response?.data || error.message);
    res.status(500).json({ message: error?.response?.data?.message || error.message || 'Failed to verify payment status' });
  }
});

// GET /api/bookings/my — get current user's bookings
router.get('/my', userProtect, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('slotId', 'matchName slotTime entryFee price maxTeams')
      .populate('tournamentId', 'title game date entryFee prizePool')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
