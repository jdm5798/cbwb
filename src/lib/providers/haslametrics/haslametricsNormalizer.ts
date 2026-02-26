import * as cheerio from "cheerio";
import { Element } from "domhandler";
import { HaslametricsTeamStats } from "@/types/advancedStats";

/**
 * Computes the Haslametrics URL tid from the raw XML id attribute.
 * Formula from the ratings.php JavaScript: tid = (id * 2) + 23
 */
function computeTid(rawId: number): number {
  return rawId * 2 + 23;
}

/** Safely parse a float from an XML attribute string. Returns 0 on failure. */
function parseAttrFloat(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

/** Safely parse an integer from an XML attribute string. Returns 0 on failure. */
function parseAttrInt(val: string | undefined): number {
  if (!val) return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Normalizes the Haslametrics ratings.xml content into typed team stats.
 *
 * The XML file contains <mr> self-closing elements with all data as attributes.
 * Key attributes:
 *   rk   — rank
 *   t    — team name
 *   id   — raw numeric ID (tid = id * 2 + 23)
 *   oe   — adjusted offensive efficiency (precomputed)
 *   de   — adjusted defensive efficiency
 *   ou   — pace (possessions per game)
 *   mom  — momentum
 *   mmo  — momentum offense
 *   mmd  — momentum defense
 *   ptf  — Paper Tiger Factor
 *   ap   — AP% (0–1; multiplied by 100 in output)
 *   w/l  — wins and losses
 */
export function normalizeHaslametrics(xml: string): HaslametricsTeamStats[] {
  if (!xml.trim()) return [];

  const $ = cheerio.load(xml, { xmlMode: true });
  const results: HaslametricsTeamStats[] = [];

  $("mr").each((_i, el) => {
    const attrs = (el as Element).attribs as Record<string, string>;

    // Skip entries missing required fields
    const teamName = attrs["t"]?.trim();
    if (!teamName) return;

    const rawId = parseAttrInt(attrs["id"]);
    if (!rawId) return;

    results.push({
      teamName,
      haslRank: parseAttrInt(attrs["rk"]),
      tid: computeTid(rawId),
      // ap is stored as 0–1; multiply by 100 for percentage
      apPct: parseAttrFloat(attrs["ap"]) * 100,
      adjO: parseAttrFloat(attrs["oe"]),
      adjD: parseAttrFloat(attrs["de"]),
      pace: parseAttrFloat(attrs["ou"]),
      momentum: parseAttrFloat(attrs["mom"]),
      momentumO: parseAttrFloat(attrs["mmo"]),
      momentumD: parseAttrFloat(attrs["mmd"]),
      ptf: parseAttrFloat(attrs["ptf"]),
      wins: parseAttrInt(attrs["w"]),
      losses: parseAttrInt(attrs["l"]),
    });
  });

  return results;
}
