import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
  type: { type: String, enum: ['slot', 'tournament'], default: 'slot' },
  amount: { type: Number },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  merchantTransactionId: { type: String, index: true }, // Cashfree order_id (e.g., order_xxx) or legacy transaction ID
  cfOrderId: { type: String }, // Cashfree system reference ID
  paymentSessionId: { type: String }, // Cashfree payment session ID
  razorpayOrderId: { type: String }, // Kept for backwards compatibility with existing records
  paymentId: { type: String }, // Cashfree reference ID / transaction ID
  paidAt: { type: Date },
}, { timestamps: true });

// Partial indexes: only enforce uniqueness among documents that actually have slotId / tournamentId
bookingSchema.index(
  { userId: 1, slotId: 1 },
  { unique: true, partialFilterExpression: { slotId: { $exists: true } } }
);
bookingSchema.index(
  { userId: 1, tournamentId: 1 },
  { unique: true, partialFilterExpression: { tournamentId: { $exists: true } } }
);

export const Booking = mongoose.model('Booking', bookingSchema);

