import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: { type: String, default: 'Official Announcement', trim: true },
  content: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 1 },
  author: { type: String, default: 'Rising Esports Admin' },
}, { timestamps: true });

export const Announcement = mongoose.model('Announcement', announcementSchema);
