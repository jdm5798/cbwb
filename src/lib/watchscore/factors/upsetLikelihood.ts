import { WatchScoreInput } from "@/types/watchscore";

/**
 * Scores upset likelihood.
 *
 * Signals (in priority order):
 * 1. Win probability: if underdog (per pregame spread) has win prob > 50%, score scales with upset magnitude
 * 2. Unranked team leading a ranked team late
 * 3. Pregame spread: underdog winning by more than spread
 *
 * Returns 0–1.
 */
export function computeUpsetLikelihood(input: WatchScoreInput): number {
  if (input.status === "SCHEDULED" || input.status === "FINAL") return 0;

  const scores: number[] = [];

  // 1. Win probability signal
  if (input.winProbHome !== null && input.spread !== null) {
    const homeIsFavorite = input.spread > 0;
    const winProbFavorite = homeIsFavorite
      ? input.winProbHome
      : 1 - input.winProbHome;

    // If favorite's win prob has dropped below 50%, upset is brewing
    if (winProbFavorite < 0.5) {
      // Scale: 50% favorite win prob = 0.5 score, 10% = 1.0 score
      const upsetScore = Math.min(1, (0.5 - winProbFavorite) * 2);
      scores.push(upsetScore);
    }
  }

  // 2. Ranking differential signal
  const homeRanked = input.homeTeamRanking !== null;
  const awayRanked = input.awayTeamRanking !== null;
  const eitherRanked = homeRanked || awayRanked;

  if (eitherRanked) {
    const homeScore = input.homeScore;
    const awayScore = input.awayScore;
    const homeLeading = homeScore > awayScore;
    const awayLeading = awayScore > homeScore;

    // Unranked team leading ranked team
    if (homeLeading && !homeRanked && awayRanked) {
      const awayRank = input.awayTeamRanking!;
      // Top 5 upset = 0.8, top 25 = 0.4
      scores.push(Math.max(0.3, 0.8 - (awayRank - 1) * 0.02));
    } else if (awayLeading && !awayRanked && homeRanked) {
      const homeRank = input.homeTeamRanking!;
      scores.push(Math.max(0.3, 0.8 - (homeRank - 1) * 0.02));
    }

    // Lower-ranked team leading higher-ranked team
    if (homeRanked && awayRanked) {
      const homeRank = input.homeTeamRanking!;
      const awayRank = input.awayTeamRanking!;
      if (homeLeading && homeRank > awayRank) {
        const diff = homeRank - awayRank;
        scores.push(Math.min(0.6, diff * 0.05));
      } else if (awayLeading && awayRank > homeRank) {
        const diff = awayRank - homeRank;
        scores.push(Math.min(0.6, diff * 0.05));
      }
    }
  }

  if (scores.length === 0) return 0;
  return Math.min(1, Math.max(...scores));
}
