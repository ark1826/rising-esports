import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionId: { type: String, required: true, unique: true, index: true },
  type: {
    type: String,
    enum: ['add_balance', 'withdrawal', 'payment', 'refund', 'admin_adjustment'],
    required: true,
  },
  amount: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ['success', 'pending', 'pending_verification', 'failed', 'rejected'],
    default: 'pending',
  },
  paymentMethod: { type: String, default: 'upi', trim: true },
  utrNumber: { type: String, default: '', trim: true, index: true },
  upiId: { type: String, default: '', trim: true },
  notes: { type: String, default: '', trim: true },
  relatedItem: { type: String, default: '', trim: true }, // e.g., 'Slot: Prime Scrims' or 'Wallet Deposit'
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  verifiedBy: { type: String, default: '', trim: true },
  verifiedAt: { type: Date },
  rejectionReason: { type: String, default: '', trim: true },
  cfOrderId: { type: String, index: true }, // Cashfree order id if applicable
  cfPaymentId: { type: String },
}, { timestamps: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);
