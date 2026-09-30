import express from 'express';
import multer from 'multer';
import { Slot } from '../models/Slot.js';
import { Booking } from '../models/Booking.js';
import { protect, userProtect } from '../middleware/auth.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

// Multer: memory storage (no disk writes – Vercel/Render compatible)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    },
});

// Helper to parse slotTime from date and timing strings
const parseSlotTime = (body) => {
    if (body.date && body.timing) {
        const dateStr = `${body.date} ${body.timing}`;
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
            body.slotTime = parsedDate;
        }
    } else if (body.slotTime) {
        const d = new Date(body.slotTime);
        if (!isNaN(d.getTime())) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            body.date = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
            let hours = d.getHours();
            const minutes = d.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            body.timing = `${hours}:${minutes} ${ampm}`;
        }
    }
};

// ──────────────── ADMIN GET ALL SLOTS (WITH ROOM CREDENTIALS) ────────────────
router.get('/admin', protect, async(req, res) => {
    try {
        const slots = await Slot.find().sort({ slotTime: 1, createdAt: -1 });

        // Attach booking counts and registered teams preview
        const slotIds = slots.map(s => s._id);
        const [bookingCounts, bookings] = await Promise.all([
            Booking.aggregate([
                { $match: { slotId: { $in: slotIds }, paymentStatus: { $in: ['pending', 'paid', 'pending_verification'] } } },
                { $group: { _id: '$slotId', count: { $sum: 1 } } },
            ]),
            Booking.find({
                slotId: { $in: slotIds },
                paymentStatus: { $in: ['pending', 'paid', 'pending_verification'] }
            }).populate('userId', 'teamName teamTag registrationNumber').lean(),
        ]);

        const countMap = {};
        bookingCounts.forEach(b => { countMap[b._id.toString()] = b.count; });

        const teamsMap = {};
        bookings.forEach(b => {
            const sId = b.slotId?.toString();
            if (!sId) return;
            if (!teamsMap[sId]) teamsMap[sId] = [];
            const u = b.userId;
            teamsMap[sId].push({
                teamName: u?.teamName || 'Unknown Team',
                teamTag: u?.teamTag || '',
                registrationNumber: u?.registrationNumber || '',
                paymentStatus: b.paymentStatus,
            });
        });

        const result = slots.map(slot => {
            const obj = slot.toObject();
            obj.hasHeroImage = Boolean(obj.heroImage);
            if (obj.heroImage && obj.heroImage.startsWith('http')) {
                obj.heroImageUrl = obj.heroImage;
            }
            const bookedTeams = teamsMap[slot._id.toString()] || [];
            const booked = countMap[slot._id.toString()] || bookedTeams.length || 0;
            const maxTeams = slot.maxTeams || 20;
            const remaining = Math.max(0, maxTeams - booked);
            return {
                ...obj,
                bookedCount: booked,
                remainingSlots: remaining,
                isSoldOut: remaining <= 0,
                bookedTeams,
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ──────────────── PUBLIC ROUTES ────────────────

// Get all slots (WITHOUT roomId / roomPassword / heroImage base64)
router.get('/', async(req, res) => {
    try {
        const slots = await Slot.find()
            .select('-roomId -roomPassword -whatsappLink')
            .sort({ slotTime: 1, createdAt: -1 });

        // Attach booking counts and registered teams preview
        const slotIds = slots.map(s => s._id);
        const [bookingCounts, bookings] = await Promise.all([
            Booking.aggregate([
                { $match: { slotId: { $in: slotIds }, paymentStatus: { $in: ['pending', 'paid', 'pending_verification'] } } },
                { $group: { _id: '$slotId', count: { $sum: 1 } } },
            ]),
            Booking.find({
                slotId: { $in: slotIds },
                paymentStatus: { $in: ['pending', 'paid', 'pending_verification'] }
            }).populate('userId', 'teamName teamTag registrationNumber').lean(),
        ]);

        const countMap = {};
        bookingCounts.forEach(b => { countMap[b._id.toString()] = b.count; });

        const teamsMap = {};
        bookings.forEach(b => {
            const sId = b.slotId?.toString();
            if (!sId) return;
            if (!teamsMap[sId]) teamsMap[sId] = [];
            const u = b.userId;
            teamsMap[sId].push({
                teamName: u?.teamName || 'Unknown Team',
                teamTag: u?.teamTag || '',
                registrationNumber: u?.registrationNumber || '',
                paymentStatus: b.paymentStatus,
            });
        });

        const result = slots.map(slot => {
            const obj = slot.toObject();
            obj.hasHeroImage = Boolean(obj.heroImage);
            if (obj.heroImage && obj.heroImage.startsWith('http')) {
                obj.heroImageUrl = obj.heroImage;
            }
            const bookedTeams = teamsMap[slot._id.toString()] || [];
            const booked = countMap[slot._id.toString()] || bookedTeams.length || 0;
            const maxTeams = slot.maxTeams || 20;
            const remaining = Math.max(0, maxTeams - booked);
            return {
                ...obj,
                bookedCount: booked,
                remainingSlots: remaining,
                isSoldOut: remaining <= 0,
                bookedTeams,
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get hero image for a single slot (returns the image binary or redirects to Cloudinary)
router.get('/:id/image', async(req, res) => {
    try {
        const slot = await Slot.findById(req.params.id).select('heroImage');
        if (!slot || !slot.heroImage) {
            return res.status(404).json({ message: 'No image found' });
        }

        // If stored as Cloudinary URL, redirect directly
        if (slot.heroImage.startsWith('http://') || slot.heroImage.startsWith('https://')) {
            return res.redirect(slot.heroImage);
        }

        // heroImage stored as "data:image/png;base64,AAAA..."
        const matches = slot.heroImage.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({ message: 'Invalid image data' });
        }

        const mimeType = matches[1];
        const imgBuffer = Buffer.from(matches[2], 'base64');
        res.set('Content-Type', mimeType);
        res.set('Cache-Control', 'public, max-age=86400'); // cache 24h
        res.send(imgBuffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ──────────────── USER ROUTES ────────────────

// Get booking status for current user across all slots
router.get('/my-bookings', userProtect, async(req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id, slotId: { $exists: true, $ne: null } });
        const bookingMap = {};
        bookings.forEach(b => {
            if (b.slotId) {
                bookingMap[b.slotId.toString()] = {
                    bookingId: b._id,
                    paymentStatus: b.paymentStatus,
                    merchantTransactionId: b.merchantTransactionId || b.razorpayOrderId,
                };
            }
        });
        res.json(bookingMap);
    } catch (error) {
        console.error('Error in /slots/my-bookings:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get room credentials (payment gated - reflects admin updates immediately)
router.get('/:slotId/room-credentials', userProtect, async(req, res) => {
    try {
        const { slotId } = req.params;
        const userId = req.user._id;

        // 1. Verify user has a paid booking
        const booking = await Booking.findOne({ userId, slotId, paymentStatus: 'paid' });
        if (!booking) {
            return res.status(403).json({
                error: 'payment_required',
                message: 'No paid booking found for this slot. Please complete slot payment first.',
            });
        }

        // 2. Fetch fresh slot data directly from DB
        const slot = await Slot.findById(slotId);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        // Disable caching so admin updates reflect in real-time
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        const hasRoomId = Boolean(slot.roomId && slot.roomId.trim() && slot.roomId.trim() !== 'TBA');
        const hasPassword = Boolean(slot.roomPassword && slot.roomPassword.trim() && slot.roomPassword.trim() !== 'TBA');

        // If admin hasn't set credentials yet and slot time is in the future (>30 min away)
        if (!hasRoomId && !hasPassword && slot.slotTime) {
            const now = new Date();
            const unlockAt = new Date(slot.slotTime.getTime() - 30 * 60 * 1000);
            if (now < unlockAt) {
                return res.json({
                    roomId: 'TBA',
                    roomPassword: 'TBA',
                    whatsappLink: slot.whatsappLink || '',
                    isScheduled: true,
                    message: 'Credentials have not been posted by admin yet. They will appear here once updated or 30 minutes before match.',
                    unlockAt: unlockAt.toISOString(),
                });
            }
        }

        // Return the updated credentials set by the admin
        res.json({
            roomId: slot.roomId || 'TBA',
            roomPassword: slot.roomPassword || 'TBA',
            whatsappLink: slot.whatsappLink || '',
            matchName: slot.matchName || '',
            date: slot.date || '',
            timing: slot.timing || '',
            note: slot.note || '',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ──────────────── ADMIN ROUTES ────────────────

// Create slot
router.post('/', protect, async(req, res) => {
    try {
        const count = await Slot.countDocuments();
        if (count >= 50) {
            return res.status(400).json({ message: 'Maximum limit of 50 slots reached.' });
        }

        if (typeof req.body.maps === 'string') {
            req.body.maps = req.body.maps.split(',').map(m => m.trim().toUpperCase()).filter(Boolean);
        }
        if (req.body.entryFee !== undefined && (req.body.price === undefined || req.body.price === null)) {
            req.body.price = Number(req.body.entryFee);
        } else if (req.body.price !== undefined && (req.body.entryFee === undefined || req.body.entryFee === null)) {
            req.body.entryFee = Number(req.body.price);
        }

        if (req.body.matchName && req.body.date) {
            const query = {
                matchName: req.body.matchName.trim(),
                date: req.body.date.trim(),
            };
            if (req.body.lobby) query.lobby = req.body.lobby.trim();
            if (req.body.timing) query.timing = req.body.timing.trim();

            const duplicate = await Slot.findOne(query).select('_id');
            if (duplicate) {
                return res.status(409).json({ message: 'A slot with this match name, date, and lobby/timing already exists.' });
            }
        }

        parseSlotTime(req.body);
        const slot = await Slot.create(req.body);
        res.status(201).json(slot);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update slot (all fields except image)
router.put('/:id', protect, async(req, res) => {
    try {
        if (typeof req.body.maps === 'string') {
            req.body.maps = req.body.maps.split(',').map(m => m.trim().toUpperCase()).filter(Boolean);
        }
        if (req.body.entryFee !== undefined && (req.body.price === undefined || req.body.price === null)) {
            req.body.price = Number(req.body.entryFee);
        } else if (req.body.price !== undefined && (req.body.entryFee === undefined || req.body.entryFee === null)) {
            req.body.entryFee = Number(req.body.price);
        }

        parseSlotTime(req.body);
        const slot = await Slot.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(slot);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Upload / replace hero image for a slot (Uploads to Cloudinary & saves URL in MongoDB)
router.post('/:id/upload-image', protect, upload.single('heroImage'), async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        let imageUrl = '';
        try {
            // Try uploading to Cloudinary
            const result = await uploadToCloudinary(req.file.buffer, 'rising-esports/slots');
            imageUrl = result.secure_url;
        } catch (cloudErr) {
            console.warn('[Cloudinary Notice]', cloudErr.message, '- Falling back to data URI format.');
            const base64 = req.file.buffer.toString('base64');
            imageUrl = `data:${req.file.mimetype};base64,${base64}`;
        }

        const slot = await Slot.findByIdAndUpdate(
            req.params.id, { heroImage: imageUrl }, { new: true }
        );

        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        res.json({
            message: 'Image uploaded successfully to Cloudinary',
            imageUrl: slot.heroImage.startsWith('http') ? slot.heroImage : `/api/slots/${slot._id}/image`,
        });
    } catch (error) {
        console.error('Slot image upload error:', error);
        res.status(500).json({ message: error.message || 'Image upload failed' });
    }
});

// Delete slot
router.delete('/:id', protect, async(req, res) => {
    try {
        const slot = await Slot.findByIdAndDelete(req.params.id);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }
        res.json({ message: 'Slot removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;