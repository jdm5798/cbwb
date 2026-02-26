import { prisma } from "./prisma";
import { AdvancedStatsMetrics } from "@/types/advancedStats";

/**
 * Upserts a single advanced stats snapshot for a team.
 * Keyed by (teamId, provider, asOfDate) — one row per team per source per day.
 */
export async function upsertAdvancedStats(
  teamId: string,
  provider: "barttorvik" | "haslametrics",
  asOfDate: string, // YYYY-MM-DD
  metrics: AdvancedStatsMetrics
): Promise<void> {
  await prisma.advancedStatsTeam.upsert({
    where: {
      teamId_provider_asOfDate: { teamId, provider, asOfDate },
    },
    update: {
      metrics: metrics as object,
    },
    create: {
      teamId,
      provider,
      asOfDate,
      metrics: metrics as object,
    },
  });
}

/**
 * Returns the most recent advanced stats snapshot for a team from a given provider.
 * Returns null if no data exists.
 */
export async function getAdvancedStatsForTeam(
  teamId: string,
  provider: string
): Promise<{ metrics: unknown; asOfDate: string } | null> {
  const row = await prisma.advancedStatsTeam.findFirst({
    where: { teamId, provider },
    orderBy: { asOfDate: "desc" },
  });

  if (!row) return null;
  return { metrics: row.metrics, asOfDate: row.asOfDate };
}
