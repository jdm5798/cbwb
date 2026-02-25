import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Stub for Phase 2 Claude API agent runs.
// When implemented, this will call statsIngestionAgent.ts.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { provider, season } = body as { provider?: string; season?: number };

  if (!provider) {
    return NextResponse.json({ error: "provider is required" }, { status: 400 });
  }

  const run = await prisma.agentRun.create({
    data: {
      type: "advanced_stats_ingest",
      provider,
      status: "FAILED",
      logs: ["Agent ingestion not yet implemented. Coming in Phase 2."],
      summary: "Phase 2 feature — not yet implemented.",
      completedAt: new Date(),
    },
  });

  return NextResponse.json(
    {
      error: "Agent ingestion is a Phase 2 feature and not yet implemented.",
      runId: run.id,
      provider,
      season,
    },
    { status: 501 }
  );
}

export async function GET() {
  const runs = await prisma.agentRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ runs });
}
