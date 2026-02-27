/**
 * export-team-mappings.ts
 *
 * Exports all unconfirmed TeamNameMapping records to a CSV for manual review.
 * After editing, run apply-team-mappings.ts to apply corrections.
 *
 * Usage:
 *   npx tsx scripts/export-team-mappings.ts
 *
 * Outputs:
 *   team-mappings.csv       — edit this file to fix mappings
 *   canonical-teams.csv     — reference list of all canonical team names
 *
 * In team-mappings.csv, fill in the "correctTeamName" column:
 *   - Leave blank  → accept the current auto-match as correct
 *   - Team name    → override to that canonical team (must match canonical-teams.csv exactly)
 *   - SKIP         → ignore this team (low-major, not in our games)
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(...cols: string[]): string {
  return cols.map(escapeCsv).join(",");
}

async function main() {
  // 1. Fetch all unconfirmed mappings (both sub-0.8 and 0.8–0.94 auto-matches)
  const mappings = await prisma.teamNameMapping.findMany({
    where: { confirmedAt: null },
    include: { team: { select: { canonicalName: true } } },
    orderBy: [{ provider: "asc" }, { confidence: "asc" }],
  });

  // 2. Fetch all canonical teams for reference
  const teams = await prisma.team.findMany({
    orderBy: { canonicalName: "asc" },
    select: { canonicalName: true, conference: true, espnId: true },
  });

  // 3. Write team-mappings.csv
  const mappingLines = [
    row("id", "provider", "externalName", "confidence", "currentMatchedTeam", "correctTeamName"),
  ];
  for (const m of mappings) {
    mappingLines.push(
      row(
        m.id,
        m.provider,
        m.externalName,
        m.confidence.toFixed(3),
        m.team.canonicalName,
        "", // user fills this in
      )
    );
  }
  const mappingPath = join(process.cwd(), "team-mappings.csv");
  writeFileSync(mappingPath, mappingLines.join("\n"), "utf8");

  // 4. Write canonical-teams.csv
  const teamLines = [row("canonicalName", "conference", "espnId")];
  for (const t of teams) {
    teamLines.push(row(t.canonicalName, t.conference ?? "", t.espnId ?? ""));
  }
  const teamsPath = join(process.cwd(), "canonical-teams.csv");
  writeFileSync(teamsPath, teamLines.join("\n"), "utf8");

  console.log(`\n✓ Exported ${mappings.length} unconfirmed mappings → team-mappings.csv`);
  console.log(`✓ Exported ${teams.length} canonical teams → canonical-teams.csv`);
  console.log(`\nBreakdown by provider:`);

  const byProvider = mappings.reduce<Record<string, { low: number; mid: number }>>((acc, m) => {
    acc[m.provider] ??= { low: 0, mid: 0 };
    if (m.confidence < 0.8) acc[m.provider].low++;
    else acc[m.provider].mid++;
    return acc;
  }, {});
  for (const [provider, counts] of Object.entries(byProvider)) {
    console.log(
      `  ${provider}: ${counts.low} unmatched (<0.80) + ${counts.mid} low-confidence (0.80–0.94)`
    );
  }

  console.log(`\nNext steps:`);
  console.log(`  1. Open team-mappings.csv in Excel / Google Sheets`);
  console.log(`  2. Reference canonical-teams.csv for exact team names`);
  console.log(`  3. Fill in "correctTeamName" column:`);
  console.log(`       blank  → accept current match`);
  console.log(`       name   → override to that team`);
  console.log(`       SKIP   → ignore (low-major, won't appear in games)`);
  console.log(`  4. Run: npx tsx scripts/apply-team-mappings.ts`);
  console.log(`  5. Admin page → ↻ Ingest Advanced Stats (re-upserts with corrected mappings)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
