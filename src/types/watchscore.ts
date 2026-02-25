import type { GameWithState } from "./game";

export interface WatchScoreInput {
  gameId: string;
  status: string;
  homeScore: number;
  awayScore: number;
  period: number;
  clockDisplay: string | null;
  leadChanges: number;
  winProbHome: number | null;
  homeTeamRanking: number | null;
  awayTeamRanking: number | null;
  spread: number | null; // positive = home favored by N points pregame
}

export interface FactorScores {
  closeness: number; // 0–1
  time_remaining: number; // 0–1
  lead_changes: number; // 0–1
  upset_likelihood: number; // 0–1
  ranked_stakes: number; // 0–1
  tourney_implications: number; // 0–1
}

export interface WatchScoreResult {
  score: number; // 0–100
  factorContributions: Record<string, number>; // contribution of each factor to total
  factorScores: FactorScores; // raw 0–1 scores
  explanation: string; // 1-sentence summary
  modelVersion: string;
}

export interface RankedGame {
  gameId: string;
  watchScore: WatchScoreResult;
}

// What the /api/watchscore endpoint returns
export interface WatchScoreResponse {
  games: Array<{
    game: GameWithState;
    watchScore: WatchScoreResult;
  }>;
  computedAt: string;
  modelVersion: string;
}
