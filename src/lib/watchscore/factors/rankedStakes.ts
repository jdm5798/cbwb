import { WatchScoreInput } from "@/types/watchscore";

/**
 * Scores based on ranking stakes — top-ranked teams = higher interest.
 *
 * Returns 0–1:
 * - Both teams ranked: 0.7 + bonus for top-5 matchup
 * - One ranked team: 0.3–0.5 based on rank
 * - Neither ranked: 0
 */
export function computeRankedStakes(input: WatchScoreInput): number {
  const homeRank = input.homeTeamRanking;
  const awayRank = input.awayTeamRanking;

  const homeRanked = homeRank !== null && homeRank <= 25;
  const awayRanked = awayRank !== null && awayRank <= 25;

  if (!homeRanked && !awayRanked) return 0;

  if (homeRanked && awayRanked) {
    const topRank = Math.min(homeRank!, awayRank!);
    // Both ranked: base 0.7, bonus for top-5 matchup (up to 1.0)
    const bonus = Math.max(0, (10 - topRank) * 0.03);
    return Math.min(1, 0.7 + bonus);
  }

  // Only one team ranked
  const rank = homeRanked ? homeRank! : awayRank!;
  // Top 5 = 0.5, Top 25 = 0.3
  return Math.max(0.3, 0.5 - (rank - 1) * 0.01);
}
