import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const envUsername = process.env.ADMIN_USERNAME || 'admin';
    const envPassword = process.env.ADMIN_PASSWORD || 'admin@123';

    if (username === envUsername && password === envPassword) {
      const token = jwt.sign({ id: 'static-admin-id' }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });

      res.json({
        _id: 'static-admin-id',
        username: envUsername,
        token: token,
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
