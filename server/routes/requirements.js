import express from 'express';
import { Requirement } from '../models/Requirement.js';
import { userProtect, protect as adminProtect } from '../middleware/auth.js';

const router = express.Router();

// Helper to validate YouTube or Instagram URLs
const isValidClipsUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  try {
    const urlObj = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
    const host = urlObj.hostname.toLowerCase();
    const isYouTube = host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com' || host === 'youtu.be';
    const isInstagram = host === 'instagram.com' || host === 'www.instagram.com' || host === 'm.instagram.com';
    return isYouTube || isInstagram;
  } catch {
    return false;
  }
};

// ──────────────────────────────────────────────
// PUBLIC ROUTES
// ──────────────────────────────────────────────

// GET /api/requirements — Get all active published requirements
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { status: 'active' };
    if (type && (type === 'PLAYER' || type === 'TEAM')) {
      filter.type = type;
    }

    const requirements = await Requirement.find(filter)
      .populate('user', 'teamName registrationNumber phone whatsappNumber teamLogo')
      .sort({ createdAt: -1 });

    res.json(requirements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────────────────────────────────────
// USER PROTECTED ROUTES
// ──────────────────────────────────────────────

// GET /api/requirements/my — Get logged-in user's own active requirements
router.get('/my', userProtect, async (req, res) => {
  try {
    const requirements = await Requirement.find({
      user: req.user._id,
      status: 'active',
    })
      .populate('user', 'teamName registrationNumber phone whatsappNumber teamLogo')
      .sort({ createdAt: -1 });

    res.json(requirements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/requirements — Publish a new requirement
router.post('/', userProtect, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Mandatory Business Rule: Maximum 2 active requirements per user
    const activeCount = await Requirement.countDocuments({
      user: userId,
      status: 'active',
    });

    if (activeCount >= 2) {
      return res.status(400).json({
        message: 'You can have a maximum of 2 active requirements at a time. Please remove one of your existing requirements before publishing another.',
      });
    }

    const {
      type,
      device,
      role,
      availability,
      playingTime,
      age,
      experience,
      contact,
      achievements,
      additionalInfo,
      clips,
    } = req.body;

    // 2. Validate Type
    if (!type || (type !== 'PLAYER' && type !== 'TEAM')) {
      return res.status(400).json({ message: 'Requirement type must be either PLAYER or TEAM' });
    }

    // 3. Validate Common Required Fields
    if (!device || !device.trim()) {
      return res.status(400).json({ message: 'Device is required' });
    }
    if (!role || !role.trim()) {
      return res.status(400).json({ message: 'Role is required' });
    }
    if (!age || !age.trim()) {
      return res.status(400).json({ message: 'Age is required' });
    }
    if (!experience || !experience.trim()) {
      return res.status(400).json({ message: 'Experience is required' });
    }
    if (!contact || !contact.trim()) {
      return res.status(400).json({ message: 'Contact information is required' });
    }

    // 4. Validate Specific Fields per Type
    if (type === 'PLAYER') {
      if (!availability || !availability.trim()) {
        return res.status(400).json({ message: 'Availability is required for Looking for Player' });
      }
    } else if (type === 'TEAM') {
      if (!playingTime || !playingTime.trim()) {
        return res.status(400).json({ message: 'Playing Time is required for Looking for Team' });
      }
      if (!clips || !clips.trim()) {
        return res.status(400).json({ message: 'Clips link is required for Looking for Team' });
      }
      if (!isValidClipsUrl(clips)) {
        return res.status(400).json({
          message: 'Invalid Clips URL. Please provide a valid YouTube (video/Shorts) or Instagram (Reel/Post) link.',
        });
      }
    }

    // 5. Create Requirement
    const requirement = await Requirement.create({
      user: userId,
      type,
      device: device.trim(),
      role: role.trim(),
      availability: availability ? availability.trim() : '',
      playingTime: playingTime ? playingTime.trim() : '',
      age: age.trim(),
      experience: experience.trim(),
      contact: contact.trim(),
      achievements: achievements ? achievements.trim() : '',
      additionalInfo: additionalInfo ? additionalInfo.trim() : '',
      clips: clips ? clips.trim() : '',
      status: 'active',
    });

    const populated = await Requirement.findById(requirement._id)
      .populate('user', 'teamName registrationNumber phone whatsappNumber teamLogo');

    res.status(201).json({
      message: 'Requirement published successfully!',
      requirement: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/requirements/:id — User removes their own requirement
router.delete('/:id', userProtect, async (req, res) => {
  try {
    const requirement = await Requirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({ message: 'Requirement not found' });
    }

    // Enforce ownership
    if (requirement.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are only authorized to delete your own requirements' });
    }

    // Mark as deleted or delete document
    await Requirement.findByIdAndDelete(req.params.id);

    res.json({ message: 'Requirement removed successfully. Your slot is now available.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────────────────────────────────────
// ADMIN ROUTES
// ──────────────────────────────────────────────

// GET /api/requirements/admin/all — Admin: Get all requirements
router.get('/admin/all', adminProtect, async (req, res) => {
  try {
    const requirements = await Requirement.find()
      .populate('user', 'teamName registrationNumber phone whatsappNumber teamLogo')
      .sort({ createdAt: -1 });

    res.json(requirements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/requirements/admin/:id — Admin: Delete any requirement
router.delete('/admin/:id', adminProtect, async (req, res) => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) {
      return res.status(404).json({ message: 'Requirement not found' });
    }

    await Requirement.findByIdAndDelete(req.params.id);

    res.json({ message: 'Requirement deleted permanently by admin.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/requirements/admin/:id/status — Admin: Toggle or update status
router.patch('/admin/:id/status', adminProtect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'inactive', 'deleted'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required (active, inactive, deleted)' });
    }

    const requirement = await Requirement.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'teamName registrationNumber phone whatsappNumber teamLogo');

    if (!requirement) {
      return res.status(404).json({ message: 'Requirement not found' });
    }

    res.json({ message: `Requirement status updated to ${status}`, requirement });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

