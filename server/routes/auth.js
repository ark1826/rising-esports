import express from 'express';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Try to find admin in database
    const dbAdmin = await Admin.findOne({ username });
    if (dbAdmin) {
      const isMatch = await dbAdmin.comparePassword(password);
      if (isMatch) {
        const token = jwt.sign({ id: dbAdmin._id }, process.env.JWT_SECRET, {
          expiresIn: '30d',
        });
        return res.json({
          _id: dbAdmin._id,
          username: dbAdmin.username,
          token: token,
        });
      }
    }

    // 2. Fallback to static env variables check
    const envUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
    const envPassword = (process.env.ADMIN_PASSWORD || 'admin@123').trim();

    if (username.trim() === envUsername && password.trim() === envPassword) {
      const token = jwt.sign({ id: 'static-admin-id' }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });

      return res.json({
        _id: 'static-admin-id',
        username: envUsername,
        token: token,
      });
    }

    res.status(401).json({ message: 'Invalid username or password' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
