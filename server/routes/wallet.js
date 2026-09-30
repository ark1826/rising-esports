import express from 'express';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { Slot } from '../models/Slot.js';
import { Tournament } from '../models/Tournament.js';
import { Booking } from '../models/Booking.js';
import { protect, userProtect } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate transaction ID
const generateTxnId = (prefix = 'TXN') => {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

// ──────────────── USER ROUTES ────────────────

// GET /api/wallet/balance — Get current user's balance and recent transactions
router.get('/balance', userProtect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance teamName phone registrationNumber');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      balance: user.walletBalance || 0,
      teamName: user.teamName || '',
      phone: user.phone || '',
      registrationNumber: user.registrationNumber || null,
      recentTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/wallet/transactions — Get all transactions for current user
router.get('/transactions', userProtect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/wallet/deposit/initiate — Step 1: Initiate a real deposit request (WinZO-style)
// Generates payment details (UPI QR / Intent). Zero wallet balance is added until verified!
router.post('/deposit/initiate', userProtect, async (req, res) => {
  const { amount } = req.body;
  const numAmount = Number(amount);

  if (!numAmount || numAmount < 10) {
    return res.status(400).json({ message: 'Minimum deposit amount is ₹10' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const txnId = generateTxnId('WAL_DEP');
    const upiId = process.env.UPI_ID || 'Q264921089@ybl';
    const upiName = process.env.UPI_NAME || 'Rising Esports';
    const upiDeepLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${numAmount}&cu=INR&tn=${encodeURIComponent('Wallet Deposit ' + txnId)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiDeepLink)}&bgcolor=0d0d0d&color=c4b5fd&margin=10`;

    // Create deposit transaction in 'pending' status — NO BALANCE ADDED YET!
    const transaction = await Transaction.create({
      userId: user._id,
      transactionId: txnId,
      type: 'add_balance',
      amount: numAmount,
      status: 'pending',
      paymentMethod: 'upi',
      upiId,
      relatedItem: 'Wallet Deposit',
      notes: 'Deposit initiated, awaiting payment and UTR submission',
    });

    res.json({
      success: true,
      transactionId: txnId,
      amount: numAmount,
      upiId,
      upiName,
      upiDeepLink,
      qrUrl,
      transaction,
      message: 'Deposit initiated. Please scan the QR or pay via UPI, then submit your 12-digit UTR number.',
    });
  } catch (error) {
    console.error('Initiate deposit error:', error);
    res.status(500).json({ message: error.message || 'Failed to initiate deposit' });
  }
});

// POST /api/wallet/deposit/submit-utr — Step 2: Submit UTR proof for deposit verification
// Marks transaction as 'pending_verification' for admin review. Wallet balance is STILL NOT credited until approved!
router.post('/deposit/submit-utr', userProtect, async (req, res) => {
  const { transactionId, utrNumber, amount } = req.body;

  if (!utrNumber || !utrNumber.trim()) {
    return res.status(400).json({ message: 'UPI Transaction ID (UTR Number) is required' });
  }

  const cleanUtr = utrNumber.trim();
  if (cleanUtr.length < 6) {
    return res.status(400).json({ message: 'Please enter a valid UPI Transaction ID (minimum 6 digits)' });
  }

  try {
    // 1. Check for duplicate UTR in transactions (prevent reuse of same receipt)
    const existingTxn = await Transaction.findOne({
      utrNumber: cleanUtr,
      status: { $in: ['pending', 'pending_verification', 'success'] },
      ...(transactionId ? { transactionId: { $ne: transactionId } } : {}),
    });

    if (existingTxn) {
      return res.status(400).json({
        message: 'This UPI Reference (UTR) has already been submitted for another deposit. Each transaction must have a unique UTR.',
      });
    }

    // 2. Check for duplicate UTR in match bookings
    const existingBooking = await Booking.findOne({
      utrNumber: cleanUtr,
      paymentStatus: { $in: ['pending_verification', 'paid'] },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: 'This UPI Reference (UTR) has already been used for a match registration.',
      });
    }

    let transaction;
    if (transactionId) {
      transaction = await Transaction.findOne({ transactionId, userId: req.user._id });
      if (!transaction) {
        return res.status(404).json({ message: 'Deposit transaction not found' });
      }
      if (transaction.status === 'success') {
        return res.status(400).json({ message: 'This deposit has already been verified and credited' });
      }

      transaction.utrNumber = cleanUtr;
      transaction.status = 'pending_verification';
      transaction.notes = 'Payment proof submitted by user, awaiting admin verification';
      await transaction.save();
    } else {
      // Direct deposit submission with amount + UTR
      const numAmount = Number(amount);
      if (!numAmount || numAmount < 10) {
        return res.status(400).json({ message: 'Minimum deposit amount is ₹10' });
      }

      const txnId = generateTxnId('WAL_DEP');
      transaction = await Transaction.create({
        userId: req.user._id,
        transactionId: txnId,
        type: 'add_balance',
        amount: numAmount,
        status: 'pending_verification',
        paymentMethod: 'upi',
        utrNumber: cleanUtr,
        relatedItem: 'Wallet Deposit',
        notes: 'Payment proof submitted by user, awaiting admin verification',
      });
    }

    console.log(`[Deposit Submitted] User ${req.user._id} submitted ₹${transaction.amount} with UTR: ${cleanUtr}`);

    res.json({
      success: true,
      message: `Payment submitted successfully! Your deposit of ₹${transaction.amount} is awaiting admin verification. Funds will be credited once verified.`,
      transaction,
    });
  } catch (error) {
    console.error('Submit UTR error:', error);
    res.status(500).json({ message: error.message || 'Failed to submit payment proof' });
  }
});

// POST /api/wallet/add — Legacy safe handler. NO free money allowed!
// Rejects any call without valid payment proof (UTR) and routes through verification pipeline.
router.post('/add', userProtect, async (req, res) => {
  const { amount, utrNumber } = req.body;
  const numAmount = Number(amount);

  if (!numAmount || numAmount < 10) {
    return res.status(400).json({ message: 'Minimum deposit amount is ₹10' });
  }

  if (!utrNumber || !utrNumber.trim()) {
    return res.status(400).json({
      message: 'Direct balance addition is not allowed. Real UPI payment and UTR verification is required.',
      requirePayment: true,
    });
  }

  // Forward to submit-utr logic
  req.body.amount = numAmount;
  req.body.utrNumber = utrNumber.trim();

  // Create or submit via secure pipeline
  try {
    const cleanUtr = utrNumber.trim();
    const existingTxn = await Transaction.findOne({
      utrNumber: cleanUtr,
      status: { $in: ['pending', 'pending_verification', 'success'] },
    });
    if (existingTxn) {
      return res.status(400).json({ message: 'This UTR has already been submitted for another deposit.' });
    }

    const txnId = generateTxnId('WAL_DEP');
    const transaction = await Transaction.create({
      userId: req.user._id,
      transactionId: txnId,
      type: 'add_balance',
      amount: numAmount,
      status: 'pending_verification',
      paymentMethod: 'upi',
      utrNumber: cleanUtr,
      relatedItem: 'Wallet Deposit',
      notes: 'Payment proof submitted by user, awaiting admin verification',
    });

    res.json({
      success: true,
      message: `Deposit of ₹${numAmount} submitted! Awaiting admin verification before balance is credited.`,
      transaction,
      balance: req.user.walletBalance || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/wallet/withdraw — Request balance withdrawal
router.post('/withdraw', userProtect, async (req, res) => {
  const { amount, upiId, notes } = req.body;
  const numAmount = Number(amount);

  if (!numAmount || numAmount < 50) {
    return res.status(400).json({ message: 'Minimum withdrawal amount is ₹50' });
  }

  if (!upiId || !upiId.trim()) {
    return res.status(400).json({ message: 'Valid UPI ID is required for withdrawal' });
  }

  // Basic UPI ID format check
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  if (!upiRegex.test(upiId.trim())) {
    return res.status(400).json({ message: 'Please enter a valid UPI ID (e.g., yourname@okaxis or 9876543210@paytm)' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if ((user.walletBalance || 0) < numAmount) {
      return res.status(400).json({
        message: `Insufficient wallet balance. Available balance: ₹${user.walletBalance || 0}`,
      });
    }

    // Atomically decrement balance to prevent double-spending
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id, walletBalance: { $gte: numAmount } },
      { $inc: { walletBalance: -numAmount } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: 'Transaction could not be completed. Check balance.' });
    }

    const txnId = generateTxnId('WAL_WTH');

    const transaction = await Transaction.create({
      userId: user._id,
      transactionId: txnId,
      type: 'withdrawal',
      amount: numAmount,
      status: 'pending',
      upiId: upiId.trim(),
      notes: notes?.trim() || `Withdrawal request to ${upiId.trim()}`,
      relatedItem: 'Wallet Withdrawal',
    });

    res.json({
      message: `Withdrawal request for ₹${numAmount} submitted successfully. Payout will be processed to ${upiId.trim()} within 24 hours.`,
      balance: updatedUser.walletBalance,
      transaction,
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: error.message || 'Failed to process withdrawal request' });
  }
});

// POST /api/wallet/pay-slot — Pay for slot using wallet balance
router.post('/pay-slot', userProtect, async (req, res) => {
  const { slotId } = req.body;
  if (!slotId) {
    return res.status(400).json({ message: 'slotId is required' });
  }

  try {
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    // Check slot availability
    const bookingCount = await Booking.countDocuments({
      slotId,
      paymentStatus: { $in: ['pending_verification', 'paid'] },
    });

    const maxTeams = slot.maxTeams || 20;
    if (bookingCount >= maxTeams) {
      return res.status(400).json({ message: 'This slot is SOLD OUT' });
    }

    // Check existing booking
    const existing = await Booking.findOne({ userId: req.user._id, slotId });
    if (existing) {
      if (existing.paymentStatus === 'paid') {
        return res.status(400).json({ message: 'You have already booked this slot' });
      }
      if (existing.paymentStatus === 'pending_verification') {
        return res.status(400).json({ message: 'Your payment is currently pending admin verification for this slot.' });
      }
    }

    const price = Number(slot.price ?? slot.entryFee ?? 0);
    const user = await User.findById(req.user._id);

    if ((user.walletBalance || 0) < price) {
      return res.status(400).json({
        message: `Insufficient wallet balance (₹${user.walletBalance || 0}). Required: ₹${price}. Please add funds to your wallet.`,
      });
    }

    // Deduct wallet balance atomically
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id, walletBalance: { $gte: price } },
      { $inc: { walletBalance: -price } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: 'Failed to process payment from wallet.' });
    }

    const txnId = generateTxnId('WAL_PAY');

    // Create or update booking
    let booking;
    if (existing) {
      existing.paymentStatus = 'paid';
      existing.paymentMethod = 'wallet';
      existing.paidAt = new Date();
      existing.amount = price;
      existing.paymentId = txnId;
      booking = await existing.save();
    } else {
      booking = await Booking.create({
        userId: user._id,
        slotId: slot._id,
        type: 'slot',
        amount: price,
        paymentStatus: 'paid',
        paymentMethod: 'wallet',
        merchantTransactionId: txnId,
        paymentId: txnId,
        paidAt: new Date(),
      });
    }

    // Record transaction
    await Transaction.create({
      userId: user._id,
      transactionId: txnId,
      type: 'payment',
      amount: price,
      status: 'success',
      relatedItem: slot.matchName || 'Slot Registration',
      relatedId: slot._id,
      notes: `Paid ₹${price} from wallet for slot registration`,
    });

    res.json({
      message: 'Slot successfully booked using wallet balance!',
      booking,
      balance: updatedUser.walletBalance,
    });
  } catch (error) {
    console.error('Slot wallet payment error:', error);
    res.status(500).json({ message: error.message || 'Payment failed' });
  }
});

// POST /api/wallet/pay-tournament — Pay for tournament using wallet balance
router.post('/pay-tournament', userProtect, async (req, res) => {
  const { tournamentId } = req.body;
  if (!tournamentId) {
    return res.status(400).json({ message: 'tournamentId is required' });
  }

  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (!tournament.registrationOpen) {
      return res.status(400).json({ message: 'Registration is currently closed for this tournament' });
    }

    // Check existing booking
    const existing = await Booking.findOne({ userId: req.user._id, tournamentId });
    if (existing) {
      if (existing.paymentStatus === 'paid') {
        return res.status(400).json({ message: 'You have already registered for this tournament' });
      }
      if (existing.paymentStatus === 'pending_verification') {
        return res.status(400).json({ message: 'Your payment is currently pending admin verification for this tournament.' });
      }
    }

    const price = Number(tournament.entryFee || 0);
    const user = await User.findById(req.user._id);

    if ((user.walletBalance || 0) < price) {
      return res.status(400).json({
        message: `Insufficient wallet balance (₹${user.walletBalance || 0}). Required: ₹${price}. Please add funds to your wallet.`,
      });
    }

    // Deduct wallet balance atomically
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id, walletBalance: { $gte: price } },
      { $inc: { walletBalance: -price } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: 'Failed to process payment from wallet.' });
    }

    const txnId = generateTxnId('WAL_TOUR');

    // Create or update booking
    let booking;
    if (existing) {
      existing.paymentStatus = 'paid';
      existing.paymentMethod = 'wallet';
      existing.paidAt = new Date();
      existing.amount = price;
      existing.paymentId = txnId;
      booking = await existing.save();
    } else {
      booking = await Booking.create({
        userId: user._id,
        tournamentId: tournament._id,
        type: 'tournament',
        amount: price,
        paymentStatus: 'paid',
        paymentMethod: 'wallet',
        merchantTransactionId: txnId,
        paymentId: txnId,
        paidAt: new Date(),
      });
    }

    // Record transaction
    await Transaction.create({
      userId: user._id,
      transactionId: txnId,
      type: 'payment',
      amount: price,
      status: 'success',
      relatedItem: tournament.title || 'Tournament Registration',
      relatedId: tournament._id,
      notes: `Paid ₹${price} from wallet for tournament registration`,
    });

    res.json({
      message: 'Tournament successfully registered using wallet balance!',
      booking,
      balance: updatedUser.walletBalance,
    });
  } catch (error) {
    console.error('Tournament wallet payment error:', error);
    res.status(500).json({ message: error.message || 'Payment failed' });
  }
});

// ──────────────── ADMIN ROUTES ────────────────

// GET /api/wallet/admin/all — Admin: Get all transactions, stats, and filter by type/status
router.get('/admin/all', protect, async (req, res) => {
  try {
    const { type, status, search } = req.query;
    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;

    const transactions = await Transaction.find(filter)
      .populate('userId', 'phone teamName registrationNumber')
      .sort({ createdAt: -1 })
      .limit(300);

    const [pendingDeposits, pendingWithdrawals, pendingBookings] = await Promise.all([
      Transaction.countDocuments({ type: 'add_balance', status: { $in: ['pending', 'pending_verification'] } }),
      Transaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
      Booking.countDocuments({ paymentStatus: 'pending_verification' }),
    ]);

    res.json({
      transactions,
      counts: {
        pendingDeposits,
        pendingWithdrawals,
        pendingBookings,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/wallet/admin/deposits — Admin: view all wallet deposit requests
router.get('/admin/deposits', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { type: 'add_balance' };
    if (status && status !== 'all') {
      filter.status = status;
    }
    const deposits = await Transaction.find(filter)
      .populate('userId', 'phone teamName registrationNumber')
      .sort({ createdAt: -1 });
    res.json(deposits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/wallet/admin/deposits/:id/verify — Admin: Approve or Reject a wallet deposit
// ONLY here is the user's wallet credited once real payment is confirmed by Admin!
router.put('/admin/deposits/:id/verify', protect, async (req, res) => {
  const { status, notes } = req.body; // 'success' or 'rejected'

  if (!['success', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be success or rejected' });
  }

  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Deposit transaction not found' });
    }

    if (transaction.type !== 'add_balance') {
      return res.status(400).json({ message: 'Only wallet deposit requests can be verified here' });
    }

    if (transaction.status === 'success') {
      return res.status(400).json({ message: 'This deposit has already been approved and credited' });
    }

    if (transaction.status === 'rejected') {
      return res.status(400).json({ message: 'This deposit has already been rejected' });
    }

    const adminUsername = req.admin?.username || 'admin';
    transaction.status = status;
    transaction.verifiedBy = adminUsername;
    transaction.verifiedAt = new Date();
    if (notes) transaction.notes = notes;

    if (status === 'success') {
      // Real payment verified -> CREDIT USER WALLET
      const updatedUser = await User.findByIdAndUpdate(
        transaction.userId,
        { $inc: { walletBalance: transaction.amount } },
        { new: true }
      );

      await transaction.save();

      console.log(`[Deposit Approved] Admin ${adminUsername} credited ₹${transaction.amount} to User ${transaction.userId}`);

      return res.json({
        success: true,
        message: `Approved! ₹${transaction.amount} has been successfully added to the user's wallet.`,
        transaction,
        balance: updatedUser ? updatedUser.walletBalance : undefined,
      });
    } else {
      // Payment rejected -> ZERO BALANCE ADDED
      transaction.rejectionReason = notes || 'Payment rejected by admin';
      await transaction.save();

      console.log(`[Deposit Rejected] Admin ${adminUsername} rejected deposit ${transaction._id}`);

      return res.json({
        success: true,
        message: 'Deposit request rejected. No funds were added.',
        transaction,
      });
    }
  } catch (error) {
    console.error('Deposit verification error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/wallet/admin/withdrawals — Admin: view all withdrawal requests
router.get('/admin/withdrawals', protect, async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: 'withdrawal' })
      .populate('userId', 'phone teamName registrationNumber')
      .sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/wallet/admin/withdrawals/:id — Admin: approve or reject withdrawal
router.put('/admin/withdrawals/:id', protect, async (req, res) => {
  const { status, notes } = req.body; // 'success' or 'rejected'
  if (!['success', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be success or rejected' });
  }

  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: `Withdrawal has already been marked as ${transaction.status}` });
    }

    const adminUsername = req.admin?.username || 'admin';
    transaction.status = status;
    transaction.verifiedBy = adminUsername;
    transaction.verifiedAt = new Date();
    if (notes) transaction.notes = notes;
    await transaction.save();

    // If rejected, refund the money back to the user's wallet!
    if (status === 'rejected') {
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: { walletBalance: transaction.amount },
      });

      // Record refund transaction
      await Transaction.create({
        userId: transaction.userId,
        transactionId: generateTxnId('WAL_REF'),
        type: 'refund',
        amount: transaction.amount,
        status: 'success',
        relatedItem: 'Withdrawal Refund',
        notes: notes || 'Withdrawal rejected and refunded back to wallet',
        verifiedBy: adminUsername,
        verifiedAt: new Date(),
      });
    }

    res.json({ message: `Withdrawal marked as ${status}`, transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/wallet/admin/adjust-balance — Admin: Manually credit or debit user balance (Prizes, corrections)
router.post('/admin/adjust-balance', protect, async (req, res) => {
  const { userId, type, amount, reason } = req.body; // type: 'credit' | 'debit'
  const numAmount = Number(amount);

  if (!userId || !numAmount || numAmount <= 0) {
    return res.status(400).json({ message: 'Valid userId and positive amount are required.' });
  }

  if (!['credit', 'debit'].includes(type)) {
    return res.status(400).json({ message: 'Type must be "credit" or "debit".' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (type === 'debit' && (user.walletBalance || 0) < numAmount) {
      return res.status(400).json({
        message: `Insufficient balance (₹${user.walletBalance || 0}) to debit ₹${numAmount}`,
      });
    }

    const incAmount = type === 'credit' ? numAmount : -numAmount;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { walletBalance: incAmount } },
      { new: true }
    );

    const adminUsername = req.admin?.username || 'admin';
    const txnId = generateTxnId('WAL_ADJ');

    const transaction = await Transaction.create({
      userId,
      transactionId: txnId,
      type: 'admin_adjustment',
      amount: numAmount,
      status: 'success',
      paymentMethod: type === 'credit' ? 'admin_credit' : 'admin_debit',
      relatedItem: `Manual Admin ${type.toUpperCase()}`,
      notes: reason || `Admin adjusted balance by ${type === 'credit' ? '+' : '-'}₹${numAmount}`,
      verifiedBy: adminUsername,
      verifiedAt: new Date(),
    });

    res.json({
      success: true,
      message: `Successfully ${type === 'credit' ? 'credited' : 'debited'} ₹${numAmount} for ${user.teamName || user.phone}.`,
      balance: updatedUser.walletBalance,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
