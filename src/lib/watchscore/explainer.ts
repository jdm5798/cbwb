import { FactorScores, WatchScoreInput } from "@/types/watchscore";

interface ExplainerContext {
  factors: FactorScores;
  contributions: Record<string, number>;
  input: WatchScoreInput;
}

/**
 * Generates a 1-sentence explanation of the Watch Score by combining
 * the top 2–3 contributing factors into a human-readable string.
 */
export function buildExplanation(ctx: ExplainerContext): string {
  const { factors, input } = ctx;

  // Sort factors by contribution descending
  const sorted = Object.entries(ctx.contributions)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key);

  const parts: string[] = [];

  // Describe each top factor in plain English
  for (const key of sorted.slice(0, 3)) {
    const phrase = describeFactor(key, factors, input);
    if (phrase) parts.push(phrase);
    if (parts.length >= 2) break;
  }

  if (parts.length === 0) return "Interesting matchup";
  if (parts.length === 1) return capitalize(parts[0]);
  return capitalize(parts[0]) + " + " + parts[1];
}

function describeFactor(
  key: string,
  factors: FactorScores,
  input: WatchScoreInput
): string | null {
  switch (key) {
    case "closeness": {
      const margin = Math.abs(input.homeScore - input.awayScore);
      if (factors.closeness >= 0.9) return "tied game";
      if (factors.closeness >= 0.7) return `${margin}-point game`;
      if (factors.closeness >= 0.5) return `within ${margin}`;
      return null;
    }
    case "time_remaining": {
      if (input.status === "HALFTIME") return "halftime";
      if (factors.time_remaining >= 0.9) return "final minutes";
      if (factors.time_remaining >= 0.75) return "late in the game";
      if (factors.time_remaining >= 0.5) return "second half";
      return null;
    }
    case "lead_changes": {
      if (factors.lead_changes >= 0.8) return `${input.leadChanges} lead changes`;
      if (factors.lead_changes >= 0.5) return "back-and-forth battle";
      if (factors.lead_changes >= 0.3) return "multiple lead changes";
      return null;
    }
    case "upset_likelihood": {
      if (factors.upset_likelihood >= 0.7) return "major upset brewing";
      if (factors.upset_likelihood >= 0.4) return "upset in the making";
      if (factors.upset_likelihood >= 0.2) return "underdog hanging around";
      return null;
    }
    case "ranked_stakes": {
      const homeRank = input.homeTeamRanking;
      const awayRank = input.awayTeamRanking;
      if (homeRank !== null && awayRank !== null) {
        return `#${Math.min(homeRank, awayRank)} vs #${Math.max(homeRank, awayRank)} ranked matchup`;
      }
      if (homeRank !== null) return `ranked team on the road`;
      if (awayRank !== null) return `ranked team at home`;
      return "ranked matchup";
    }
    case "tourney_implications": {
      if (factors.tourney_implications >= 0.8) return "huge tournament implications";
      if (factors.tourney_implications >= 0.5) return "tournament stakes";
      return null;
    }
    default:
      return null;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
