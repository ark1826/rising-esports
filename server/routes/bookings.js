import express from 'express';
import crypto from 'crypto';
import { Booking } from '../models/Booking.js';
import { Slot } from '../models/Slot.js';
import { Tournament } from '../models/Tournament.js';
import { protect, userProtect } from '../middleware/auth.js';

const router = express.Router();

const generateOrderId = (prefix = 'ORD') =>
  `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

// GET /api/bookings — Admin: get all bookings
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'phone teamName registrationNumber')
      .populate('slotId', 'matchName slotTime price entryFee date timing')
      .populate('tournamentId', 'title game date location prizePool entryFee')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/bookings/create — User: create a UPI booking (pending_verification)
router.post('/create', userProtect, async (req, res) => {
  const { slotId, tournamentId, utrNumber } = req.body;
  const userId = req.user._id;

  if (!slotId && !tournamentId) {
    return res.status(400).json({ message: 'slotId or tournamentId is required' });
  }
  if (!utrNumber || !utrNumber.trim()) {
    return res.status(400).json({ message: 'UPI Transaction ID (UTR) is required' });
  }

  try {
    let amountInRupees = 0;
    let type = 'slot';
    let targetName = 'Event';
    let query = { userId };

    if (slotId) {
      const slot = await Slot.findById(slotId);
      if (!slot) return res.status(404).json({ message: 'Slot not found' });

      const bookingCount = await Booking.countDocuments({
        slotId,
        paymentStatus: { $in: ['pending_verification', 'paid'] },
      });
      if (bookingCount >= (slot.maxTeams || 20)) {
        return res.status(400).json({ message: 'This slot is full' });
      }

      amountInRupees = Number(slot.price || slot.entryFee || 0);
      type = 'slot';
      targetName = slot.matchName || 'Match Slot';
      query.slotId = slotId;
    } else {
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

      amountInRupees = Number(tournament.entryFee || 0);
      type = 'tournament';
      targetName = tournament.title || 'Tournament';
      query.tournamentId = tournamentId;
    }

    // Check for existing active booking
    const existingBooking = await Booking.findOne(query);
    if (existingBooking) {
      if (existingBooking.paymentStatus === 'paid') {
        return res.status(400).json({ message: 'You have already registered and paid for this.' });
      }
      if (existingBooking.paymentStatus === 'pending_verification') {
        return res.status(400).json({ message: 'Your payment is already submitted and awaiting verification.' });
      }
      // If failed, delete and allow retry
      if (existingBooking.paymentStatus === 'failed') {
        await Booking.findByIdAndDelete(existingBooking._id);
      }
    }

    const orderId = generateOrderId('UPI');

    const booking = await Booking.create({
      userId,
      slotId: slotId || undefined,
      tournamentId: tournamentId || undefined,
      type,
      amount: amountInRupees,
      paymentStatus: 'pending_verification',
      paymentMethod: 'upi',
      utrNumber: utrNumber.trim(),
      merchantTransactionId: orderId,
    });

    console.log(`[UPI Booking] Created booking ${booking._id} for ${targetName} — UTR: ${utrNumber.trim()}`);

    res.status(201).json({
      success: true,
      bookingId: booking._id,
      orderId,
      amount: amountInRupees,
      type,
      targetName,
      paymentStatus: 'pending_verification',
      message: 'Payment submitted! Your booking is pending admin verification.',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You already have an active booking for this slot.' });
    }
    console.error('UPI Booking creation error:', error);
    res.status(500).json({ message: error.message || 'Failed to create booking' });
  }
});

// PUT /api/bookings/:id/verify — Admin: approve or reject a UPI payment
router.put('/:id/verify', protect, async (req, res) => {
  const { status, note } = req.body; // status: 'paid' | 'failed'

  if (!['paid', 'failed'].includes(status)) {
    return res.status(400).json({ message: 'Status must be "paid" or "failed"' });
  }

  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'phone teamName')
      .populate('slotId', 'matchName entryFee')
      .populate('tournamentId', 'title entryFee');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Booking is already verified as paid' });
    }

    const adminInfo = req.admin;
    booking.paymentStatus = status;
    booking.verificationNote = note || '';
    booking.verifiedAt = new Date();
    booking.verifiedBy = adminInfo?.username || 'admin';

    if (status === 'paid') {
      booking.paidAt = new Date();
      booking.paymentId = booking.utrNumber || booking.merchantTransactionId;
    }

    await booking.save();

    console.log(`[UPI Verify] Booking ${booking._id} marked as ${status} by admin`);

    res.json({
      success: true,
      message: `Booking ${status === 'paid' ? 'approved' : 'rejected'} successfully`,
      booking,
    });
  } catch (error) {
    console.error('Booking verification error:', error);
    res.status(500).json({ message: error.message || 'Failed to verify booking' });
  }
});

// GET /api/bookings/pending-verification — Admin: get all UPI bookings awaiting verification
router.get('/pending-verification', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ paymentStatus: 'pending_verification' })
      .populate('userId', 'phone teamName registrationNumber')
      .populate('slotId', 'matchName date timing entryFee price')
      .populate('tournamentId', 'title game date entryFee')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/bookings/status/:orderId — Read booking status from DB
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const booking = await Booking.findOne({
      $or: [
        { merchantTransactionId: orderId },
        { _id: orderId.length === 24 ? orderId : undefined },
      ],
    })
      .populate('userId', 'name username phone teamName registrationNumber email')
      .populate('slotId', 'matchName slotTime price entryFee maxTeams mode date timing teams')
      .populate('tournamentId', 'title game date entryFee prizePool');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found for this order ID' });
    }

    const statusMap = {
      paid: { success: true, paymentStatus: 'paid', message: 'Payment completed successfully!' },
      pending_verification: { success: true, paymentStatus: 'pending_verification', message: 'Payment submitted — awaiting admin verification.' },
      pending: { success: false, paymentStatus: 'pending', message: 'Payment is pending.' },
      failed: { success: false, paymentStatus: 'failed', message: 'Payment failed or was rejected.' },
    };

    const result = statusMap[booking.paymentStatus] || statusMap.failed;
    return res.json({ ...result, booking });
  } catch (error) {
    console.error('Booking status error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to check booking status' });
  }
});

// GET /api/bookings/my — Current user's bookings
router.get('/my', userProtect, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('slotId', 'matchName slotTime entryFee price maxTeams date timing maps mode note')
      .populate('tournamentId', 'title game date entryFee prizePool')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
