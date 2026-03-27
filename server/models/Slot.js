import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  entryFee: { type: Number, required: true, min: 0 },
  prizePool: [{
    position: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 }
  }],
}, { timestamps: true });

export const Slot = mongoose.model('Slot', slotSchema);
