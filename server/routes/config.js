import express from 'express';
import { Setting } from '../models/Setting.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper to get default payment config from env
const getDefaultPaymentConfig = () => ({
  upiId: process.env.UPI_ID || 'Q264921089@ybl',
  upiName: process.env.UPI_NAME || 'Rising Esports',
  upiDescription: process.env.UPI_DESCRIPTION || 'Rising Esports Match Registration',
  supportWhatsApp: process.env.SUPPORT_WHATSAPP || '',
});

// GET /api/config/payment — Public: return payment config for frontend
router.get('/payment', async (req, res) => {
  try {
    const defaults = getDefaultPaymentConfig();
    const setting = await Setting.findOne({ key: 'payment' });
    if (setting && setting.value) {
      return res.json({
        upiId: setting.value.upiId || defaults.upiId,
        upiName: setting.value.upiName || defaults.upiName,
        upiDescription: setting.value.upiDescription || defaults.upiDescription,
        supportWhatsApp: setting.value.supportWhatsApp || defaults.supportWhatsApp,
      });
    }
    res.json(defaults);
  } catch (error) {
    console.error('Error fetching payment config:', error.message);
    res.json(getDefaultPaymentConfig());
  }
});

// GET /api/config/admin — Admin: return full configuration
router.get('/admin', protect, async (req, res) => {
  try {
    const defaults = getDefaultPaymentConfig();
    const setting = await Setting.findOne({ key: 'payment' });
    const payment = setting?.value ? { ...defaults, ...setting.value } : defaults;

    res.json({
      payment,
      serverTime: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/config/payment — Admin: update payment config
router.put('/payment', protect, async (req, res) => {
  try {
    const { upiId, upiName, upiDescription, supportWhatsApp } = req.body;

    if (!upiId || !upiId.trim()) {
      return res.status(400).json({ message: 'UPI ID is required' });
    }

    const payload = {
      upiId: upiId.trim(),
      upiName: (upiName || 'Rising Esports').trim(),
      upiDescription: (upiDescription || 'Rising Esports Match Registration').trim(),
      supportWhatsApp: (supportWhatsApp || '').trim(),
    };

    const updated = await Setting.findOneAndUpdate(
      { key: 'payment' },
      { $set: { value: payload } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Payment configuration saved successfully!',
      config: updated.value,
    });
  } catch (error) {
    console.error('Error saving payment config:', error);
    res.status(500).json({ message: error.message || 'Failed to update payment configuration' });
  }
});

export default router;
