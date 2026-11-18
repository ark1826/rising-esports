import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['PLAYER', 'TEAM'],
    required: true,
  },
  device: {
    type: String,
    required: [true, 'Device is required'],
    trim: true,
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true,
  },
  // Availability is used for Looking for Player
  availability: {
    type: String,
    trim: true,
    default: '',
  },
  // Playing Time is used for Looking for Team
  playingTime: {
    type: String,
    trim: true,
    default: '',
  },
  age: {
    type: String,
    required: [true, 'Age is required'],
    trim: true,
  },
  experience: {
    type: String,
    required: [true, 'Experience is required'],
    trim: true,
  },
  contact: {
    type: String,
    required: [true, 'Contact information is required'],
    trim: true,
  },
  achievements: {
    type: String,
    trim: true,
    default: '',
  },
  additionalInfo: {
    type: String,
    trim: true,
    default: '',
  },
  // Clips URL for Looking for Team (YouTube or Instagram)
  clips: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active',
  },
}, { timestamps: true });

export const Requirement = mongoose.model('Requirement', requirementSchema);

