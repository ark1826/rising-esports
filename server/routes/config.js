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
  officialWhatsAppGroup: process.env.OFFICIAL_WHATSAPP_GROUP || 'https://chat.whatsapp.com/FLX8eM2APOFCyiK8ReWER6?mode=gi_t',
});

// GET /api/config/payment — Public: return payment config for frontend
router.get('/payment', async (req, res) => {
  try {
    const defaults = getDefaultPaymentConfig();
    const [setting, waSetting] = await Promise.all([
      Setting.findOne({ key: 'payment' }),
      Setting.findOne({ key: 'officialWhatsAppGroup' })
    ]);
    const officialWhatsAppGroup = waSetting?.value?.url || setting?.value?.officialWhatsAppGroup || defaults.officialWhatsAppGroup;
    if (setting && setting.value) {
      return res.json({
        upiId: setting.value.upiId || defaults.upiId,
        upiName: setting.value.upiName || defaults.upiName,
        upiDescription: setting.value.upiDescription || defaults.upiDescription,
        supportWhatsApp: setting.value.supportWhatsApp || defaults.supportWhatsApp,
        officialWhatsAppGroup,
      });
    }
    res.json({ ...defaults, officialWhatsAppGroup });
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

// GET /api/config/official-whatsapp — Public: return official community WhatsApp group link
router.get('/official-whatsapp', async (req, res) => {
  try {
    const defaultUrl = process.env.OFFICIAL_WHATSAPP_GROUP || 'https://chat.whatsapp.com/FLX8eM2APOFCyiK8ReWER6?mode=gi_t';
    const setting = await Setting.findOne({ key: 'officialWhatsAppGroup' });
    const url = setting?.value?.url || defaultUrl;
    res.json({
      url,
      updatedAt: setting?.updatedAt || null,
    });
  } catch (error) {
    console.error('Error fetching official WhatsApp group:', error);
    res.json({ url: 'https://chat.whatsapp.com/FLX8eM2APOFCyiK8ReWER6?mode=gi_t' });
  }
});

// PUT /api/config/official-whatsapp — Admin: update official community WhatsApp group link
router.put('/official-whatsapp', protect, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ message: 'WhatsApp Group link is required' });
    }

    const cleanUrl = url.trim();
    const updated = await Setting.findOneAndUpdate(
      { key: 'officialWhatsAppGroup' },
      { $set: { value: { url: cleanUrl } } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Official WhatsApp Group link updated successfully!',
      url: cleanUrl,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Error saving official WhatsApp group link:', error);
    res.status(500).json({ message: error.message || 'Failed to update official WhatsApp group link' });
  }
});

export default router;
