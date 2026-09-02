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
  whatsappLink: { type: String, default: '' }, // WhatsApp group invite link — only returned to paid users
}, { timestamps: true });

export const Slot = mongoose.model('Slot', slotSchema);
