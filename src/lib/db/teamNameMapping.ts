import { prisma } from "./prisma";

/** Returns all unconfirmed team name mappings, lowest confidence first. */
export async function getUnconfirmedMappings(provider?: string) {
  return prisma.teamNameMapping.findMany({
    where: {
      confirmedAt: null,
      ...(provider ? { provider } : {}),
    },
    include: {
      team: { select: { canonicalName: true, espnId: true } },
    },
    orderBy: { confidence: "asc" }, // lowest confidence = most needs review
  });
}

/** Confirms a team name mapping as correct. */
export async function confirmMapping(id: string): Promise<void> {
  await prisma.teamNameMapping.update({
    where: { id },
    data: { confirmedAt: new Date() },
  });
}

/**
 * Overrides a mapping to point to a different canonical team.
 * Marks it as confirmed so it won't be re-run through fuzzy matching.
 */
export async function overrideMapping(
  id: string,
  newTeamId: string
): Promise<void> {
  await prisma.teamNameMapping.update({
    where: { id },
    data: { teamId: newTeamId, confirmedAt: new Date(), confidence: 1.0 },
  });
}

/** Returns unmatched external names logged during ingest (no mapping entry). */
export async function getUnmatchedCount(provider?: string): Promise<number> {
  return prisma.teamNameMapping.count({
    where: {
      confirmedAt: null,
      confidence: { lt: 0.8 },
      ...(provider ? { provider } : {}),
    },
  });
}
