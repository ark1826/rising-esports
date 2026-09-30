import express from 'express';
import { Announcement } from '../models/Announcement.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/announcements/latest — Public: Get the latest active announcement
router.get('/latest', async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ isActive: true })
      .sort({ updatedAt: -1, createdAt: -1 });

    if (!announcement) {
      return res.json({
        title: 'Welcome to Rising Esports',
        content: 'Welcome to Rising Esports! Check out our daily BGMI scrims and book your slots now to compete with top teams.',
        author: 'Rising Esports',
        createdAt: new Date().toISOString(),
        isDefault: true,
      });
    }

    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/announcements/active — Public: Get all active announcements
router.get('/active', async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .sort({ priority: -1, updatedAt: -1, createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/announcements — Admin: Get all announcements
router.get('/', protect, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/announcements — Admin: Create announcement
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, isActive, priority, author } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Announcement content is required' });
    }

    const announcement = await Announcement.create({
      title: title?.trim() || 'Official Announcement',
      content: content.trim(),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      priority: Number(priority) || 1,
      author: author?.trim() || 'Admin',
    });

    res.status(201).json(announcement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/announcements/:id — Admin: Update announcement
router.put('/:id', protect, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/announcements/:id — Admin: Delete announcement
router.delete('/:id', protect, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
