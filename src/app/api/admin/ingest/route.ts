import { NextRequest, NextResponse } from "next/server";
import { EspnProvider } from "@/lib/providers/espn/EspnProvider";
import { upsertGames } from "@/lib/db/games";
import { prisma } from "@/lib/db/prisma";

const provider = new EspnProvider();

function getTodayDate(): string {
  return new Date().toISOString().substring(0, 10);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const date: string = body.date ?? getTodayDate();
  const espnDate = date.replace(/-/g, "");

  // Create an AgentRun record to track this ingest
  const run = await prisma.agentRun.create({
    data: {
      type: "espn_ingest",
      provider: "espn",
      status: "RUNNING",
      logs: [],
    },
  });

  const logs: string[] = [];

  try {
    logs.push(`[${new Date().toISOString()}] Fetching ESPN scoreboard for ${date}...`);
    const games = await provider.fetchGames(espnDate);
    logs.push(`[${new Date().toISOString()}] Fetched ${games.length} games from ESPN.`);

    await upsertGames(games);
    logs.push(`[${new Date().toISOString()}] Upserted ${games.length} games to DB.`);

    const liveCount = games.filter((g) =>
      ["IN_PROGRESS", "HALFTIME"].includes(g.status)
    ).length;
    const summary = `Ingested ${games.length} games (${liveCount} live) for ${date}.`;

    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS",
        logs,
        summary,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, summary, runId: run.id, gamesCount: games.length });
  } catch (err) {
    const errMsg = `[${new Date().toISOString()}] ERROR: ${String(err)}`;
    logs.push(errMsg);
    console.error("[POST /api/admin/ingest] Error:", err);

    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        logs,
        summary: `Ingest failed: ${String(err)}`,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: "Ingest failed", details: String(err), runId: run.id },
      { status: 500 }
    );
  }
}
