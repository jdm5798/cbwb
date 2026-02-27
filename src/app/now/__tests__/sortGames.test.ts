import { describe, it, expect } from "vitest";
import { sortGames, type SortKey } from "../page";
import type { GameWithState } from "@/types/game";
import type { WatchScoreResult } from "@/types/watchscore";

function makeGame(
  overrides: Partial<GameWithState> & { id: string }
): GameWithState {
  return {
    id: overrides.id,
    espnId: null,
    gameDate: "2026-02-26",
    scheduledAt: overrides.scheduledAt ?? "2026-02-26T20:00:00Z",
    homeTeam: {
      id: "ht1",
      canonicalName: "Home Team",
      espnId: null,
      logoUrl: null,
      conference: null,
    },
    awayTeam: {
      id: "at1",
      canonicalName: "Away Team",
      espnId: null,
      logoUrl: null,
      conference: null,
    },
    tvNetwork: null,
    status: overrides.status ?? "SCHEDULED",
    liveState: overrides.liveState ?? null,
    homeTeamRanking: overrides.homeTeamRanking ?? null,
    awayTeamRanking: overrides.awayTeamRanking ?? null,
    pregamePrediction: overrides.pregamePrediction ?? null,
  };
}

function makeScore(score: number): WatchScoreResult {
  return {
    score,
    factorContributions: {},
    factorScores: {
      closeness: 0,
      time_remaining: 0,
      lead_changes: 0,
      upset_likelihood: 0,
      ranked_stakes: 0,
      tourney_implications: 0,
    },
    explanation: "",
    modelVersion: "1.0",
  };
}

function makeEntry(
  gameOverrides: Partial<GameWithState> & { id: string },
  watchScoreValue: number
) {
  return {
    game: makeGame(gameOverrides),
    watchScore: makeScore(watchScoreValue),
  };
}

describe("sortGames", () => {
  describe("watchScore (default)", () => {
    it("sorts upcoming games by watch score descending", () => {
      const games = [
        makeEntry({ id: "a", status: "SCHEDULED" }, 40),
        makeEntry({ id: "b", status: "SCHEDULED" }, 80),
        makeEntry({ id: "c", status: "SCHEDULED" }, 60),
      ];
      const result = sortGames(games, "watchScore");
      expect(result.map((g) => g.game.id)).toEqual(["b", "c", "a"]);
    });

    it("sorts live games by watch score descending", () => {
      const games = [
        makeEntry({ id: "a", status: "IN_PROGRESS" }, 50),
        makeEntry({ id: "b", status: "IN_PROGRESS" }, 90),
      ];
      const result = sortGames(games, "watchScore");
      expect(result.map((g) => g.game.id)).toEqual(["b", "a"]);
    });
  });

  describe("thrillScore", () => {
    it("sorts by thrillScore descending", () => {
      const games = [
        makeEntry(
          { id: "a", status: "SCHEDULED", pregamePrediction: { homeScore: 70, awayScore: 65, thrillScore: 55, whyItMatters: "" } },
          50
        ),
        makeEntry(
          { id: "b", status: "SCHEDULED", pregamePrediction: { homeScore: 70, awayScore: 65, thrillScore: 88, whyItMatters: "" } },
          50
        ),
        makeEntry(
          { id: "c", status: "SCHEDULED", pregamePrediction: { homeScore: 70, awayScore: 65, thrillScore: 72, whyItMatters: "" } },
          50
        ),
      ];
      const result = sortGames(games, "thrillScore");
      expect(result.map((g) => g.game.id)).toEqual(["b", "c", "a"]);
    });

    it("places games without thrillScore last", () => {
      const games = [
        makeEntry({ id: "a", status: "SCHEDULED", pregamePrediction: null }, 50),
        makeEntry(
          { id: "b", status: "SCHEDULED", pregamePrediction: { homeScore: 70, awayScore: 65, thrillScore: 60, whyItMatters: "" } },
          50
        ),
      ];
      const result = sortGames(games, "thrillScore");
      expect(result.map((g) => g.game.id)).toEqual(["b", "a"]);
    });
  });

  describe("startTime", () => {
    it("sorts by scheduledAt ascending", () => {
      const games = [
        makeEntry({ id: "a", status: "SCHEDULED", scheduledAt: "2026-02-26T23:00:00Z" }, 80),
        makeEntry({ id: "b", status: "SCHEDULED", scheduledAt: "2026-02-26T19:00:00Z" }, 40),
        makeEntry({ id: "c", status: "SCHEDULED", scheduledAt: "2026-02-26T21:00:00Z" }, 60),
      ];
      const result = sortGames(games, "startTime");
      expect(result.map((g) => g.game.id)).toEqual(["b", "c", "a"]);
    });
  });

  describe("ranked", () => {
    it("sorts by best ranking (lower number first)", () => {
      const games = [
        makeEntry({ id: "a", status: "SCHEDULED", homeTeamRanking: 10, awayTeamRanking: null }, 50),
        makeEntry({ id: "b", status: "SCHEDULED", homeTeamRanking: 1, awayTeamRanking: 5 }, 50),
        makeEntry({ id: "c", status: "SCHEDULED", homeTeamRanking: null, awayTeamRanking: 3 }, 50),
      ];
      const result = sortGames(games, "ranked");
      // b has min(1,5)=1, c has min(999,3)=3, a has min(10,999)=10
      expect(result.map((g) => g.game.id)).toEqual(["b", "c", "a"]);
    });

    it("places unranked games last", () => {
      const games = [
        makeEntry({ id: "a", status: "SCHEDULED", homeTeamRanking: null, awayTeamRanking: null }, 50),
        makeEntry({ id: "b", status: "SCHEDULED", homeTeamRanking: 15, awayTeamRanking: null }, 50),
      ];
      const result = sortGames(games, "ranked");
      expect(result.map((g) => g.game.id)).toEqual(["b", "a"]);
    });
  });

  describe("status grouping is always preserved", () => {
    it("keeps live games before upcoming regardless of sort key", () => {
      const games = [
        makeEntry({ id: "upcoming-high", status: "SCHEDULED" }, 99),
        makeEntry({ id: "live-low", status: "IN_PROGRESS" }, 10),
      ];
      for (const key of ["watchScore", "thrillScore", "startTime", "ranked"] as SortKey[]) {
        const result = sortGames(games, key);
        expect(result[0].game.id).toBe("live-low");
        expect(result[1].game.id).toBe("upcoming-high");
      }
    });

    it("keeps final games after upcoming regardless of sort key", () => {
      const games = [
        makeEntry({ id: "final-high", status: "FINAL" }, 99),
        makeEntry({ id: "upcoming-low", status: "SCHEDULED" }, 1),
      ];
      for (const key of ["watchScore", "thrillScore", "startTime", "ranked"] as SortKey[]) {
        const result = sortGames(games, key);
        expect(result[0].game.id).toBe("upcoming-low");
        expect(result[1].game.id).toBe("final-high");
      }
    });

    it("does not mutate the original array", () => {
      const games = [
        makeEntry({ id: "a", status: "SCHEDULED" }, 40),
        makeEntry({ id: "b", status: "SCHEDULED" }, 80),
      ];
      const original = [...games];
      sortGames(games, "watchScore");
      expect(games[0].game.id).toBe(original[0].game.id);
    });
  });
});
