import express from 'express';
import { Match } from '../models/Match.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/matches — Public: List matches with optional filters: ?date=YYYY-MM-DD, ?status=UPCOMING/LIVE/COMPLETED
router.get('/', async (req, res) => {
  try {
    const { date, status } = req.query;
    const filter = {};

    if (date) {
      filter.date = date.trim();
    }
    if (status) {
      filter.status = status.toUpperCase().trim();
    }

    const matches = await Match.find(filter)
      .sort({ date: -1, timing: 1, createdAt: -1 });

    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/matches/:id — Public: Get match by ID
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/matches — Admin: Create new match
router.post('/', protect, async (req, res) => {
  try {
    const { matchName, date, timing, mode, maps, status, slotId, totalTeams, entryFee, prizePool, notes } = req.body;

    if (!matchName || !date || !timing) {
      return res.status(400).json({ message: 'Match name, date, and timing are required' });
    }

    const match = await Match.create({
      matchName: matchName.trim(),
      date: date.trim(),
      timing: timing.trim(),
      mode: mode?.trim() || 'Squad TPP',
      maps: Array.isArray(maps)
        ? maps
        : typeof maps === 'string'
        ? maps.split(',').map(m => m.trim()).filter(Boolean)
        : ['Erangel'],
      status: status || 'UPCOMING',
      slotId: slotId || null,
      totalTeams: Number(totalTeams) || 20,
      entryFee: Number(entryFee) || 0,
      prizePool: Number(prizePool) || 0,
      notes: notes?.trim() || '',
    });

    res.status(201).json(match);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/matches/:id — Admin: Update match
router.put('/:id', protect, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.maps && typeof updateData.maps === 'string') {
      updateData.maps = updateData.maps.split(',').map(m => m.trim()).filter(Boolean);
    }

    const match = await Match.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/matches/:id — Admin: Delete match
router.delete('/:id', protect, async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
