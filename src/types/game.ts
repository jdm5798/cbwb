export type GameStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "HALFTIME"
  | "FINAL"
  | "POSTPONED"
  | "CANCELLED";

export interface CanonicalTeam {
  externalId: string; // ESPN team ID
  name: string;
  shortName?: string;
  abbreviation?: string;
  logoUrl?: string;
  ranking?: number | null; // AP/Coaches poll ranking, null if unranked
  conference?: string;
}

export interface CanonicalLiveState {
  homeScore: number;
  awayScore: number;
  period: number;
  clockDisplay: string | null; // e.g. "5:32", "Halftime", "Final"
  leadChanges: number;
  winProbHome: number | null; // 0–1
  possession: "home" | "away" | null;
}

export interface CanonicalGame {
  externalId: string; // ESPN game ID
  provider: string;
  gameDate: string; // YYYY-MM-DD
  scheduledAt: Date;
  homeTeam: CanonicalTeam;
  awayTeam: CanonicalTeam;
  tvNetwork: string | null;
  status: GameStatus;
  liveState: CanonicalLiveState | null;
  // Spread from ESPN odds (if available)
  spread?: number | null; // positive = home favored
  overUnder?: number | null;
}

// Full game with DB IDs — returned by API routes
export interface GameWithState {
  id: string;
  espnId: string | null;
  gameDate: string;
  scheduledAt: string; // ISO string
  homeTeam: {
    id: string;
    canonicalName: string;
    espnId: string | null;
    logoUrl: string | null;
    conference: string | null;
  };
  awayTeam: {
    id: string;
    canonicalName: string;
    espnId: string | null;
    logoUrl: string | null;
    conference: string | null;
  };
  tvNetwork: string | null;
  status: GameStatus;
  liveState: {
    homeScore: number;
    awayScore: number;
    period: number;
    clockDisplay: string | null;
    leadChanges: number;
    winProbHome: number | null;
    possession: string | null;
  } | null;
  homeTeamRanking?: number | null;
  awayTeamRanking?: number | null;
  spread?: number | null;
  overUnder?: number | null;
  // Team records — placeholder until BartTorvik/Haslametrics integration
  homeTeamRecord?: { wins: number; losses: number } | null;
  awayTeamRecord?: { wins: number; losses: number } | null;
  // Pregame prediction — placeholder until BartTorvik/Haslametrics integration
  pregamePrediction?: {
    homeScore: number;
    awayScore: number;
    thrillScore: number; // 0-100
    whyItMatters: string;
  } | null;
  // Live context — placeholder, currently driven by watchScore.explanation
  liveContext?: {
    whyItMatters: string;
  } | null;
}
