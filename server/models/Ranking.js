import mongoose from 'mongoose';

const rankingSchema = new mongoose.Schema({
  rank: { type: Number, required: true, min: 1 },
  teamName: { type: String, required: true },
  teamTag: { type: String },
  totalMatches: { type: Number, default: 0, min: 0 },
  finishes: { type: Number, default: 0, min: 0 },
  wwcd: { type: Number, default: 0, min: 0 },
  totalPoints: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

export const Ranking = mongoose.model('Ranking', rankingSchema);
