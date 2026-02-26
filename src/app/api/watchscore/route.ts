import { NextRequest, NextResponse } from "next/server";
import { EspnProvider } from "@/lib/providers/espn/EspnProvider";
import { upsertGames, getGamesForDate } from "@/lib/db/games";
import { computeWatchScore } from "@/lib/watchscore/calculator";
import { computeProjectedScores, computeThrillScore } from "@/lib/watchscore/projectScore";
import { prisma } from "@/lib/db/prisma";
import { WatchScoreInput, WatchScoreResult } from "@/types/watchscore";
import { GameWithState } from "@/types/game";
import { BartTorvikTeamStats } from "@/types/advancedStats";

const provider = new EspnProvider();

function getTodayDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function toEspnDateFormat(date: string): string {
  return date.replace(/-/g, "");
}

type StatsEntry = { barttorvik?: BartTorvikTeamStats };

/**
 * Enriches a game with real advanced stats data from the pre-loaded statsMap.
 * Falls back gracefully when no stats exist for a team (null record, watchScore thrill).
 */
function enrichWithStats(
  game: GameWithState,
  watchScore: WatchScoreResult,
  statsMap: Map<string, StatsEntry>
): GameWithState {
  const homeBt = statsMap.get(game.homeTeam.id)?.barttorvik ?? null;
  const awayBt = statsMap.get(game.awayTeam.id)?.barttorvik ?? null;

  // Records: real wins/losses from BartTorvik, or null (GameCard hides null gracefully)
  const homeTeamRecord = homeBt ? { wins: homeBt.wins, losses: homeBt.losses } : null;
  const awayTeamRecord = awayBt ? { wins: awayBt.wins, losses: awayBt.losses } : null;

  let pregamePrediction: GameWithState["pregamePrediction"] = null;
  if (game.status === "SCHEDULED") {
    const hasStats = homeBt && awayBt;
    const { homeScore, awayScore } = hasStats
      ? computeProjectedScores(homeBt, awayBt)
      : { homeScore: 0, awayScore: 0 };
    const thrillScore = hasStats
      ? computeThrillScore(homeBt, awayBt, homeScore, awayScore)
      : Math.round(watchScore.score);
    pregamePrediction = { homeScore, awayScore, thrillScore, whyItMatters: watchScore.explanation };
  }

  const liveContext =
    game.status === "IN_PROGRESS" || game.status === "HALFTIME"
      ? { whyItMatters: watchScore.explanation }
      : null;

  return { ...game, homeTeamRecord, awayTeamRecord, pregamePrediction, liveContext };
}

function gameToWatchScoreInput(game: GameWithState): WatchScoreInput {
  return {
    gameId: game.id,
    status: game.status,
    homeScore: game.liveState?.homeScore ?? 0,
    awayScore: game.liveState?.awayScore ?? 0,
    period: game.liveState?.period ?? 1,
    clockDisplay: game.liveState?.clockDisplay ?? null,
    leadChanges: game.liveState?.leadChanges ?? 0,
    winProbHome: game.liveState?.winProbHome ?? null,
    homeTeamRanking: game.homeTeamRanking ?? null,
    awayTeamRanking: game.awayTeamRanking ?? null,
    spread: game.spread ?? null,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? getTodayDate();

  try {
    // If DB has no games for today, fetch ESPN synchronously (first load of the day).
    // Otherwise, serve DB data immediately and refresh ESPN in the background.
    const existingCount = await prisma.game.count({ where: { gameDate: date } });

    if (existingCount === 0) {
      try {
        const canonicalGames = await provider.fetchGames(toEspnDateFormat(date));
        await upsertGames(canonicalGames);
      } catch (fetchErr) {
        console.error("[watchscore] Initial ESPN fetch failed:", fetchErr);
      }
    } else {
      const cutoff = new Date(Date.now() - 35_000);
      const recentCount = await prisma.game.count({
        where: { gameDate: date, updatedAt: { gte: cutoff } },
      });
      if (recentCount === 0) {
        refreshInBackground(date);
      }
    }

    const games = await getGamesForDate(date);

    // Batch prefetch advanced stats for all teams in today's games (one DB query)
    const allTeamIds = games.flatMap((g) => [g.homeTeam.id, g.awayTeam.id]);
    const statsRows = await prisma.advancedStatsTeam.findMany({
      where: { teamId: { in: allTeamIds } },
      orderBy: { asOfDate: "desc" },
    });
    const statsMap = new Map<string, StatsEntry>();
    for (const row of statsRows) {
      if (!statsMap.has(row.teamId)) statsMap.set(row.teamId, {});
      const entry = statsMap.get(row.teamId)!;
      if (row.provider === "barttorvik" && !entry.barttorvik)
        entry.barttorvik = row.metrics as BartTorvikTeamStats;
    }

    // Score all games and enrich with real advanced stats (falls back gracefully)
    const scored = games.map((game) => {
      const input = gameToWatchScoreInput(game);
      const watchScore = computeWatchScore(input);
      const enrichedGame = enrichWithStats(game, watchScore, statsMap);
      return { game: enrichedGame, watchScore };
    });

    // Sort: live games first (by score desc), then scheduled by start time
    scored.sort((a, b) => {
      const aLive = ["IN_PROGRESS", "HALFTIME"].includes(a.game.status);
      const bLive = ["IN_PROGRESS", "HALFTIME"].includes(b.game.status);

      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      if (aLive && bLive) return b.watchScore.score - a.watchScore.score;
      return b.watchScore.score - a.watchScore.score;
    });

    // Persist snapshots for live games asynchronously (fire-and-forget)
    persistSnapshots(scored.filter((s) =>
      ["IN_PROGRESS", "HALFTIME"].includes(s.game.status)
    ));

    const config = await import("@/lib/config/watchscoreConfig").then(
      (m) => m.getWatchScoreConfig()
    );

    return NextResponse.json({
      games: scored,
      computedAt: new Date().toISOString(),
      modelVersion: config.model_version,
      date,
    });
  } catch (err) {
    console.error("[GET /api/watchscore] Error:", err);
    return NextResponse.json(
      { error: "Failed to compute watch scores", details: String(err) },
      { status: 500 }
    );
  }
}

function refreshInBackground(date: string): void {
  provider.fetchGames(toEspnDateFormat(date))
    .then((games) => upsertGames(games))
    .catch((err) => console.error("[watchscore] Background refresh failed:", err));
}

async function persistSnapshots(
  scored: Array<{ game: GameWithState; watchScore: ReturnType<typeof computeWatchScore> }>
) {
  try {
    for (const { game, watchScore } of scored) {
      await prisma.watchScoreSnapshot.create({
        data: {
          gameId: game.id,
          score: watchScore.score,
          factorContributions: watchScore.factorContributions,
          explanation: watchScore.explanation,
          modelVersion: watchScore.modelVersion,
        },
      });
    }
  } catch {
    // Non-fatal — snapshot persistence failure shouldn't break the response
  }
}
