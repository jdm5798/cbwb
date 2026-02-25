import { WatchScoreInput } from "@/types/watchscore";

/**
 * Scores based on how late in the game it is.
 * Returns 0–1. 1.0 = final minutes of regulation or OT, 0.0 = very early.
 *
 * College basketball has 2 halves of 20 min each (2400s total).
 * OT periods are 5 min (300s).
 */
export function computeTimeRemaining(input: WatchScoreInput): number {
  if (input.status === "SCHEDULED") return 0;
  if (input.status === "FINAL") return 0;
  if (input.status === "HALFTIME") return 0.45; // midgame, moderate interest

  const clockSeconds = parseClockSeconds(input.clockDisplay);
  const period = input.period;

  if (period === 1) {
    // First half: 0.0 → 0.35 as time runs down
    if (clockSeconds === null) return 0.15;
    const elapsed = 1200 - clockSeconds; // seconds elapsed in 1st half
    return Math.min(0.35, (elapsed / 1200) * 0.35);
  }

  if (period === 2) {
    // Second half: 0.35 → 1.0 as time runs down
    if (clockSeconds === null) return 0.6;
    const fraction = 1 - clockSeconds / 1200; // 0 = start of 2nd half, 1 = end
    return 0.35 + fraction * 0.65;
  }

  // OT: always high (1.0)
  if (period >= 3) {
    if (clockSeconds === null) return 0.95;
    // OT is 300s; remaining time decreases urgency slightly from 1.0
    const fraction = 1 - clockSeconds / 300;
    return 0.9 + fraction * 0.1;
  }

  return 0.5;
}

/**
 * Parse a clock display string like "5:32" into total seconds.
 * Returns null if unparseable.
 */
function parseClockSeconds(clock: string | null): number | null {
  if (!clock) return null;
  const parts = clock.split(":");
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (!isNaN(mins) && !isNaN(secs)) return mins * 60 + secs;
  }
  return null;
}
