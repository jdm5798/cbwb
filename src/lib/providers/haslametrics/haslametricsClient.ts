const HASL_USER_AGENT =
  "Mozilla/5.0 (compatible; CBWB-bot/1.0; +https://cbwb.vercel.app)";

function getCurrentSeasonShort(): string {
  // Haslametrics XML for 2025-26 season lives at ratings.xml (no suffix).
  // Prior seasons use a two-digit suffix (e.g. ratings25.xml for 2024-25).
  // We always want the current season, so no suffix.
  return "";
}

/**
 * Fetches the Haslametrics ratings XML for the current season.
 *
 * The site returns Brotli-compressed XML — Node.js native fetch decompresses
 * this automatically. No Cloudflare protection; no auth required.
 *
 * Returns the raw XML string, ready for haslametricsNormalizer.
 */
export async function fetchHaslametrics(): Promise<string> {
  const suffix = getCurrentSeasonShort();
  const url = `https://haslametrics.com/ratings${suffix}.xml`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": HASL_USER_AGENT,
      Accept: "application/xml, text/xml, */*",
    },
  });

  if (!res.ok) {
    throw new Error(
      `Haslametrics fetch failed: ${res.status} ${res.statusText}`
    );
  }

  const text = await res.text();

  // Sanity check: response should look like XML, not an error page
  if (!text.trim().startsWith("<")) {
    throw new Error(
      `Haslametrics returned unexpected content (not XML). First 100 chars: ${text.substring(0, 100)}`
    );
  }

  return text;
}
