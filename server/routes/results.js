import express from 'express';
import multer from 'multer';
import { MatchResult } from '../models/MatchResult.js';
import { Match } from '../models/Match.js';
import { protect } from '../middleware/auth.js';
import { syncRankingsFromResults } from '../utils/rankingUtils.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

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

// GET /api/results — Public: Get results filtered by ?date=YYYY-MM-DD and optional ?category
router.get('/', async (req, res) => {
  try {
    const { date, category } = req.query;
    const filter = { isPublished: true };
    if (date) {
      filter.date = date.trim();
    }
    if (category && category !== 'ALL') {
      filter.category = category.trim();
    }

    const results = await MatchResult.find(filter)
      .select('-results')
      .populate('matchId', 'matchName date timing mode maps status')
      .sort({ date: -1, createdAt: -1 })
      .lean();

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

// POST /api/results/upload-photo — Admin: Upload photo(s) of result & publish (supports multiple photos & batch lobbies)
router.post('/upload-photo', protect, upload.any(), async (req, res) => {
  try {
    const {
      matchName,
      category,
      lobby,
      date,
      timing,
      mode,
      imageUrl: manualUrl,
      batch,
      batchLobbies,
      batchTitles,
    } = req.body;

    const files = req.files || (req.file ? [req.file] : []);

    const uploadBuffer = async (file) => {
      try {
        const cloudRes = await uploadToCloudinary(file.buffer, 'rising-esports/results');
        return cloudRes.secure_url;
      } catch (cloudErr) {
        console.warn('[Cloudinary Notice]', cloudErr.message, '- Falling back to base64 data URI');
        return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }
    };

    const targetCategory = (category && category.trim()) ? category.trim() : 'DAILY SCRIMS';

    // BATCH MODE: multiple files representing separate lobby results
    if (batch === 'true' && files.length > 0) {
      let parsedLobbies = [];
      try {
        parsedLobbies = batchLobbies ? JSON.parse(batchLobbies) : [];
      } catch {
        parsedLobbies = (batchLobbies || '').split(',').map(s => s.trim());
      }

      let parsedTitles = [];
      try {
        parsedTitles = batchTitles ? JSON.parse(batchTitles) : [];
      } catch {
        parsedTitles = (batchTitles || '').split(',').map(s => s.trim());
      }

      const createdResults = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadedUrl = await uploadBuffer(file);
        const itemLobby = parsedLobbies[i] || (files.length > 1 ? `LOBBY 0${i + 1}` : (lobby || 'LOBBY 01'));
        const itemTitle = parsedTitles[i] || matchName || (targetCategory === 'DAILY SCRIMS' ? 'RISING DAILY GRIND SCRIM - POINT TABLE' : 'RISING WAR TOURNAMENT - POINT TABLE');

        const newResult = await MatchResult.create({
          category: targetCategory,
          matchName: itemTitle.trim(),
          lobby: itemLobby.trim(),
          date: date ? date.trim() : new Date().toISOString().split('T')[0],
          timing: timing ? timing.trim() : '',
          mode: mode ? mode.trim() : 'Squad TPP',
          imageUrl: uploadedUrl,
          imageUrls: [uploadedUrl],
          isPublished: true,
          results: [],
        });
        createdResults.push(newResult);
      }

      return res.status(201).json({
        message: `${createdResults.length} match results published successfully!`,
        results: createdResults,
      });
    }

    // SINGLE RESULT with one or multiple photos attached
    if (!matchName || !matchName.trim()) {
      return res.status(400).json({ message: 'Title / Match Name is required (e.g. RISING 03-05 PM GRIND SCRIM - POINT TABLE)' });
    }

    const uploadedUrls = [];
    if (files.length > 0) {
      for (const file of files) {
        const url = await uploadBuffer(file);
        if (url) uploadedUrls.push(url);
      }
    }
    if (manualUrl && manualUrl.trim()) {
      uploadedUrls.push(manualUrl.trim());
    }

    if (uploadedUrls.length === 0) {
      return res.status(400).json({ message: 'Please select an image file to upload or provide an image URL' });
    }

    const newResult = await MatchResult.create({
      category: targetCategory,
      matchName: matchName.trim(),
      lobby: lobby ? lobby.trim() : 'LOBBY 01',
      date: date ? date.trim() : new Date().toISOString().split('T')[0],
      timing: timing ? timing.trim() : '',
      mode: mode ? mode.trim() : 'Squad TPP',
      imageUrl: uploadedUrls[0],
      imageUrls: uploadedUrls,
      isPublished: true,
      results: [],
    });

    res.status(201).json({
      message: 'Result photo(s) uploaded and published successfully!',
      result: newResult,
    });
  } catch (error) {
    console.error('Error uploading result photo:', error);
    res.status(500).json({ message: error.message || 'Failed to upload result photo' });
  }
});

// POST /api/results — Admin: Create or Publish Match Result
router.post('/', protect, async (req, res) => {
  try {
    const { matchId, matchName, lobby, imageUrl, date, timing, mode, results, isPublished } = req.body;

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
      lobby: lobby ? lobby.trim() : 'LOBBY 01',
      imageUrl: imageUrl ? imageUrl.trim() : '',
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
    const { matchName, lobby, imageUrl, date, timing, mode, results, isPublished } = req.body;

    const updatePayload = {};
    if (matchName) updatePayload.matchName = matchName.trim();
    if (lobby !== undefined) updatePayload.lobby = lobby.trim();
    if (imageUrl !== undefined) updatePayload.imageUrl = imageUrl.trim();
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
