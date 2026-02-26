import { BartTorvikRawArraySchema, BartTorvikTeamStats } from "@/types/advancedStats";

// ────────────────────────────────────────────────────────────────
// Column index constants — verified against 2026_team_results.json
// Update here if BartTorvik changes the array structure.
// ────────────────────────────────────────────────────────────────
const COL_TRANK = 0;
const COL_TEAM_NAME = 1;
const COL_RECORD = 3; // "W-L" string
const COL_ADJ_O = 4; // adjusted offensive efficiency
const COL_ADJ_D = 6; // adjusted defensive efficiency
const COL_BARTHAG = 8; // pythagorean win expectancy 0–1
const COL_WAB = 41; // wins above bubble
const COL_ADJ_T = 44; // adjusted tempo (possessions/40 min)

/** Safely extract a number from a positional array. Returns NaN on failure. */
function getNum(arr: unknown[], idx: number): number {
  const v = arr[idx];
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v);
  return NaN;
}

/** Safely extract a string from a positional array. Returns "" on failure. */
function getStr(arr: unknown[], idx: number): string {
  const v = arr[idx];
  return typeof v === "string" ? v : "";
}

/**
 * Parse a "W-L" record string into wins and losses.
 * Returns { wins: 0, losses: 0 } on parse failure.
 */
function parseRecord(record: string): { wins: number; losses: number } {
  const parts = record.split("-");
  if (parts.length !== 2) return { wins: 0, losses: 0 };
  const wins = parseInt(parts[0], 10);
  const losses = parseInt(parts[1], 10);
  if (isNaN(wins) || isNaN(losses)) return { wins: 0, losses: 0 };
  return { wins, losses };
}

/**
 * Normalizes the raw BartTorvik JSON response into typed team stats.
 *
 * BartTorvik's team_results.json is an array of positional arrays.
 * Entries that fail schema validation (too few columns, wrong types) are skipped
 * rather than failing the entire batch.
 */
export function normalizeBartTorvik(raw: unknown): BartTorvikTeamStats[] {
  if (!Array.isArray(raw)) return [];

  const results: BartTorvikTeamStats[] = [];

  for (const entry of raw) {
    // Validate: must be an array with at least 45 columns
    const parsed = BartTorvikRawArraySchema.safeParse(entry);
    if (!parsed.success) continue;

    const arr = parsed.data;

    // Team name must be a non-empty string
    const teamName = getStr(arr, COL_TEAM_NAME);
    if (!teamName) continue;

    const trank = getNum(arr, COL_TRANK);
    const adjO = getNum(arr, COL_ADJ_O);
    const adjD = getNum(arr, COL_ADJ_D);
    const barthag = getNum(arr, COL_BARTHAG);
    const wab = getNum(arr, COL_WAB);
    const adjT = getNum(arr, COL_ADJ_T);
    const { wins, losses } = parseRecord(getStr(arr, COL_RECORD));

    results.push({
      teamName,
      trank: isNaN(trank) ? 0 : trank,
      barthag: isNaN(barthag) ? 0 : barthag,
      adjO: isNaN(adjO) ? 0 : adjO,
      adjD: isNaN(adjD) ? 0 : adjD,
      adjT: isNaN(adjT) ? 0 : adjT,
      wins,
      losses,
      wab: isNaN(wab) ? 0 : wab,
    });
  }

  return results;
}
