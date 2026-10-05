import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  entryFee: { type: Number, required: true, min: 0 },
  prizePool: [{
    position: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 }
  }],
  matchName: { type: String, trim: true },
  slotTime: { type: Date },
  roomId: { type: String },
  roomPassword: { type: String },
  price: { type: Number, min: 0 },
  maxTeams: { type: Number, default: 20, min: 1 },
  heroImage: { type: String, default: '' },   // Base64 data URI for the poster image
  mode: {
    type: String, // e.g., 'Squad', 'Solo', 'TPP'
    default: ''
  },
  date: {
    type: String, // e.g., '25 July 2026'
    default: ''
  },
  teams: {
    type: String, // e.g., '18-19 Teams (Fixed Lobby)'
    default: ''
  },
  timing: {
    type: String, // e.g., '9:00 PM'
    default: ''
  },
  maps: { type: [String], default: [] },       // e.g. ["Erangel", "Miramar"]
  note: { type: String, default: '' },         // ID / password note text
  registerText: { type: String, default: 'Register Now' },
  category: {
    type: String,
    default: 'SCRIMS',
    trim: true,
  },
  lobby: {
    type: String,
    default: 'LOBBY 1',
    trim: true,
  },
  scheduleMatches: [{
    matchNumber: { type: Number },
    label: { type: String, default: '' },
    time: { type: String, default: '' },
  }],
  prizeDistribution: [{
    rank: { type: String, default: '' },
    prize: { type: String, default: '' },
  }],
  whatsappLink: { type: String, default: '' }, // WhatsApp group invite link — only returned to paid users
  customLink: { type: String, default: '' },   // Custom slot link uploaded by admin (e.g. WhatsApp, Discord, or match URL)
}, { timestamps: true });

export const Slot = mongoose.model('Slot', slotSchema);
