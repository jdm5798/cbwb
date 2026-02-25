import { NextRequest, NextResponse } from "next/server";
import { EspnProvider } from "@/lib/providers/espn/EspnProvider";
import { upsertGames, getGamesForDate } from "@/lib/db/games";
import { prisma } from "@/lib/db/prisma";

const provider = new EspnProvider();

function getTodayDate(): string {
  return new Date().toISOString().substring(0, 10);
}

function toEspnDateFormat(date: string): string {
  // Convert YYYY-MM-DD → YYYYMMDD
  return date.replace(/-/g, "");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? getTodayDate();

  try {
    // Check DB freshness — if we have games updated within the last 35s, serve from DB
    const cutoff = new Date(Date.now() - 35_000);
    const recentCount = await prisma.game.count({
      where: {
        gameDate: date,
        updatedAt: { gte: cutoff },
        status: { in: ["IN_PROGRESS", "HALFTIME"] },
      },
    });

    let games;

    if (recentCount === 0) {
      // Cache miss: fetch from ESPN and persist
      try {
        const espnDate = toEspnDateFormat(date);
        const canonicalGames = await provider.fetchGames(espnDate);
        await upsertGames(canonicalGames);
      } catch (fetchErr) {
        console.error("[games] ESPN fetch failed, falling back to DB:", fetchErr);
        // Fall through to serve stale DB data
      }
    }

    games = await getGamesForDate(date);

    return NextResponse.json({
      games,
      date,
      fetchedAt: new Date().toISOString(),
      fromCache: recentCount > 0,
    });
  } catch (err) {
    console.error("[GET /api/games] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch games", details: String(err) },
      { status: 500 }
    );
  }
}
