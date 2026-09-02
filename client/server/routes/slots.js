import express from 'express';
import { Slot } from '../models/Slot.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public: Get all slots
router.get('/', async (req, res) => {
  try {
    const slots = await Slot.find();
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected: Create slot
router.post('/', protect, async (req, res) => {
  try {
    const count = await Slot.countDocuments();
    if (count >= 20) {
      return res.status(400).json({ message: 'Maximum limit of 20 slots reached.' });
    }
    const slot = await Slot.create(req.body);
    res.status(201).json(slot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Protected: Update slot
router.put('/:id', protect, async (req, res) => {
  try {
    const slot = await Slot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(slot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Protected: Delete slot
router.delete('/:id', protect, async (req, res) => {
  try {
    await Slot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slot removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
