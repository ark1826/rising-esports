import express from 'express';
import { MatchResult } from '../models/MatchResult.js';
import { Match } from '../models/Match.js';
import { protect } from '../middleware/auth.js';
import { syncRankingsFromResults } from '../utils/rankingUtils.js';

const router = express.Router();

// Helper to compute BGMI points: position points + kills
const getPlacementPoints = (position) => {
  const pointsTable = {
    1: 10,
    2: 6,
    3: 5,
    4: 4,
    5: 3,
    6: 2,
    7: 1,
    8: 1,
  };
  return pointsTable[position] || 0;
};

// GET /api/results — Public: Get results filtered by ?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { isPublished: true };
    if (date) {
      filter.date = date.trim();
    }

    const results = await MatchResult.find(filter)
      .populate('matchId', 'matchName date timing mode maps status')
      .sort({ date: -1, createdAt: -1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/results/dates — Public: List distinct dates with results
router.get('/dates', async (req, res) => {
  try {
    const dates = await MatchResult.distinct('date', { isPublished: true });
    res.json(dates.sort().reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/results/:id — Public: Get a single match result
router.get('/:id', async (req, res) => {
  try {
    const result = await MatchResult.findById(req.params.id)
      .populate('matchId');
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────── ADMIN ROUTES ────────────────

// GET /api/results/admin/all — Admin: Get all results (including drafts)
router.get('/admin/all', protect, async (req, res) => {
  try {
    const results = await MatchResult.find()
      .populate('matchId')
      .sort({ date: -1, createdAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/results — Admin: Create or Publish Match Result
router.post('/', protect, async (req, res) => {
  try {
    const { matchId, matchName, date, timing, mode, results, isPublished } = req.body;

    if (!matchName || !date) {
      return res.status(400).json({ message: 'Match name and date are required' });
    }

    // Process each team row to ensure accurate calculations
    const processedResults = (results || []).map((row, idx) => {
      const position = Number(row.position) || (idx + 1);
      const kills = Number(row.kills) || 0;
      const placementPoints = row.placementPoints !== undefined
        ? Number(row.placementPoints)
        : getPlacementPoints(position);
      const totalPoints = row.totalPoints !== undefined
        ? Number(row.totalPoints)
        : placementPoints + kills;

      return {
        position,
        teamName: (row.teamName || `Team ${idx + 1}`).trim(),
        teamTag: (row.teamTag || '').trim(),
        kills,
        placementPoints,
        totalPoints,
      };
    }).sort((a, b) => a.position - b.position);

    const matchResult = await MatchResult.create({
      matchId: matchId || null,
      matchName: matchName.trim(),
      date: date.trim(),
      timing: timing?.trim() || '',
      mode: mode?.trim() || 'Squad TPP',
      results: processedResults,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    });

    // If linked to a Match, mark match as COMPLETED
    if (matchId) {
      await Match.findByIdAndUpdate(matchId, { status: 'COMPLETED' });
    }

    // Synchronize rankings automatically
    try {
      await syncRankingsFromResults();
    } catch (syncErr) {
      console.warn('Could not auto-sync rankings:', syncErr.message);
    }

    res.status(201).json(matchResult);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/results/:id — Admin: Update Match Result
router.put('/:id', protect, async (req, res) => {
  try {
    const { matchName, date, timing, mode, results, isPublished } = req.body;

    const updatePayload = {};
    if (matchName) updatePayload.matchName = matchName.trim();
    if (date) updatePayload.date = date.trim();
    if (timing !== undefined) updatePayload.timing = timing.trim();
    if (mode !== undefined) updatePayload.mode = mode.trim();
    if (isPublished !== undefined) updatePayload.isPublished = Boolean(isPublished);

    if (Array.isArray(results)) {
      updatePayload.results = results.map((row, idx) => {
        const position = Number(row.position) || (idx + 1);
        const kills = Number(row.kills) || 0;
        const placementPoints = row.placementPoints !== undefined
          ? Number(row.placementPoints)
          : getPlacementPoints(position);
        const totalPoints = row.totalPoints !== undefined
          ? Number(row.totalPoints)
          : placementPoints + kills;

        return {
          position,
          teamName: (row.teamName || `Team ${idx + 1}`).trim(),
          teamTag: (row.teamTag || '').trim(),
          kills,
          placementPoints,
          totalPoints,
        };
      }).sort((a, b) => a.position - b.position);
    }

    const updated = await MatchResult.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Result not found' });
    }

    // Recompute rankings
    try {
      await syncRankingsFromResults();
    } catch (syncErr) {
      console.warn('Could not auto-sync rankings:', syncErr.message);
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/results/:id — Admin: Delete Result
router.delete('/:id', protect, async (req, res) => {
  try {
    const result = await MatchResult.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    // Recompute rankings after deletion
    try {
      await syncRankingsFromResults();
    } catch (syncErr) {
      console.warn('Could not auto-sync rankings:', syncErr.message);
    }

    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/results/sync-rankings — Admin: Force manual sync of rankings from all results
router.post('/sync-rankings', protect, async (req, res) => {
  try {
    await syncRankingsFromResults();
    res.json({ message: 'Rankings successfully synced with match results!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
