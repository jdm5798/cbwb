const BASE =
  process.env.ESPN_API_BASE_URL ||
  "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";

/**
 * Fetch the NCAAB scoreboard for a given date.
 * @param date - YYYYMMDD format
 */
export async function fetchEspnScoreboard(date: string): Promise<unknown> {
  const allEvents: unknown[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const url = `${BASE}/scoreboard?dates=${date}&groups=50&limit=100&page=${page}`;
    const res = await fetch(url, {
      next: { revalidate: 0 },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WatchBuddy/1.0)" },
    });
    if (!res.ok) {
      throw new Error(`ESPN scoreboard request failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json() as { events?: unknown[]; pageCount?: number };
    if (data.events) allEvents.push(...data.events);
    pageCount = data.pageCount ?? 1;
    page++;
  } while (page <= pageCount);

  return { events: allEvents };
}

/**
 * Fetch detailed game summary (win probability, play-by-play) for a single ESPN game.
 * @param espnGameId - ESPN event ID
 */
export async function fetchEspnGameSummary(espnGameId: string): Promise<unknown> {
  // The summary endpoint is at a different path
  const summaryBase = BASE.replace(
    "site.api.espn.com/apis/site/v2",
    "site.api.espn.com/apis/site/v2"
  );
  const url = `${summaryBase}/summary?event=${espnGameId}`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    headers: { "User-Agent": "Mozilla/5.0 (compatible; WatchBuddy/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`ESPN game summary failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
