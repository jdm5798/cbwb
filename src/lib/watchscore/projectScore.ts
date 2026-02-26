import type { BartTorvikTeamStats } from "@/types/advancedStats";

/**
 * Average D1 adjusted efficiency (points per 100 possessions) for 2025-26.
 * Used to normalize adjO × adjD cross-product projections.
 */
const D1_AVG_EFF = 102;

/**
 * Projects final scores for a matchup using KenPom-style efficiency math.
 *
 * Formula:
 *   avgTempo = (homeAdjT + awayAdjT) / 2
 *   homeScore = homeAdjO × (awayAdjD / D1_AVG_EFF) × avgTempo / 100
 *   awayScore = awayAdjO × (homeAdjD / D1_AVG_EFF) × avgTempo / 100
 *
 * adjO = points scored per 100 possessions (higher = better offense)
 * adjD = points allowed per 100 possessions (lower = better defense)
 * adjT = possessions per 40 minutes
 */
export function computeProjectedScores(
  home: Pick<BartTorvikTeamStats, "adjO" | "adjD" | "adjT">,
  away: Pick<BartTorvikTeamStats, "adjO" | "adjD" | "adjT">
): { homeScore: number; awayScore: number } {
  const avgTempo = (home.adjT + away.adjT) / 2;
  return {
    homeScore: Math.round((home.adjO * (away.adjD / D1_AVG_EFF) * avgTempo) / 100),
    awayScore: Math.round((away.adjO * (home.adjD / D1_AVG_EFF) * avgTempo) / 100),
  };
}

/**
 * Computes a pregame thrill score (0–100) for a matchup.
 *
 * Formula:
 *   closeness = max(0, 1 - margin / 20)   → 1.0 at 0pt, 0 at 20+pt
 *   quality   = (home.barthag + away.barthag) / 2  → 0–1
 *   thrill    = round((0.6 × closeness + 0.4 × quality) × 100), clamped 0–100
 *
 * barthag is BartTorvik's power rating (0–1; elite teams approach 1.0).
 */
export function computeThrillScore(
  home: Pick<BartTorvikTeamStats, "barthag">,
  away: Pick<BartTorvikTeamStats, "barthag">,
  homeScore: number,
  awayScore: number
): number {
  const margin = Math.abs(homeScore - awayScore);
  const closeness = Math.max(0, 1 - margin / 20);
  const quality = (home.barthag + away.barthag) / 2;
  return Math.min(100, Math.round((0.6 * closeness + 0.4 * quality) * 100));
}
