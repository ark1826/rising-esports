import mongoose from 'mongoose';

const teamResultItemSchema = new mongoose.Schema({
  position: { type: Number, required: true, min: 1 },
  teamName: { type: String, required: true, trim: true },
  teamTag: { type: String, default: '', trim: true },
  kills: { type: Number, default: 0, min: 0 },
  placementPoints: { type: Number, default: 0, min: 0 },
  totalPoints: { type: Number, default: 0, min: 0 },
}, { _id: false });

const matchResultSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: false },
  matchName: { type: String, required: true, trim: true },
  date: { type: String, required: true, trim: true }, // Format: YYYY-MM-DD
  timing: { type: String, default: '', trim: true },
  lobby: { type: String, default: 'LOBBY 01', trim: true },
  mode: { type: String, default: 'Squad TPP', trim: true },
  imageUrl: { type: String, default: '', trim: true }, // Result Photo / Point Table Image
  results: { type: [teamResultItemSchema], default: [] },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

export const MatchResult = mongoose.model('MatchResult', matchResultSchema);
