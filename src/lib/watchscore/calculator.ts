import { WatchScoreInput, WatchScoreResult, FactorScores } from "@/types/watchscore";
import { computeCloseness } from "./factors/closeness";
import { computeTimeRemaining } from "./factors/timeRemaining";
import { computeLeadChanges } from "./factors/leadChanges";
import { computeUpsetLikelihood } from "./factors/upsetLikelihood";
import { computeRankedStakes } from "./factors/rankedStakes";
import { computeTourneyImplications } from "./factors/tourneyImplications";
import { buildExplanation } from "./explainer";
import { getWatchScoreConfig } from "@/lib/config/watchscoreConfig";

/**
 * Core Watch Score calculator.
 *
 * Each factor returns 0–1. We multiply by weight, sum, and scale to 0–100.
 * Formula is intentionally transparent and configurable via config/watchscore.json.
 */
export function computeWatchScore(input: WatchScoreInput): WatchScoreResult {
  const config = getWatchScoreConfig();

  const factorScores: FactorScores = {
    closeness: computeCloseness(input),
    time_remaining: computeTimeRemaining(input),
    lead_changes: computeLeadChanges(input),
    upset_likelihood: computeUpsetLikelihood(input),
    ranked_stakes: computeRankedStakes(input),
    tourney_implications: computeTourneyImplications(input),
  };

  const weights = config.weights;
  const contributions: Record<string, number> = {};
  let weightedSum = 0;

  for (const [factor, rawScore] of Object.entries(factorScores)) {
    const weight = weights[factor as keyof typeof weights] ?? 0;
    const contribution = rawScore * weight;
    contributions[factor] = Math.round(contribution * 1000) / 10; // contribution as 0–100 points
    weightedSum += contribution;
  }

  // Scale: weightedSum is sum of (raw_score * weight). Since weights sum to ~1.0,
  // max theoretical value is 1.0, so multiply by 100 to get 0–100 score.
  const score = Math.min(100, Math.max(0, Math.round(weightedSum * 100)));

  const explanation = buildExplanation({
    factors: factorScores,
    contributions,
    input,
  });

  return {
    score,
    factorContributions: contributions,
    factorScores,
    explanation,
    modelVersion: config.model_version,
  };
}
