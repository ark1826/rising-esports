import express from 'express';
import multer from 'multer';
import { Slot } from '../models/Slot.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
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
    // If scheduleMatches is provided and has matches with time, but body.timing is empty
    if (Array.isArray(body.scheduleMatches) && body.scheduleMatches.length > 0 && body.scheduleMatches[0].time && !body.timing) {
        body.timing = body.scheduleMatches[0].time.trim();
    }
    // If timing is provided and scheduleMatches exists, sync first match time
    if (body.timing && Array.isArray(body.scheduleMatches) && body.scheduleMatches.length > 0) {
        body.scheduleMatches[0].time = body.timing.trim();
    }
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

        // Attach booking counts and registered teams preview (confirmed paid only)
        const slotIds = slots.map(s => s._id);
        const [bookingCounts, bookings] = await Promise.all([
            Booking.aggregate([
                { $match: { slotId: { $in: slotIds }, paymentStatus: 'paid' } },
                { $group: { _id: '$slotId', count: { $sum: 1 } } },
            ]),
            Booking.find({
                slotId: { $in: slotIds },
                paymentStatus: 'paid'
            })
            .sort({ createdAt: 1 })
            .populate('userId', 'teamName teamTag registrationNumber teamLogo erangelDrop rondoDrop miramarDrop phone')
            .lean(),
        ]);

        const countMap = {};
        bookingCounts.forEach(b => { countMap[b._id.toString()] = b.count; });

        const teamsMap = {};
        bookings.forEach(b => {
            const sId = b.slotId?.toString();
            if (!sId) return;
            if (!teamsMap[sId]) teamsMap[sId] = [];
            const u = b.userId;
            const bDrops = b.dropLocations || {};
            const erangelDrop = (u?.erangelDrop && u.erangelDrop.trim()) || (bDrops.erangel && bDrops.erangel.trim()) || (bDrops.erangle && bDrops.erangle.trim()) || '';
            const rondoDrop = (u?.rondoDrop && u.rondoDrop.trim()) || (bDrops.rondo && bDrops.rondo.trim()) || '';
            const miramarDrop = (u?.miramarDrop && u.miramarDrop.trim()) || (bDrops.miramar && bDrops.miramar.trim()) || '';
            const sanhokDrop = (bDrops.sanhok && bDrops.sanhok.trim()) || '';
            const vikendiDrop = (bDrops.vikendi && bDrops.vikendi.trim()) || '';
            teamsMap[sId].push({
                bookingId: b._id,
                userId: u?._id,
                teamName: u?.teamName || (u?.phone ? `Team ${u.phone.slice(-4)}` : 'Unknown Team'),
                teamTag: u?.teamTag || '',
                teamLogo: u?.teamLogo || '',
                registrationNumber: u?.registrationNumber || '',
                phone: u?.phone || '',
                paymentStatus: b.paymentStatus,
                erangelDrop,
                rondoDrop,
                miramarDrop,
                dropLocations: {
                    ...bDrops,
                    erangel: erangelDrop,
                    rondo: rondoDrop,
                    miramar: miramarDrop,
                    sanhok: sanhokDrop,
                    vikendi: vikendiDrop,
                },
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

// Get all slots (WITHOUT roomId / roomPassword / heroImage base64 / customLink)
router.get('/', async(req, res) => {
    try {
        const query = { isPublished: { $ne: false } };
        if (req.query.category && req.query.category !== 'ALL') {
            const raw = req.query.category.trim();
            if (/scrim/i.test(raw)) {
                query.category = { $regex: /scrim/i };
            } else if (/weekly/i.test(raw)) {
                query.category = { $regex: /weekly/i };
            } else if (/weekend/i.test(raw)) {
                query.category = { $regex: /weekend/i };
            } else if (/grand/i.test(raw)) {
                query.category = { $regex: /grand/i };
            } else {
                query.category = { $regex: new RegExp(`^${raw}$`, 'i') };
            }
        }
        const slots = await Slot.find(query)
            .select('-roomId -roomPassword -whatsappLink -customLink')
            .sort({ slotTime: 1, createdAt: -1 });

        // Attach booking counts and registered teams preview (confirmed paid only)
        const slotIds = slots.map(s => s._id);
        const [bookingCounts, bookings] = await Promise.all([
            Booking.aggregate([
                { $match: { slotId: { $in: slotIds }, paymentStatus: 'paid' } },
                { $group: { _id: '$slotId', count: { $sum: 1 } } },
            ]),
            Booking.find({
                slotId: { $in: slotIds },
                paymentStatus: 'paid'
            })
            .sort({ createdAt: 1 })
            .populate('userId', 'teamName teamTag registrationNumber teamLogo erangelDrop rondoDrop miramarDrop')
            .lean(),
        ]);

        const countMap = {};
        bookingCounts.forEach(b => { countMap[b._id.toString()] = b.count; });

        const teamsMap = {};
        bookings.forEach(b => {
            const sId = b.slotId?.toString();
            if (!sId) return;
            if (!teamsMap[sId]) teamsMap[sId] = [];
            const u = b.userId;
            const bDrops = b.dropLocations || {};
            const erangelDrop = (u?.erangelDrop && u.erangelDrop.trim()) || (bDrops.erangel && bDrops.erangel.trim()) || (bDrops.erangle && bDrops.erangle.trim()) || '';
            const rondoDrop = (u?.rondoDrop && u.rondoDrop.trim()) || (bDrops.rondo && bDrops.rondo.trim()) || '';
            const miramarDrop = (u?.miramarDrop && u.miramarDrop.trim()) || (bDrops.miramar && bDrops.miramar.trim()) || '';
            const sanhokDrop = (bDrops.sanhok && bDrops.sanhok.trim()) || '';
            const vikendiDrop = (bDrops.vikendi && bDrops.vikendi.trim()) || '';
            teamsMap[sId].push({
                bookingId: b._id,
                userId: u?._id,
                teamName: u?.teamName || 'Unknown Team',
                teamTag: u?.teamTag || '',
                teamLogo: u?.teamLogo || '',
                registrationNumber: u?.registrationNumber || '',
                paymentStatus: b.paymentStatus,
                erangelDrop,
                rondoDrop,
                miramarDrop,
                dropLocations: {
                    ...bDrops,
                    erangel: erangelDrop,
                    rondo: rondoDrop,
                    miramar: miramarDrop,
                    sanhok: sanhokDrop,
                    vikendi: vikendiDrop,
                },
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
        const bookings = await Booking.find({ userId: req.user._id, slotId: { $exists: true, $ne: null } })
            .populate('slotId', 'customLink whatsappLink roomId roomPassword note matchName timing date');
        const bookingMap = {};
        bookings.forEach(b => {
            if (b.slotId) {
                const s = b.slotId;
                const isPaid = b.paymentStatus === 'paid';
                const sId = (s && s._id ? s._id : b.slotId).toString();
                const sLink = (s && typeof s === 'object') ? (s.customLink || s.whatsappLink || '') : '';
                const waLink = (s && typeof s === 'object') ? (s.whatsappLink || s.customLink || '') : '';
                bookingMap[sId] = {
                    bookingId: b._id,
                    paymentStatus: b.paymentStatus,
                    merchantTransactionId: b.merchantTransactionId || b.razorpayOrderId,
                    slotLink: isPaid ? sLink : '',
                    whatsappLink: isPaid ? waLink : '',
                    hasLink: isPaid && Boolean(sLink || waLink),
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
        const targetLink = slot.customLink || slot.whatsappLink || '';

        // If admin hasn't set credentials yet and slot time is in the future (>30 min away)
        if (!hasRoomId && !hasPassword && slot.slotTime) {
            const now = new Date();
            const unlockAt = new Date(slot.slotTime.getTime() - 30 * 60 * 1000);
            if (now < unlockAt) {
                return res.json({
                    roomId: 'TBA',
                    roomPassword: 'TBA',
                    whatsappLink: targetLink,
                    customLink: targetLink,
                    slotLink: targetLink,
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
            whatsappLink: targetLink,
            customLink: targetLink,
            slotLink: targetLink,
            matchName: slot.matchName || '',
            date: slot.date || '',
            timing: slot.timing || '',
            note: slot.note || '',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Get all registered teams in DB available for slot assignment
router.get('/available-teams', protect, async (req, res) => {
    try {
        const users = await User.find({
            $or: [
                { teamName: { $exists: true, $ne: '' } },
                { phone: { $exists: true, $ne: '' } }
            ]
        })
        .select('_id teamName teamTag registrationNumber teamLogo phone erangelDrop rondoDrop miramarDrop')
        .sort({ teamName: 1 });

        const teams = users.map(u => ({
            userId: u._id,
            teamName: u.teamName || `Team ${u.phone.slice(-4)}`,
            teamTag: u.teamTag || '',
            registrationNumber: u.registrationNumber || '',
            teamLogo: u.teamLogo || '',
            phone: u.phone,
            erangelDrop: u.erangelDrop || '',
            rondoDrop: u.rondoDrop || '',
            miramarDrop: u.miramarDrop || '',
        }));

        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single slot with populated registered teams and drop locations (PUBLIC)
router.get('/:id', async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id)
            .select('-roomId -roomPassword -whatsappLink -customLink');
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        const bookings = await Booking.find({
            slotId: slot._id,
            paymentStatus: 'paid'
        })
        .sort({ createdAt: 1 })
        .populate('userId', 'teamName teamTag registrationNumber teamLogo erangelDrop rondoDrop miramarDrop phone')
        .lean();

        const bookedTeams = bookings.map(b => {
            const u = b.userId;
            const bDrops = b.dropLocations || {};
            const erangelDrop = (u?.erangelDrop && u.erangelDrop.trim()) || (bDrops.erangel && bDrops.erangel.trim()) || (bDrops.erangle && bDrops.erangle.trim()) || '';
            const rondoDrop = (u?.rondoDrop && u.rondoDrop.trim()) || (bDrops.rondo && bDrops.rondo.trim()) || '';
            const miramarDrop = (u?.miramarDrop && u.miramarDrop.trim()) || (bDrops.miramar && bDrops.miramar.trim()) || '';
            const sanhokDrop = (bDrops.sanhok && bDrops.sanhok.trim()) || '';
            const vikendiDrop = (bDrops.vikendi && bDrops.vikendi.trim()) || '';

            return {
                bookingId: b._id,
                userId: u?._id,
                teamName: u?.teamName || (u?.phone ? `Team ${u.phone.slice(-4)}` : 'Unknown Team'),
                teamTag: u?.teamTag || '',
                teamLogo: u?.teamLogo || '',
                registrationNumber: u?.registrationNumber || '',
                paymentStatus: b.paymentStatus,
                erangelDrop,
                rondoDrop,
                miramarDrop,
                dropLocations: {
                    ...bDrops,
                    erangel: erangelDrop,
                    rondo: rondoDrop,
                    miramar: miramarDrop,
                    sanhok: sanhokDrop,
                    vikendi: vikendiDrop,
                },
            };
        });

        const obj = slot.toObject();
        obj.hasHeroImage = Boolean(obj.heroImage);
        if (obj.heroImage && obj.heroImage.startsWith('http')) {
            obj.heroImageUrl = obj.heroImage;
        }
        const maxTeams = slot.maxTeams || 20;
        const booked = bookedTeams.length;
        const remaining = Math.max(0, maxTeams - booked);

        res.json({
            ...obj,
            bookedCount: booked,
            remainingSlots: remaining,
            isSoldOut: remaining <= 0,
            bookedTeams,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ──────────────── ADMIN ROUTES ────────────────

// Admin: Add / Assign a team to a slot
router.post('/:id/teams', protect, async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        const { userId, dropLocations } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'Team ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Team user not found' });
        }

        // Check if team is already registered for this slot
        const existing = await Booking.findOne({
            slotId: slot._id,
            userId: user._id,
            paymentStatus: { $in: ['paid', 'pending', 'pending_verification'] }
        });

        if (existing) {
            return res.status(400).json({ message: 'This team is already assigned / registered for this slot.' });
        }

        // Check maxTeams limit
        const currentConfirmed = await Booking.countDocuments({
            slotId: slot._id,
            paymentStatus: 'paid'
        });
        const maxTeams = slot.maxTeams || 20;
        if (currentConfirmed >= maxTeams) {
            return res.status(400).json({ message: `Slot is full (maximum ${maxTeams} teams reached)` });
        }

        const initialDrops = {
            erangel: (dropLocations?.erangel || user.erangelDrop || '').trim(),
            miramar: (dropLocations?.miramar || user.miramarDrop || '').trim(),
            rondo: (dropLocations?.rondo || user.rondoDrop || '').trim(),
            ...(dropLocations || {})
        };

        const booking = await Booking.create({
            userId: user._id,
            slotId: slot._id,
            type: 'slot',
            amount: slot.entryFee ?? slot.price ?? 0,
            paymentStatus: 'paid',
            paymentMethod: 'other',
            paidAt: new Date(),
            dropLocations: initialDrops
        });

        // Sync initial dropDetails for this team if slot has scheduleMatches
        if (Array.isArray(slot.scheduleMatches) && slot.scheduleMatches.length > 0) {
            if (!Array.isArray(slot.dropDetails)) slot.dropDetails = [];
            slot.scheduleMatches.forEach(m => {
                const mapKey = (m.map || 'ERANGEL').toLowerCase();
                const dropLoc = initialDrops[mapKey] || '';
                if (dropLoc) {
                    const exists = slot.dropDetails.some(
                        d => Number(d.matchNumber) === Number(m.matchNumber) && String(d.teamId) === String(user._id)
                    );
                    if (!exists) {
                        slot.dropDetails.push({
                            matchNumber: m.matchNumber,
                            matchLabel: m.label || `MATCH ${m.matchNumber}`,
                            map: m.map || 'ERANGEL',
                            teamId: user._id,
                            teamName: user.teamName || 'Unknown Team',
                            teamTag: user.teamTag || '',
                            teamLogo: user.teamLogo || '',
                            registrationNumber: user.registrationNumber || '',
                            dropLocation: dropLoc
                        });
                    }
                }
            });
            await slot.save();
        }

        res.status(201).json({
            message: 'Team assigned to slot successfully',
            booking,
            team: {
                bookingId: booking._id,
                userId: user._id,
                teamName: user.teamName || 'Unknown Team',
                teamTag: user.teamTag || '',
                teamLogo: user.teamLogo || '',
                registrationNumber: user.registrationNumber || '',
                paymentStatus: booking.paymentStatus,
                dropLocations: initialDrops
            }
        });
    } catch (error) {
        console.error('Error adding team to slot:', error);
        res.status(500).json({ message: error.message });
    }
});

// Admin: Remove a team from a slot
router.delete('/:id/teams/:bookingId', protect, async (req, res) => {
    try {
        const { id, bookingId } = req.params;
        const booking = await Booking.findOne({ _id: bookingId, slotId: id });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found for this slot' });
        }

        const userId = booking.userId;
        await Booking.findByIdAndDelete(bookingId);

        // Also clean up dropDetails in slot for this team
        const slot = await Slot.findById(id);
        if (slot && Array.isArray(slot.dropDetails)) {
            slot.dropDetails = slot.dropDetails.filter(
                d => String(d.teamId) !== String(userId)
            );
            await slot.save();
        }

        res.json({ message: 'Team removed from slot successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Add or update drop details for a slot, match, map, registered team, and drop location
router.put('/:id/drop-details', protect, async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        const { matchNumber, matchLabel, map, teamId, dropLocation } = req.body;
        if (!matchNumber || !teamId) {
            return res.status(400).json({ message: 'matchNumber and teamId are required' });
        }

        const user = await User.findById(teamId);
        const teamName = user?.teamName || req.body.teamName || 'Unknown Team';
        const teamTag = user?.teamTag || '';
        const teamLogo = user?.teamLogo || '';
        const registrationNumber = user?.registrationNumber || '';
        const normMap = (map || 'ERANGEL').toUpperCase().trim();
        const cleanDrop = (dropLocation || '').trim();
        const mNum = Number(matchNumber);

        if (!Array.isArray(slot.dropDetails)) {
            slot.dropDetails = [];
        }

        // Update match map in scheduleMatches if present
        if (Array.isArray(slot.scheduleMatches)) {
            const matchIndex = slot.scheduleMatches.findIndex(m => Number(m.matchNumber) === mNum);
            if (matchIndex >= 0) {
                slot.scheduleMatches[matchIndex].map = normMap;
            }
        }

        // Find existing drop detail
        const existingIdx = slot.dropDetails.findIndex(
            d => Number(d.matchNumber) === mNum && String(d.teamId) === String(teamId)
        );

        if (existingIdx >= 0) {
            slot.dropDetails[existingIdx].map = normMap;
            slot.dropDetails[existingIdx].dropLocation = cleanDrop;
            slot.dropDetails[existingIdx].matchLabel = matchLabel || slot.dropDetails[existingIdx].matchLabel || `MATCH ${mNum}`;
            slot.dropDetails[existingIdx].teamName = teamName;
            slot.dropDetails[existingIdx].teamLogo = teamLogo;
            slot.dropDetails[existingIdx].registrationNumber = registrationNumber;
        } else {
            slot.dropDetails.push({
                matchNumber: mNum,
                matchLabel: matchLabel || `MATCH ${mNum}`,
                map: normMap,
                teamId: user?._id || teamId,
                teamName,
                teamTag,
                teamLogo,
                registrationNumber,
                dropLocation: cleanDrop,
            });
        }

        // Also sync into Booking for this team and slot
        const booking = await Booking.findOne({ slotId: slot._id, userId: teamId });
        if (booking) {
            if (!booking.dropLocations) booking.dropLocations = {};
            const mapKey = normMap.toLowerCase();
            booking.dropLocations[mapKey] = cleanDrop;
            booking.dropLocations[`match_${mNum}`] = cleanDrop;
            booking.markModified('dropLocations');
            await booking.save();
        }

        await slot.save();

        res.json({
            message: 'Drop details saved successfully',
            dropDetails: slot.dropDetails,
            scheduleMatches: slot.scheduleMatches
        });
    } catch (error) {
        console.error('Error saving drop details:', error);
        res.status(500).json({ message: error.message });
    }
});

// Admin: Delete drop detail entry
router.delete('/:id/drop-details/:detailId', protect, async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        const { detailId } = req.params;
        slot.dropDetails = (slot.dropDetails || []).filter(d => String(d._id) !== String(detailId));
        await slot.save();

        res.json({
            message: 'Drop detail removed',
            dropDetails: slot.dropDetails
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

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

        const incomingLink = req.body.customLink !== undefined ? req.body.customLink : (req.body.slotLink !== undefined ? req.body.slotLink : req.body.whatsappLink);
        if (incomingLink !== undefined) {
            req.body.customLink = incomingLink.trim();
            req.body.whatsappLink = incomingLink.trim();
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

        const incomingLink = req.body.customLink !== undefined ? req.body.customLink : (req.body.slotLink !== undefined ? req.body.slotLink : req.body.whatsappLink);
        if (incomingLink !== undefined) {
            req.body.customLink = incomingLink.trim();
            req.body.whatsappLink = incomingLink.trim();
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

// Update or set drop location for current user in a booked slot
router.put('/:slotId/my-drop', userProtect, async(req, res) => {
    try {
        const { slotId } = req.params;
        const userId = req.user._id;
        const { mapName, dropLocation, dropLocations } = req.body;

        const booking = await Booking.findOne({
            userId,
            slotId,
            paymentStatus: { $in: ['pending', 'paid', 'pending_verification'] },
        });

        if (!booking) {
            return res.status(404).json({ message: 'No active booking found for this slot. Please book the slot first.' });
        }

        const currentDrops = booking.dropLocations || {};
        const userUpdate = {};
        if (dropLocations && typeof dropLocations === 'object') {
            for (const [key, val] of Object.entries(dropLocations)) {
                if (typeof val === 'string') {
                    const cleanKey = key.toLowerCase().trim();
                    currentDrops[cleanKey] = val.trim();
                    if (cleanKey === 'erangel' || cleanKey === 'erangle') userUpdate.erangelDrop = val.trim();
                    if (cleanKey === 'rondo') userUpdate.rondoDrop = val.trim();
                    if (cleanKey === 'miramar') userUpdate.miramarDrop = val.trim();
                }
            }
        } else if (mapName && typeof dropLocation === 'string') {
            const key = mapName.toLowerCase().trim();
            currentDrops[key] = dropLocation.trim();

            if (key === 'erangel' || key === 'erangle') userUpdate.erangelDrop = dropLocation.trim();
            if (key === 'rondo') userUpdate.rondoDrop = dropLocation.trim();
            if (key === 'miramar') userUpdate.miramarDrop = dropLocation.trim();
        } else {
            return res.status(400).json({ message: 'mapName and dropLocation are required' });
        }

        if (Object.keys(userUpdate).length > 0) {
            await User.findByIdAndUpdate(userId, { $set: userUpdate });
        }

        booking.dropLocations = currentDrops;
        booking.markModified('dropLocations');
        await booking.save();

        res.json({
            success: true,
            message: 'Drop location updated successfully!',
            dropLocations: currentDrops,
        });
    } catch (error) {
        console.error('Error updating drop location:', error);
        res.status(500).json({ message: error.message || 'Failed to update drop location' });
    }
});

// Toggle / update publication status (Draft vs Published)
router.patch('/:id/publish', protect, async(req, res) => {
    try {
        const slot = await Slot.findById(req.params.id);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });
        const nextState = typeof req.body.isPublished === 'boolean' ? req.body.isPublished : !slot.isPublished;
        slot.isPublished = nextState;
        await slot.save();
        res.json({
            message: nextState ? 'Tournament published to public' : 'Tournament saved as draft (hidden from public)',
            isPublished: slot.isPublished,
            slot
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Duplicate / copy-schedule slot
router.post('/:id/duplicate', protect, async(req, res) => {
    try {
        const source = await Slot.findById(req.params.id).lean();
        if (!source) return res.status(404).json({ message: 'Slot not found' });
        delete source._id;
        delete source.createdAt;
        delete source.updatedAt;
        source.matchName = `${source.matchName || 'Slot'} (Copy)`;
        source.dropDetails = [];
        source.roomId = '';
        source.roomPassword = '';
        source.isPublished = false; // set as draft
        const newSlot = await Slot.create(source);
        res.status(201).json(newSlot);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete slot (with safety check for active bookings)
router.delete('/:id', protect, async(req, res) => {
    try {
        const slot = await Slot.findById(req.params.id);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }
        const activeBookings = await Booking.countDocuments({
            slotId: req.params.id,
            paymentStatus: { $in: ['paid', 'pending_verification'] }
        });
        if (activeBookings > 0 && req.query.force !== 'true') {
            return res.status(400).json({
                message: `Cannot delete: this tournament/slot has ${activeBookings} active booking(s). Please refund or remove registered teams first, or confirm force delete.`
            });
        }
        await Slot.findByIdAndDelete(req.params.id);
        res.json({ message: 'Slot removed successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;