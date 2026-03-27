import express from 'express';
import { Ranking } from '../models/Ranking.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public: Get all rankings
router.get('/', async (req, res) => {
  try {
    const rankings = await Ranking.find().sort({ rank: 1 });
    res.json(rankings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected: Create ranking
router.post('/', protect, async (req, res) => {
  try {
    const count = await Ranking.countDocuments();
    if (count >= 50) {
      return res.status(400).json({ message: 'Maximum limit of 50 rankings reached.' });
    }
    const ranking = await Ranking.create(req.body);
    res.status(201).json(ranking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Protected: Update ranking
router.put('/:id', protect, async (req, res) => {
  try {
    const ranking = await Ranking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ranking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Protected: Delete ranking
router.delete('/:id', protect, async (req, res) => {
  try {
    await Ranking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ranking removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
