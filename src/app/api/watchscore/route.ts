import { NextRequest, NextResponse } from "next/server";
import { EspnProvider } from "@/lib/providers/espn/EspnProvider";
import { upsertGames, getGamesForDate } from "@/lib/db/games";
import { computeWatchScore } from "@/lib/watchscore/calculator";
import { prisma } from "@/lib/db/prisma";
import { WatchScoreInput, WatchScoreResult } from "@/types/watchscore";
import { GameWithState } from "@/types/game";

const provider = new EspnProvider();

function getTodayDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function toEspnDateFormat(date: string): string {
  return date.replace(/-/g, "");
}

/**
 * Enriches a game with placeholder data for fields that will eventually be
 * powered by BartTorvik / Haslametrics. Pipelines are wired; data is placeholder.
 */
function enrichWithPlaceholders(
  game: GameWithState,
  watchScore: WatchScoreResult
): GameWithState {
  // Team records — placeholder until BartTorvik/Haslametrics integration
  const homeTeamRecord = { wins: 0, losses: 0 };
  const awayTeamRecord = { wins: 0, losses: 0 };

  // Derive predicted scores from spread + overUnder when available
  let pregamePrediction: GameWithState["pregamePrediction"] = null;
  if (game.status === "SCHEDULED") {
    if (game.spread != null && game.overUnder != null) {
      const homeScore = Math.round((game.overUnder + game.spread) / 2);
      const awayScore = Math.round((game.overUnder - game.spread) / 2);
      pregamePrediction = {
        homeScore,
        awayScore,
        thrillScore: Math.round(watchScore.score),
        whyItMatters: watchScore.explanation,
      };
    } else {
      // Generic placeholder when no odds data available
      pregamePrediction = {
        homeScore: 0,
        awayScore: 0,
        thrillScore: Math.round(watchScore.score),
        whyItMatters: watchScore.explanation,
      };
    }
  }

  const liveContext =
    game.status === "IN_PROGRESS" || game.status === "HALFTIME"
      ? { whyItMatters: watchScore.explanation }
      : null;

  return {
    ...game,
    homeTeamRecord,
    awayTeamRecord,
    pregamePrediction,
    liveContext,
  };
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

    // Score all games and enrich with placeholder data
    const scored = games.map((game) => {
      const input = gameToWatchScoreInput(game);
      const watchScore = computeWatchScore(input);
      const enrichedGame = enrichWithPlaceholders(game, watchScore);
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
