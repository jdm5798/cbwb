import { z } from "zod";

// ────────────────────────────────────────────────────────────────
// BartTorvik
// ────────────────────────────────────────────────────────────────

/**
 * BartTorvik's team_results.json is an array of positional arrays (no headers).
 * Minimum length check ensures we have the columns we need.
 *
 * Key column mapping (2026 season, verified against live data):
 *   [0]  trank           — T-Rank (overall rank)
 *   [1]  teamName        — team name string
 *   [2]  conference      — conference abbreviation
 *   [3]  record          — "W-L" string
 *   [4]  adjO            — adjusted offensive efficiency
 *   [6]  adjD            — adjusted defensive efficiency
 *   [8]  barthag         — pythagorean win expectancy (0–1)
 *   [41] wab             — wins above bubble
 *   [44] adjT            — adjusted tempo (possessions/40 min)
 */
export const BartTorvikRawArraySchema = z
  .array(z.unknown())
  .min(45, "BartTorvik row must have at least 45 columns");

/** Normalized, application-facing shape after parsing BartTorvik data. */
export interface BartTorvikTeamStats {
  teamName: string;
  trank: number;
  barthag: number; // pythagorean win expectancy 0–1
  adjO: number; // adjusted offensive efficiency
  adjD: number; // adjusted defensive efficiency
  adjT: number; // adjusted tempo (possessions/40 min)
  wins: number;
  losses: number;
  wab: number; // wins above bubble
}

// ────────────────────────────────────────────────────────────────
// Haslametrics
// ────────────────────────────────────────────────────────────────

/**
 * Haslametrics data is served from ratings.xml (Brotli-compressed).
 * Each <mr> element contains named XML attributes.
 *
 * Key attributes used:
 *   rk   — haslRank
 *   t    — team name
 *   id   — raw team ID (tid in URL = (id * 2) + 23)
 *   ap   — AP% (0–1, multiply ×100 to get percentage)
 *   oe   — offensive efficiency (precomputed)
 *   de   — defensive efficiency (precomputed)
 *   ou   — pace (possessions per game)
 *   mom  — momentum (recent vs. season average)
 *   mmo  — momentum offense
 *   mmd  — momentum defense
 *   ptf  — Paper Tiger Factor
 *   w/l  — wins and losses
 */
export interface HaslametricsTeamStats {
  teamName: string;
  haslRank: number;
  /** Numeric tid for team capsule URLs: haslametrics.com/ratings2.php?tid={tid} */
  tid: number;
  apPct: number; // All-Play % (0–100 scale)
  adjO: number;
  adjD: number;
  pace: number; // possessions per game
  momentum: number; // Mom
  momentumO: number; // MomO
  momentumD: number; // MomD
  ptf: number; // Paper Tiger Factor
  wins: number;
  losses: number;
}

// ────────────────────────────────────────────────────────────────
// Shared
// ────────────────────────────────────────────────────────────────

export type AdvancedStatsMetrics = BartTorvikTeamStats | HaslametricsTeamStats;
