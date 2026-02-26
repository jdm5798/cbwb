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
  record?: { wins: number; losses: number } | null; // ESPN W-L record
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
  // Team records — BartTorvik preferred, ESPN as fallback
  homeTeamRecord?: { wins: number; losses: number } | null;
  awayTeamRecord?: { wins: number; losses: number } | null;
  // Raw ESPN records stored at ingest time (used as fallback when BartTorvik has no match)
  homeTeamEspnRecord?: { wins: number; losses: number } | null;
  awayTeamEspnRecord?: { wins: number; losses: number } | null;
  // BartTorvik T-Rank (analytical rank, will eventually be replaced by own ranking)
  homeBtRank?: number | null;
  awayBtRank?: number | null;
  // Pregame prediction
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
