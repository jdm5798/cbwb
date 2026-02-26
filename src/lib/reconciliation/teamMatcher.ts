import { prisma } from "@/lib/db/prisma";

// ────────────────────────────────────────────────────────────────
// Abbreviation expansions
// Add new entries here when unmatched teams are found in logs.
// ────────────────────────────────────────────────────────────────
const KNOWN_ALIASES: Record<string, string> = {
  unc: "north carolina",
  usc: "southern california",
  uva: "virginia",
  uk: "kentucky",
  vt: "virginia tech",
  psu: "penn state",
  uconn: "connecticut",
  lsu: "louisiana state",
  smu: "southern methodist",
  tcu: "texas christian",
  utep: "texas el paso",
  unlv: "nevada las vegas",
  ucf: "central florida",
  uab: "alabama birmingham",
  unt: "north texas",
  utsa: "texas san antonio",
  fiu: "florida international",
  fau: "florida atlantic",
  wku: "western kentucky",
  odu: "old dominion",
  vcu: "virginia commonwealth",
  "miami fl": "miami",
  "miami oh": "miami ohio",
};

// ────────────────────────────────────────────────────────────────
// Public pure functions (testable without DB)
// ────────────────────────────────────────────────────────────────

/**
 * Normalizes a team name for fuzzy comparison:
 * 1. Check known abbreviation table first (UNC → "north carolina")
 * 2. Lowercase + trim
 * 3. Strip punctuation (keeps spaces)
 * 4. Collapse multiple spaces
 */
export function normalizeTeamName(name: string): string {
  if (!name) return "";

  const lower = name.toLowerCase().trim();

  // Check abbreviated form
  if (KNOWN_ALIASES[lower]) return KNOWN_ALIASES[lower];

  // Strip punctuation except spaces, collapse whitespace
  let normalized = lower
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Expand trailing standalone "st" → "state"
  // e.g. "iowa st" → "iowa state", "michigan st" → "michigan state"
  // Does NOT affect "st johns" (not at end)
  normalized = normalized.replace(/ st$/, " state");

  return normalized;
}

/**
 * Computes Levenshtein distance between two strings.
 * Pure function, O(m*n) dynamic programming.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Use two rows to save memory
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  const curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev = curr.slice();
  }

  return prev[n];
}

/**
 * Returns a similarity score 0–1 between two team name strings.
 * 1.0 = identical after normalization. Higher = more similar.
 *
 * Prefix boost: if the shorter name (≥2 words) is a word-boundary prefix of the
 * longer, return 0.85–0.95 instead of a low Levenshtein score. This handles
 * ESPN-ingested team names that include mascots:
 *   "Texas Tech" vs "Texas Tech Red Raiders" → ~0.90
 *   "Iowa State" vs "Iowa State Cyclones"    → ~0.91
 * The 2-word guard prevents single-word prefix false positives
 * (e.g., "Iowa" must NOT get a high score against "Iowa State").
 */
export function matchScore(a: string, b: string): number {
  const na = normalizeTeamName(a);
  const nb = normalizeTeamName(b);

  if (na === nb) return 1.0;
  if (!na || !nb) return 0.0;

  // Prefix boost — only when shorter name has ≥2 words (avoids "Iowa" → "Iowa State")
  const [shorter, longer] = na.length <= nb.length ? [na, nb] : [nb, na];
  const shorterWords = shorter.split(" ").length;
  if (shorterWords >= 2 && longer.startsWith(shorter + " ")) {
    // 0.85 base + up to 0.10 bonus based on coverage ratio
    return 0.85 + 0.1 * (shorter.length / longer.length);
  }

  const maxLen = Math.max(na.length, nb.length);
  const dist = levenshtein(na, nb);
  return 1 - dist / maxLen;
}

// ────────────────────────────────────────────────────────────────
// DB-aware matching
// ────────────────────────────────────────────────────────────────

const MATCH_THRESHOLD = 0.8; // below this → "unmatched", logged for admin
const AUTO_CONFIRM_THRESHOLD = 0.95; // at or above this → auto-confirmed

interface TeamCandidate {
  id: string;
  canonicalName: string;
  aliases: string[];
}

interface MatchResult {
  teamId: string;
  confidence: number;
}

/**
 * Finds the best canonical Team match for an external team name.
 *
 * Steps:
 * 1. Check existing TeamNameMapping (short-circuits fuzzy logic)
 * 2. Fuzzy match against canonicalName + aliases of all DB teams
 * 3. Persist the mapping if score >= MATCH_THRESHOLD
 *    (auto-confirmed if score >= AUTO_CONFIRM_THRESHOLD)
 * 4. Return null if no match above threshold (caller should log/skip)
 */
export async function findBestMatch(
  externalName: string,
  provider: string,
  candidates: TeamCandidate[]
): Promise<MatchResult | null> {
  // 1. Check for existing persisted mapping (confirmed or auto)
  const existing = await prisma.teamNameMapping.findUnique({
    where: {
      externalName_provider: { externalName, provider },
    },
  });
  if (existing) {
    return { teamId: existing.teamId, confidence: existing.confidence };
  }

  // 2. Fuzzy match against all candidates
  let best: MatchResult | null = null;

  for (const team of candidates) {
    const names = [team.canonicalName, ...team.aliases];
    for (const name of names) {
      const score = matchScore(externalName, name);
      if (!best || score > best.confidence) {
        best = { teamId: team.id, confidence: score };
      }
    }
  }

  if (!best || best.confidence < MATCH_THRESHOLD) {
    console.warn(
      `[teamMatcher] No match (score<${MATCH_THRESHOLD}) for "${externalName}" (${provider})`
    );
    return null;
  }

  // 3. Persist mapping
  const confirmedAt =
    best.confidence >= AUTO_CONFIRM_THRESHOLD ? new Date() : null;

  await prisma.teamNameMapping.upsert({
    where: { externalName_provider: { externalName, provider } },
    update: { teamId: best.teamId, confidence: best.confidence },
    create: {
      externalName,
      provider,
      teamId: best.teamId,
      confidence: best.confidence,
      confirmedAt,
    },
  });

  return best;
}
