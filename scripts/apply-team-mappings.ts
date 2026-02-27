/**
 * apply-team-mappings.ts
 *
 * Reads the edited team-mappings.csv and applies corrections to the database.
 *
 * Usage:
 *   npx tsx scripts/apply-team-mappings.ts
 *
 * Rules per row (based on the "correctTeamName" column):
 *   blank  → confirmMapping(id)   — accept current auto-match
 *   name   → overrideMapping(id, newTeamId) — switch to the specified team
 *   SKIP   → delete the row       — suppress this team forever (low-major noise)
 *
 * After running this, go to Admin → ↻ Ingest Advanced Stats to re-upsert
 * advanced stats using the corrected mappings.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    // Simple CSV parse (handles quoted fields)
    const cols: string[] = [];
    let inQuote = false;
    let current = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current);
    return Object.fromEntries(headers.map((h, i) => [h, (cols[i] ?? "").trim()]));
  });
}

async function main() {
  const csvPath = join(process.cwd(), "team-mappings.csv");
  if (!existsSync(csvPath)) {
    console.error("team-mappings.csv not found. Run export-team-mappings.ts first.");
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  console.log(`\nProcessing ${rows.length} rows from team-mappings.csv…\n`);

  // Pre-load team name → id map for override lookups
  const allTeams = await prisma.team.findMany({ select: { id: true, canonicalName: true } });
  const teamByName = new Map(allTeams.map((t) => [t.canonicalName.toLowerCase(), t.id]));

  let confirmed = 0;
  let overridden = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const { id, externalName, provider, correctTeamName } = row;
    const correction = correctTeamName?.trim() ?? "";

    try {
      if (correction.toUpperCase() === "SKIP") {
        // Delete the mapping — this team won't appear in future exports
        await prisma.teamNameMapping.delete({ where: { id } });
        console.log(`  SKIP     ${provider} · "${externalName}"`);
        skipped++;
      } else if (correction === "") {
        // Accept current auto-match
        await prisma.teamNameMapping.update({
          where: { id },
          data: { confirmedAt: new Date() },
        });
        console.log(`  CONFIRM  ${provider} · "${externalName}"`);
        confirmed++;
      } else {
        // Override to the specified canonical team
        const newTeamId = teamByName.get(correction.toLowerCase());
        if (!newTeamId) {
          console.error(`  ERROR    ${provider} · "${externalName}" — team not found: "${correction}"`);
          errors++;
          continue;
        }
        await prisma.teamNameMapping.update({
          where: { id },
          data: { teamId: newTeamId, confidence: 1.0, confirmedAt: new Date() },
        });
        console.log(`  OVERRIDE ${provider} · "${externalName}" → "${correction}"`);
        overridden++;
      }
    } catch (e) {
      console.error(`  ERROR    ${provider} · "${externalName}": ${String(e)}`);
      errors++;
    }
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`  Confirmed : ${confirmed}`);
  console.log(`  Overridden: ${overridden}`);
  console.log(`  Skipped   : ${skipped}`);
  console.log(`  Errors    : ${errors}`);
  console.log(`─────────────────────────────────`);

  if (errors > 0) {
    console.log(`\n⚠  ${errors} rows had errors. Check team names match canonical-teams.csv exactly.`);
  } else {
    console.log(`\n✓ Done. Now go to Admin → ↻ Ingest Advanced Stats to re-upsert with corrected mappings.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
