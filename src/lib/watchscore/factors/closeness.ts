import { WatchScoreInput } from "@/types/watchscore";

/**
 * Scores how close the game is.
 * Returns 0–1. 1.0 = tied, ~0 = 25+ point blowout.
 * Returns 0.5 for pregame (neutral).
 */
export function computeCloseness(input: WatchScoreInput): number {
  if (
    input.status === "SCHEDULED" ||
    input.status === "FINAL"
  ) {
    return 0.5;
  }

  const margin = Math.abs(input.homeScore - input.awayScore);
  const blowoutMargin = 25;
  // Linear decay: 0 margin = 1.0, blowoutMargin = 0.0
  return Math.max(0, 1 - margin / blowoutMargin);
}
