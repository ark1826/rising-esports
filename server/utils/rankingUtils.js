import { Ranking } from '../models/Ranking.js';
import { MatchResult } from '../models/MatchResult.js';

/**
 * Recomputes the rank field for all rankings based on totalPoints descending,
 * with tie-breaking rules: totalPoints DESC, finishes (kills) DESC, wwcd DESC, teamName ASC.
 */
export const recomputeRanks = async () => {
  try {
    const rankings = await Ranking.find().sort({
      totalPoints: -1,
      finishes: -1,
      wwcd: -1,
      teamName: 1,
    });

    for (let i = 0; i < rankings.length; i++) {
      const newRank = i + 1;
      const ranking = rankings[i];
      if (ranking.rank !== newRank) {
        await Ranking.findByIdAndUpdate(ranking._id, { rank: newRank });
      }
    }
    return rankings;
  } catch (error) {
    console.error('Error recomputing ranks:', error);
    throw error;
  }
};

/**
 * Automatically calculates and syncs Team Rankings from all published MatchResult documents.
 * Aggregates:
 * - totalMatches: count of matches participated
 * - wwcd: matches won (position 1)
 * - finishes: total kills
 * - totalPoints: sum of points
 */
export const syncRankingsFromResults = async () => {
  try {
    const publishedResults = await MatchResult.find({ isPublished: true });
    
    if (!publishedResults || publishedResults.length === 0) {
      // If no match results exist, just recompute existing ranks
      await recomputeRanks();
      return;
    }

    // Map by normalized team name
    const teamStats = new Map();

    for (const match of publishedResults) {
      if (!Array.isArray(match.results)) continue;
      for (const row of match.results) {
        if (!row.teamName) continue;
        const normalizedName = row.teamName.trim();
        const key = normalizedName.toLowerCase();

        if (!teamStats.has(key)) {
          teamStats.set(key, {
            teamName: normalizedName,
            teamTag: row.teamTag || '',
            totalMatches: 0,
            finishes: 0,
            wwcd: 0,
            totalPoints: 0,
          });
        }

        const stats = teamStats.get(key);
        stats.totalMatches += 1;
        stats.finishes += Number(row.kills) || 0;
        if (Number(row.position) === 1) {
          stats.wwcd += 1;
        }
        stats.totalPoints += Number(row.totalPoints) || 0;
        if (row.teamTag && !stats.teamTag) {
          stats.teamTag = row.teamTag;
        }
      }
    }

    // Upsert each team in the Ranking collection
    for (const stats of teamStats.values()) {
      await Ranking.findOneAndUpdate(
        { teamName: { $regex: new RegExp(`^${stats.teamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        {
          $set: {
            teamName: stats.teamName,
            teamTag: stats.teamTag,
            totalMatches: stats.totalMatches,
            finishes: stats.finishes,
            wwcd: stats.wwcd,
            totalPoints: stats.totalPoints,
          },
          $setOnInsert: { rank: 999 },
        },
        { upsert: true, new: true }
      );
    }

    // Recompute rank numbering
    await recomputeRanks();
  } catch (error) {
    console.error('Error syncing rankings from match results:', error);
    throw error;
  }
};
