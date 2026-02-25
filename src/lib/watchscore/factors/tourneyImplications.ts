import { WatchScoreInput } from "@/types/watchscore";

/**
 * Scores tournament / bubble implications.
 *
 * For MVP this is a proxy: any game involving a ranked team in the top 10
 * gets a moderate base score. Full bubble data requires advanced stats (Phase 2).
 *
 * Returns 0–1.
 */
export function computeTourneyImplications(input: WatchScoreInput): number {
  const homeRank = input.homeTeamRanking;
  const awayRank = input.awayTeamRanking;

  // Top-10 matchup = high tourney stakes
  if (homeRank !== null && homeRank <= 10 && awayRank !== null && awayRank <= 10) {
    return 0.9;
  }
  if (homeRank !== null && homeRank <= 10) return 0.6;
  if (awayRank !== null && awayRank <= 10) return 0.6;
  if (homeRank !== null && homeRank <= 25) return 0.35;
  if (awayRank !== null && awayRank <= 25) return 0.35;

  return 0;
}
