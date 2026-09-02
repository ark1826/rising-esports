import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    game: { type: String, default: 'BGMI', trim: true },
    date: { type: String, default: '', trim: true },
    location: { type: String, default: 'ONLINE TOURNAMENT', trim: true },
    prizePool: { type: Number, default: 0, min: 0 },
    entryFee: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['OPEN', 'UPCOMING', 'CLOSED'], default: 'UPCOMING' },
    registrationOpen: { type: Boolean, default: false },
    description: { type: String, default: '', trim: true },
    poster: { type: String, default: '' },
}, { timestamps: true });

export const Tournament = mongoose.model('Tournament', tournamentSchema);