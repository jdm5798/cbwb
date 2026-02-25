import { NextResponse } from "next/server";
import { EspnProvider } from "@/lib/providers/espn/EspnProvider";
import { upsertGames } from "@/lib/db/games";

const provider = new EspnProvider();

/**
 * Internal cron endpoint — called by Vercel Cron (or manually) to keep live
 * game data fresh without relying purely on client-side polling.
 *
 * To enable on Vercel, add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/internal/cron", "schedule": "* * * * *" }]
 * }
 */
export async function POST() {
  const date = new Date().toISOString().substring(0, 10);
  const espnDate = date.replace(/-/g, "");

  try {
    const games = await provider.fetchGames(espnDate);
    await upsertGames(games);
    const liveCount = games.filter((g) =>
      ["IN_PROGRESS", "HALFTIME"].includes(g.status)
    ).length;

    return NextResponse.json({
      success: true,
      date,
      total: games.length,
      live: liveCount,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron] ESPN fetch failed:", err);
    return NextResponse.json(
      { error: "Cron fetch failed", details: String(err) },
      { status: 500 }
    );
  }
}
