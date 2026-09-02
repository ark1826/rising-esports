import express from 'express';
import { Ranking } from '../models/Ranking.js';
import { protect } from '../middleware/auth.js';
import { recomputeRanks } from '../utils/rankingUtils.js';

const router = express.Router();

// Public: Get all rankings
router.get('/', async (req, res) => {
  try {
    // Fetch rankings sorted by totalPoints descending
    const rankings = await Ranking.find().sort({ totalPoints: -1, rank: 1 });
    // Assign rank based on order if needed
    const ranked = rankings.map((r, index) => ({
      ...r.toObject(),
      rank: index + 1,
    }));
    res.json(ranked);
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
    // Recompute ranks after insertion
    await recomputeRanks();
    res.status(201).json(ranking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Protected: Update ranking
router.put('/:id', protect, async (req, res) => {
  try {
    const ranking = await Ranking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    // Recompute ranks after update
    await recomputeRanks();
    res.json(ranking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Protected: Delete ranking
router.delete('/:id', protect, async (req, res) => {
  try {
    await Ranking.findByIdAndDelete(req.params.id);
    // Recompute ranks after deletion
    await recomputeRanks();
    res.json({ message: 'Ranking removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
