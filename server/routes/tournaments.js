import express from 'express';
import multer from 'multer';
import { Tournament } from '../models/Tournament.js';
import { Booking } from '../models/Booking.js';
import { protect, userProtect } from '../middleware/auth.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    },
});

// GET /api/tournaments/my-registrations (User-authenticated)
router.get('/my-registrations', userProtect, async(req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id, tournamentId: { $exists: true, $ne: null } });
        const regMap = {};
        bookings.forEach(b => {
            if (b.tournamentId) {
                regMap[b.tournamentId.toString()] = {
                    bookingId: b._id,
                    paymentStatus: b.paymentStatus,
                    merchantTransactionId: b.merchantTransactionId || b.razorpayOrderId,
                };
            }
        });
        res.json(regMap);
    } catch (error) {
        console.error('Error in /tournaments/my-registrations:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/', async(_req, res) => {
    try {
        const tournaments = await Tournament.find().sort({ createdAt: -1 });
        res.json(tournaments.map(tournament => {
            const item = tournament.toObject();
            item.hasPoster = Boolean(item.poster);
            if (item.poster && item.poster.startsWith('http')) {
                item.posterUrl = item.poster;
            }
            delete item.poster;
            return item;
        }));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id/poster', async(req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id).select('poster');
        if (!tournament || !tournament.poster) {
            return res.status(404).json({ message: 'Poster not found' });
        }

        // If stored as Cloudinary URL, redirect directly
        if (tournament.poster.startsWith('http://') || tournament.poster.startsWith('https://')) {
            return res.redirect(tournament.poster);
        }

        const match = tournament.poster.match(/^data:(.+);base64,(.+)$/);
        if (!match) return res.status(400).json({ message: 'Invalid poster data' });
        res.set('Content-Type', match[1]);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(Buffer.from(match[2], 'base64'));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', protect, async(req, res) => {
    try {
        const tournament = await Tournament.create(req.body);
        res.status(201).json(tournament);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/:id', protect, async(req, res) => {
    try {
        const tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
        res.json(tournament);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Upload poster to Cloudinary & save URL in MongoDB
router.post('/:id/upload-poster', protect, upload.single('poster'), async(req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No poster file provided' });

        let posterUrl = '';
        try {
            // Upload to Cloudinary
            const result = await uploadToCloudinary(req.file.buffer, 'rising-esports/tournaments');
            posterUrl = result.secure_url;
        } catch (cloudErr) {
            console.warn('[Cloudinary Notice]', cloudErr.message, '- Falling back to data URI format.');
            posterUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        const tournament = await Tournament.findByIdAndUpdate(req.params.id, { poster: posterUrl }, { new: true });
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        res.json({
            message: 'Poster uploaded successfully to Cloudinary',
            posterUrl: tournament.poster.startsWith('http') ? tournament.poster : `/api/tournaments/${tournament._id}/poster`,
        });
    } catch (error) {
        console.error('Tournament poster upload error:', error);
        res.status(500).json({ message: error.message || 'Poster upload failed' });
    }
});

router.delete('/:id', protect, async(req, res) => {
    try {
        const tournament = await Tournament.findByIdAndDelete(req.params.id);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
        res.json({ message: 'Tournament removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;