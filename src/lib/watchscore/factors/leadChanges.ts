import { WatchScoreInput } from "@/types/watchscore";

/**
 * Scores based on number of lead changes — higher = more back-and-forth.
 * Returns 0–1. Caps at 1.0 for ≥ 15 lead changes.
 */
export function computeLeadChanges(input: WatchScoreInput): number {
  if (input.status === "SCHEDULED") return 0;
  if (input.leadChanges <= 0) return 0;

  // 15+ lead changes = max score; scales linearly
  const maxLeadChanges = 15;
  return Math.min(1, input.leadChanges / maxLeadChanges);
}
