import express from 'express';
import { Notification } from '../models/Notification.js';
import { Announcement } from '../models/Announcement.js';
import { userProtect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications - Get notifications for logged in user
router.get('/', userProtect, async (req, res) => {
  try {
    const userId = req.user._id;

    const [userNotifications, unreadCount, recentAnnouncements] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50),
      Notification.countDocuments({ userId, read: false }),
      Announcement.find({ isActive: true })
        .sort({ priority: -1, createdAt: -1 })
        .limit(3),
    ]);

    // Format announcements as general notices
    const systemNotices = (recentAnnouncements || []).map((ann) => ({
      _id: `ann_${ann._id}`,
      title: ann.title || 'Official Announcement',
      message: ann.content,
      type: 'general',
      status: 'official',
      read: true,
      createdAt: ann.createdAt,
      isSystem: true,
    }));

    // If user has no notifications, give an informative welcome notice
    const combined = [...userNotifications, ...systemNotices];
    if (combined.length === 0) {
      combined.push({
        _id: 'default_notice',
        title: 'Welcome to Rising Esports',
        message: 'Your deposits, withdrawals, and slot confirmations will appear here.',
        type: 'general',
        status: 'info',
        read: true,
        createdAt: new Date(),
        isSystem: true,
      });
    }

    res.json({
      success: true,
      notifications: combined,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/mark-all-read - Mark all as read
router.put('/mark-all-read', userProtect, async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', userProtect, async (req, res) => {
  try {
    const { id } = req.params;
    if (id.startsWith('ann_') || id.startsWith('default_')) {
      return res.json({ success: true, message: 'Notice read' });
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ success: true, notification: notif });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update notification' });
  }
});

// DELETE /api/notifications/:id - Delete single notification
router.delete('/:id', userProtect, async (req, res) => {
  try {
    const { id } = req.params;
    if (id.startsWith('ann_') || id.startsWith('default_')) {
      return res.json({ success: true, message: 'Notice removed' });
    }

    await Notification.findOneAndDelete({ _id: id, userId: req.user._id });
    res.json({ success: true, message: 'Notification removed' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete notification' });
  }
});

// DELETE /api/notifications - Clear all notifications
router.delete('/', userProtect, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to clear notifications' });
  }
});

export default router;
