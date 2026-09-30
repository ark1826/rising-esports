import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  matchName: { type: String, required: true, trim: true },
  date: { type: String, required: true, trim: true }, // Format: YYYY-MM-DD
  timing: { type: String, required: true, trim: true }, // e.g. "9:00 PM"
  mode: { type: String, default: 'Squad TPP', trim: true },
  maps: [{ type: String, trim: true }],
  status: {
    type: String,
    enum: ['UPCOMING', 'LIVE', 'COMPLETED'],
    default: 'UPCOMING',
  },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  totalTeams: { type: Number, default: 20 },
  entryFee: { type: Number, default: 0 },
  prizePool: { type: Number, default: 0 },
  notes: { type: String, default: '', trim: true },
}, { timestamps: true });

export const Match = mongoose.model('Match', matchSchema);
