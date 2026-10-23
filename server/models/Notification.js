import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'withdrawal_approved',
        'withdrawal_rejected',
        'deposit_approved',
        'deposit_rejected',
        'wallet_credit',
        'wallet_debit',
        'booking_approved',
        'booking_rejected',
        'general',
      ],
      default: 'general',
      index: true,
    },
    amount: {
      type: Number,
    },
    status: {
      type: String, // 'approved', 'rejected', 'credited', 'debited'
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
