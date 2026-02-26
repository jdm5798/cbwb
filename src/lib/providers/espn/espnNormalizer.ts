import {
  CanonicalGame,
  CanonicalLiveState,
  CanonicalTeam,
  GameStatus,
} from "@/types/game";

// ────────────────────────────────────────────────────────────────
// ESPN JSON shape (undocumented — use optional chaining everywhere)
// ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = any;

// ────────────────────────────────────────────────────────────────
// Public exports
// ────────────────────────────────────────────────────────────────

/**
 * Normalizes ESPN scoreboard response into canonical game objects.
 */
export function normalizeScoreboard(raw: unknown, requestedDate?: string): CanonicalGame[] {
  const data = raw as { events?: AnyObj[] };
  if (!data?.events || !Array.isArray(data.events)) return [];

  // Use the requested date (the US calendar date we queried ESPN for) as the
  // canonical game date for all events. This avoids a timezone bug where evening
  // games in US time have a UTC timestamp on the following calendar day.
  const fallbackDate = requestedDate ?? new Date().toISOString().substring(0, 10);

  return data.events
    .map((event: AnyObj) => safeNormalizeEvent(event, fallbackDate))
    .filter((g): g is CanonicalGame => g !== null);
}

/**
 * Normalizes ESPN game summary response into a live state object.
 */
export function normalizeSummaryToLiveState(
  raw: unknown
): CanonicalLiveState | null {
  const data = raw as { header?: AnyObj };
  const comp = data?.header?.competitions?.[0];
  if (!comp) return null;
  return normalizeLiveState(comp);
}

// ────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────

function safeNormalizeEvent(
  event: AnyObj,
  fallbackDate: string
): CanonicalGame | null {
  try {
    const comp = event?.competitions?.[0];
    if (!comp) return null;

    const home: AnyObj = comp.competitors?.find(
      (c: AnyObj) => c.homeAway === "home"
    );
    const away: AnyObj = comp.competitors?.find(
      (c: AnyObj) => c.homeAway === "away"
    );
    if (!home || !away) return null;

    const rawDate: string = event.date ?? "";
    const gameDate = fallbackDate;

    const statusState: string = comp.status?.type?.state ?? "pre";
    const statusName: string = comp.status?.type?.name ?? "";

    const status = mapEspnStatus(statusState, statusName);
    const isLive = statusState === "in" || statusName === "Halftime";
    const liveState = isLive ? normalizeLiveState(comp) : null;

    // Extract spread / over-under from odds if available
    const oddsEntry: AnyObj = comp.odds?.[0];
    const spread: number | null = oddsEntry?.spread ?? null;
    const overUnder: number | null = oddsEntry?.overUnder ?? null;

    return {
      externalId: String(event.id ?? ""),
      provider: "espn",
      gameDate,
      scheduledAt: new Date(rawDate || Date.now()),
      homeTeam: normalizeTeam(home),
      awayTeam: normalizeTeam(away),
      tvNetwork: extractTvNetwork(comp),
      status,
      liveState,
      spread,
      overUnder,
    };
  } catch {
    return null;
  }
}

function normalizeTeam(competitor: AnyObj): CanonicalTeam {
  const team: AnyObj = competitor?.team ?? {};

  // Rankings may appear in different places in ESPN JSON
  const rawRanking: number | null =
    competitor?.curatedRank?.current ?? team?.rank ?? null;
  const ranking = rawRanking && rawRanking <= 25 ? rawRanking : null;

  // W-L record from ESPN competitor.records array (type "total" entry)
  const records: AnyObj[] = competitor?.records ?? [];
  const totalRecord = records.find(
    (r: AnyObj) => r.type === "total" || r.abbreviation === "Total"
  ) ?? records[0];
  let record: { wins: number; losses: number } | null = null;
  if (totalRecord?.summary && typeof totalRecord.summary === "string") {
    const parts = totalRecord.summary.split("-");
    const wins = parseInt(parts[0], 10);
    const losses = parseInt(parts[1], 10);
    if (!isNaN(wins) && !isNaN(losses)) record = { wins, losses };
  }

  return {
    externalId: String(team?.id ?? ""),
    name: team?.displayName ?? team?.name ?? "Unknown",
    shortName: team?.shortDisplayName ?? undefined,
    abbreviation: team?.abbreviation ?? undefined,
    logoUrl: team?.logo ?? undefined,
    ranking,
    conference: team?.conferenceId ?? undefined,
    record,
  };
}

function normalizeLiveState(comp: AnyObj): CanonicalLiveState {
  const home: AnyObj = comp.competitors?.find(
    (c: AnyObj) => c.homeAway === "home"
  );
  const away: AnyObj = comp.competitors?.find(
    (c: AnyObj) => c.homeAway === "away"
  );
  const situation: AnyObj = comp.situation;

  // Win probability from situation (ESPN returns 0–100, we store 0–1)
  const rawWinProb: number | null =
    situation?.lastPlay?.probability?.homeWinPercentage ??
    situation?.probability?.homeWinPercentage ??
    null;
  const winProbHome = rawWinProb !== null ? rawWinProb / 100 : null;

  const possessionRaw: string | null = situation?.possession?.homeAway ?? null;
  const possession =
    possessionRaw === "home" || possessionRaw === "away"
      ? possessionRaw
      : null;

  return {
    homeScore: parseInt(home?.score ?? "0", 10),
    awayScore: parseInt(away?.score ?? "0", 10),
    period: comp.status?.period ?? 1,
    clockDisplay: comp.status?.displayClock ?? null,
    leadChanges: situation?.leadChanges ?? 0,
    winProbHome,
    possession,
  };
}

function extractTvNetwork(comp: AnyObj): string | null {
  // Try broadcasts array first
  const broadcasts: AnyObj[] = comp.broadcasts ?? [];
  if (broadcasts.length > 0) {
    const first = broadcasts[0];
    if (typeof first === "string") return first;
    return first?.names?.[0] ?? first?.market?.shortName ?? null;
  }
  // Fallback: geoBroadcasts
  const geoB: AnyObj[] = comp.geoBroadcasts ?? [];
  if (geoB.length > 0) {
    return geoB[0]?.media?.shortName ?? geoB[0]?.media?.name ?? null;
  }
  return null;
}

function mapEspnStatus(state: string, name: string): GameStatus {
  if (state === "post") return "FINAL";
  if (state === "in") {
    if (name === "Halftime") return "HALFTIME";
    return "IN_PROGRESS";
  }
  if (name === "Postponed") return "POSTPONED";
  if (name === "Cancelled" || name === "Canceled") return "CANCELLED";
  return "SCHEDULED";
}
