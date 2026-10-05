import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
  type: { type: String, enum: ['slot', 'tournament'], default: 'slot' },
  amount: { type: Number },

  paymentStatus: {
    type: String,
    enum: ['pending', 'pending_verification', 'paid', 'failed'],
    default: 'pending',
  },

  // Payment method used
  paymentMethod: {
    type: String,
    enum: ['wallet', 'upi', 'other'],
    default: 'other',
  },

  // UPI transaction reference (UTR number) submitted by user
  utrNumber: { type: String, trim: true },

  // Admin notes when verifying/rejecting a UPI payment
  verificationNote: { type: String },
  verifiedAt: { type: Date },
  verifiedBy: { type: String }, // admin username

  // Drop locations for this booking (map-wise: e.g. { erangel: 'Pochinki', rondo: 'Jadena City' })
  dropLocations: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Legacy / compat fields
  merchantTransactionId: { type: String, index: true },
  cfOrderId: { type: String },
  paymentSessionId: { type: String },
  razorpayOrderId: { type: String },
  paymentId: { type: String },
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
