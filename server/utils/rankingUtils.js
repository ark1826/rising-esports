import { Ranking } from '../models/Ranking.js';

/**
 * Recomputes the rank field for all rankings based on totalPoints descending.
 * Teams with higher totalPoints get a lower rank number (1 = top).
 */
export const recomputeRanks = async () => {
  try {
    // Fetch all rankings sorted by totalPoints descending
    const rankings = await Ranking.find().sort({ totalPoints: -1, rank: 1 });
    // Update each document's rank based on its position in the sorted array
    for (let i = 0; i < rankings.length; i++) {
      const newRank = i + 1;
      const ranking = rankings[i];
      // Only update if rank has changed to avoid unnecessary writes
      if (ranking.rank !== newRank) {
        await Ranking.findByIdAndUpdate(ranking._id, { rank: newRank });
      }
    }
  } catch (error) {
    console.error('Error recomputing ranks:', error);
    // Propagate error so callers can handle it if needed
    throw error;
  }
};
