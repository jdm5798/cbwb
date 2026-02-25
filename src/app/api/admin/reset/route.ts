import { NextRequest, NextResponse } from "next/server";
import { EspnProvider } from "@/lib/providers/espn/EspnProvider";
import { upsertGames } from "@/lib/db/games";
import { prisma } from "@/lib/db/prisma";

const provider = new EspnProvider();

function getTodayDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const date: string = body.date ?? getTodayDate();
  const espnDate = date.replace(/-/g, "");

  const run = await prisma.agentRun.create({
    data: {
      type: "game_reset",
      provider: "espn",
      status: "RUNNING",
      logs: [],
    },
  });

  const logs: string[] = [];

  try {
    logs.push(`[${new Date().toISOString()}] Deleting games for ${date}...`);
    const { count: deletedCount } = await prisma.game.deleteMany({
      where: { gameDate: date },
    });
    logs.push(`[${new Date().toISOString()}] Deleted ${deletedCount} games.`);

    logs.push(`[${new Date().toISOString()}] Fetching fresh data from ESPN...`);
    const games = await provider.fetchGames(espnDate);
    logs.push(`[${new Date().toISOString()}] Fetched ${games.length} games from ESPN.`);

    await upsertGames(games);
    logs.push(`[${new Date().toISOString()}] Upserted ${games.length} games to DB.`);

    const summary = `Reset complete: deleted ${deletedCount}, ingested ${games.length} games for ${date}.`;

    await prisma.agentRun.update({
      where: { id: run.id },
      data: { status: "SUCCESS", logs, summary, completedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      summary,
      deletedCount,
      ingestedCount: games.length,
      runId: run.id,
    });
  } catch (err) {
    const errMsg = `[${new Date().toISOString()}] ERROR: ${String(err)}`;
    logs.push(errMsg);
    console.error("[POST /api/admin/reset] Error:", err);

    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        logs,
        summary: `Reset failed: ${String(err)}`,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: "Reset failed", details: String(err), runId: run.id },
      { status: 500 }
    );
  }
}
