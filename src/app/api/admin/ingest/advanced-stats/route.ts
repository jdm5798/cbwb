import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { fetchBartTorvik } from "@/lib/providers/barttorvik/barttorvikClient";
import { normalizeBartTorvik } from "@/lib/providers/barttorvik/barttorvikNormalizer";
import { fetchHaslametrics } from "@/lib/providers/haslametrics/haslametricsClient";
import { normalizeHaslametrics } from "@/lib/providers/haslametrics/haslametricsNormalizer";
import { findBestMatch } from "@/lib/reconciliation/teamMatcher";
import { upsertAdvancedStats } from "@/lib/db/advancedStats";

/** Returns the current CBB season year (e.g. 2026 for the 2025-26 season). */
function getCurrentSeason(): number {
  const month = new Date().getMonth(); // 0-indexed
  return month >= 7 ? new Date().getFullYear() + 1 : new Date().getFullYear();
}

/** Timestamp prefix for log entries. */
const ts = () => `[${new Date().toISOString()}]`;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as {
    providers?: string[];
    season?: number;
  };

  const providers: string[] = body.providers ?? ["barttorvik", "haslametrics"];
  const season: number = body.season ?? getCurrentSeason();

  // Create AgentRun to track this ingestion
  const run = await prisma.agentRun.create({
    data: {
      type: "advanced_stats_ingest",
      provider: providers.join(","),
      status: "RUNNING",
      logs: [],
    },
  });

  const logs: string[] = [];

  try {
    // Load all canonical teams once — used as candidates for fuzzy matching
    const allTeams = await prisma.team.findMany({
      select: { id: true, canonicalName: true, aliases: true },
    });
    logs.push(`${ts()} Loaded ${allTeams.length} canonical teams for matching.`);

    const asOfDate = new Date().toISOString().substring(0, 10);

    let btCount = 0;
    let btSkipped = 0;
    let haslCount = 0;
    let haslSkipped = 0;

    // ── BartTorvik ───────────────────────────────────────────────
    if (providers.includes("barttorvik")) {
      logs.push(`${ts()} Fetching BartTorvik season ${season}...`);

      const rawBt = await fetchBartTorvik(season);
      const btTeams = normalizeBartTorvik(rawBt);
      logs.push(`${ts()} Parsed ${btTeams.length} BartTorvik entries.`);

      for (const btTeam of btTeams) {
        const match = await findBestMatch(btTeam.teamName, "barttorvik", allTeams);
        if (!match) {
          btSkipped++;
          continue;
        }
        await upsertAdvancedStats(match.teamId, "barttorvik", asOfDate, btTeam);
        btCount++;
      }

      logs.push(
        `${ts()} BartTorvik done: ${btCount} upserted, ${btSkipped} unmatched.`
      );
    }

    // ── Haslametrics ─────────────────────────────────────────────
    if (providers.includes("haslametrics")) {
      logs.push(`${ts()} Fetching Haslametrics ratings XML...`);

      const haslXml = await fetchHaslametrics();
      const haslTeams = normalizeHaslametrics(haslXml);
      logs.push(`${ts()} Parsed ${haslTeams.length} Haslametrics entries.`);

      for (const haslTeam of haslTeams) {
        const match = await findBestMatch(
          haslTeam.teamName,
          "haslametrics",
          allTeams
        );
        if (!match) {
          haslSkipped++;
          continue;
        }
        await upsertAdvancedStats(
          match.teamId,
          "haslametrics",
          asOfDate,
          haslTeam
        );
        haslCount++;
      }

      logs.push(
        `${ts()} Haslametrics done: ${haslCount} upserted, ${haslSkipped} unmatched.`
      );
    }

    const totalSkipped = btSkipped + haslSkipped;
    // PARTIAL if >45% of teams are unmatched — signals a structural issue.
    // ~36–40% unmatched is expected (low-major programs not in our team database).
    const totalAttempted = btCount + btSkipped + haslCount + haslSkipped;
    const unmatched_pct = totalAttempted > 0 ? totalSkipped / totalAttempted : 0;
    const status = unmatched_pct > 0.45 ? "PARTIAL" : "SUCCESS";

    const summary = `BT: ${btCount} upserted / ${btSkipped} skipped, Hasl: ${haslCount} upserted / ${haslSkipped} skipped. ${Math.round(unmatched_pct * 100)}% unmatched (low-major programs not in team database).`;

    await prisma.agentRun.update({
      where: { id: run.id },
      data: { status, logs, summary, completedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      summary,
      runId: run.id,
      btCount,
      haslCount,
      skipped: totalSkipped,
    });
  } catch (err) {
    const errMsg = `${ts()} ERROR: ${String(err)}`;
    logs.push(errMsg);
    console.error("[POST /api/admin/ingest/advanced-stats] Error:", err);

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
      { error: "Advanced stats ingest failed", details: String(err), runId: run.id },
      { status: 500 }
    );
  }
}
