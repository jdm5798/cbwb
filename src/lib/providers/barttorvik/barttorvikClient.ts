const BT_USER_AGENT =
  "Mozilla/5.0 (compatible; CBWB-bot/1.0; +https://cbwb.vercel.app)";

function getCurrentSeason(): number {
  const now = new Date();
  // CBB season year = ending calendar year
  // Nov/Dec of year N → season N+1; Jan–Apr of year N → season N
  const month = now.getMonth(); // 0-indexed
  return month >= 7 ? now.getFullYear() + 1 : now.getFullYear();
}

/**
 * Fetches BartTorvik team results JSON for the given season year.
 * Tries the direct barttorvik.com endpoint first.
 * Falls back to the cbbdata API if Cloudflare blocks the request.
 */
export async function fetchBartTorvik(
  season: number = getCurrentSeason()
): Promise<unknown> {
  const url = `https://barttorvik.com/${season}_team_results.json`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent": BT_USER_AGENT,
        Accept: "application/json, */*",
      },
    });
  } catch (err) {
    // Network error — try fallback
    console.warn(`[barttorvikClient] Direct fetch network error: ${err}. Trying cbbdata fallback.`);
    return fetchCbbdataFallback(season);
  }

  // Cloudflare block detection:
  // - 403 or 429 status = explicitly blocked
  // - 200 but content-type is HTML = challenge page served instead of JSON
  const contentType = res.headers.get("content-type") ?? "";
  const isBlocked =
    res.status === 403 ||
    res.status === 429 ||
    (res.status === 200 && contentType.includes("text/html"));

  if (isBlocked) {
    console.warn(
      `[barttorvikClient] Cloudflare block detected (status=${res.status}, ct=${contentType}). Trying cbbdata fallback.`
    );
    return fetchCbbdataFallback(season);
  }

  if (!res.ok) {
    throw new Error(
      `BartTorvik fetch failed: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

/**
 * Fallback: fetch BartTorvik data via the cbbdata REST API.
 * Requires CBBDATA_API_KEY environment variable.
 */
async function fetchCbbdataFallback(season: number): Promise<unknown> {
  const apiKey = process.env.CBBDATA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "BartTorvik direct endpoint blocked by Cloudflare and CBBDATA_API_KEY is not set. " +
        "Register at https://github.com/andreweatherman/cbbdata to get a free key."
    );
  }

  const url = `https://api.cbbdata.aweatherman.com/team-ratings?year=${season}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": BT_USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`cbbdata fallback failed: ${res.status} ${res.statusText}`);
  }

  // cbbdata wraps results in { data: [...] }
  const json = (await res.json()) as { data?: unknown[] };
  return Array.isArray(json.data) ? json.data : json;
}
