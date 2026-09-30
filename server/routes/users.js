import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { userProtect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/users/register
router.post('/register', async (req, res) => {
  const { phone, password, teamName } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Phone and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this phone number already exists' });
    }

    // Auto-assign a sequential registration number
    const lastUser = await User.findOne({ registrationNumber: { $exists: true } }).sort({ registrationNumber: -1 });
    const registrationNumber = lastUser ? lastUser.registrationNumber + 1 : 1001;

    const user = await User.create({ phone, password, teamName, registrationNumber });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      _id: user._id,
      phone: user.phone,
      teamName: user.teamName,
      registrationNumber: user.registrationNumber,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Phone and password are required' });
  }

  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      _id: user._id,
      phone: user.phone,
      teamName: user.teamName,
      registrationNumber: user.registrationNumber,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/me & /api/users/profile
router.get('/profile', userProtect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', userProtect, async (req, res) => {
  res.json({
    _id: req.user._id,
    phone: req.user.phone,
    teamName: req.user.teamName,
    teamLogo: req.user.teamLogo || '',
    walletBalance: req.user.walletBalance || 0,
    registrationNumber: req.user.registrationNumber || null,
  });
});

// PUT /api/users/profile — Update team details and drops
router.put('/profile', userProtect, async (req, res) => {
  const { teamName, teamLogo, whatsappNumber, erangelDrop, rondoDrop, miramarDrop } = req.body;

  try {
    const updateData = {};

    if (teamName !== undefined) {
      if (!teamName.trim()) {
        return res.status(400).json({ message: 'Team name cannot be empty' });
      }
      updateData.teamName = teamName.trim();
    }

    if (teamLogo !== undefined) {
      updateData.teamLogo = teamLogo.trim();
    }

    if (whatsappNumber !== undefined) {
      const cleanedPhone = whatsappNumber.replace(/\D/g, '');
      if (cleanedPhone && (cleanedPhone.length < 10 || cleanedPhone.length > 13)) {
        return res.status(400).json({ message: 'Please enter a valid WhatsApp phone number' });
      }
      updateData.whatsappNumber = whatsappNumber.trim();
    }

    if (erangelDrop !== undefined) updateData.erangelDrop = erangelDrop.trim();
    if (rondoDrop !== undefined) updateData.rondoDrop = rondoDrop.trim();
    if (miramarDrop !== undefined) updateData.miramarDrop = miramarDrop.trim();

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile details saved successfully!',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/admin/all — Admin: Get list of registered players with balances
router.get('/admin/all', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ registrationNumber: 1, createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
