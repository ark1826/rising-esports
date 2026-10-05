import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
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

// POST /api/users/reset-password — Self-service password reset with account verification
router.post('/reset-password', async (req, res) => {
  const { phone, verificationAnswer, newPassword } = req.body;

  if (!phone || !verificationAnswer || !newPassword) {
    return res.status(400).json({ message: 'Phone number, verification detail, and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  try {
    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return res.status(404).json({ message: 'No registered account found with this phone number' });
    }

    const trimmedInput = verificationAnswer.trim().toLowerCase();
    const userTeamName = (user.teamName || '').trim().toLowerCase();
    const userRegNum = user.registrationNumber ? String(user.registrationNumber).trim().toLowerCase() : '';
    const userWhatsapp = (user.whatsappNumber || '').trim().replace(/\D/g, '');
    const inputCleanedPhone = trimmedInput.replace(/\D/g, '');

    // Check if input matches registered Team Name, Registration Number (e.g. 1024 or #1024), or WhatsApp
    const matchesTeamName = userTeamName && userTeamName === trimmedInput;
    const matchesRegNum = userRegNum && (userRegNum === trimmedInput || userRegNum === trimmedInput.replace('#', ''));
    
    // Robust WhatsApp match: compare last 10 digits to ignore prefixes (+91, 0, etc.)
    const userLast10 = userWhatsapp.slice(-10);
    const inputLast10 = inputCleanedPhone.slice(-10);
    const matchesWhatsapp = userLast10.length === 10 && inputLast10.length === 10 && userLast10 === inputLast10;

    if (!matchesTeamName && !matchesRegNum && !matchesWhatsapp) {
      return res.status(400).json({
        message: 'Verification failed. The Team Name or Registration ID does not match our records for this account.'
      });
    }

    user.password = newPassword;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Password reset successfully! Logging you in...',
      user: {
        _id: user._id,
        phone: user.phone,
        teamName: user.teamName,
        registrationNumber: user.registrationNumber,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users/admin/reset-password — Admin reset
router.post('/admin/reset-password', async (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ message: 'User ID and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: `Password successfully updated for ${user.teamName || user.phone}` });
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
      const raw = String(whatsappNumber || '').trim();
      if (!raw) {
        updateData.whatsappNumber = '';
      } else {
        // Disallow URLs or non-phone links (some users might mistakenly paste chat.whatsapp.com links)
        if (/whatsapp\.com|wa\.me/i.test(raw)) {
          return res.status(400).json({
            message: 'Please enter your 10-digit WhatsApp phone number, not a group invite link.'
          });
        }

        const digits = raw.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 15) {
          return res.status(400).json({
            message: 'Please enter a valid 10-digit WhatsApp phone number (e.g. 9876543210 or +91 9876543210)'
          });
        }

        // Standardize Indian phone numbers
        let normalized = raw;
        if (digits.length === 10) {
          normalized = `+91 ${digits}`;
        } else if (digits.length === 11 && digits.startsWith('0')) {
          normalized = `+91 ${digits.slice(1)}`;
        } else if (digits.length === 12 && digits.startsWith('91')) {
          normalized = `+91 ${digits.slice(2)}`;
        } else if (digits.length === 13 && digits.startsWith('910')) {
          normalized = `+91 ${digits.slice(3)}`;
        } else if (digits.length === 14 && digits.startsWith('0091')) {
          normalized = `+91 ${digits.slice(4)}`;
        } else {
          normalized = raw.startsWith('+') ? raw : `+${raw}`;
        }
        updateData.whatsappNumber = normalized;
      }
    }

    if (erangelDrop !== undefined) updateData.erangelDrop = String(erangelDrop || '').trim();
    if (rondoDrop !== undefined) updateData.rondoDrop = String(rondoDrop || '').trim();
    if (miramarDrop !== undefined) updateData.miramarDrop = String(miramarDrop || '').trim();

    // Also sync the drop locations across user's active/upcoming bookings so the drop list immediately updates
    if (erangelDrop !== undefined || rondoDrop !== undefined || miramarDrop !== undefined) {
      const dropUpdate = {};
      if (erangelDrop !== undefined) dropUpdate['dropLocations.erangel'] = String(erangelDrop || '').trim();
      if (rondoDrop !== undefined) dropUpdate['dropLocations.rondo'] = String(rondoDrop || '').trim();
      if (miramarDrop !== undefined) dropUpdate['dropLocations.miramar'] = String(miramarDrop || '').trim();
      try {
        await Booking.updateMany(
          { userId: req.user._id },
          { $set: dropUpdate }
        );
      } catch (err) {
        console.warn('[Profile Update] Failed to sync bookings drops:', err.message);
      }
    }

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
