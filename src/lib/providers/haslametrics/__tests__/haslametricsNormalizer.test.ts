import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { normalizeHaslametrics } from "../haslametricsNormalizer";

// Load the real XML fixture captured from haslametrics.com/ratings.xml
const fixtureXml = readFileSync(
  join(__dirname, "fixtures/haslametrics_ratings.xml"),
  "utf-8"
);

describe("normalizeHaslametrics", () => {
  it("returns an empty array for an empty XML string", () => {
    expect(normalizeHaslametrics("")).toEqual([]);
  });

  it("returns an empty array for XML with no <mr> elements", () => {
    const empty = `<?xml version="1.0"?><mydata></mydata>`;
    expect(normalizeHaslametrics(empty)).toEqual([]);
  });

  it("parses the fixture and returns the correct number of entries", () => {
    const result = normalizeHaslametrics(fixtureXml);
    expect(result).toHaveLength(8);
  });

  it("parses team name from the t attribute", () => {
    const result = normalizeHaslametrics(fixtureXml);
    // Fixture is top-8 by rank; rank-1 team in fixture should be Michigan
    const michigan = result.find((t) => t.teamName === "Michigan");
    expect(michigan).toBeDefined();
  });

  it("computes tid from id attribute using formula (id * 2) + 23", () => {
    // Michigan has id=130 in the fixture → tid = (130 * 2) + 23 = 283
    const result = normalizeHaslametrics(fixtureXml);
    const michigan = result.find((t) => t.teamName === "Michigan");
    expect(michigan?.tid).toBe(283);
  });

  it("parses haslRank as an integer", () => {
    const result = normalizeHaslametrics(fixtureXml);
    const michigan = result.find((t) => t.teamName === "Michigan");
    expect(michigan?.haslRank).toBe(1);
    expect(Number.isInteger(michigan?.haslRank)).toBe(true);
  });

  it("parses apPct scaled to 0–100 (from 0–1 XML attribute)", () => {
    const result = normalizeHaslametrics(fixtureXml);
    const michigan = result.find((t) => t.teamName === "Michigan");
    // Michigan ap=1.000000 → apPct should be 100.0
    expect(michigan?.apPct).toBeCloseTo(100.0, 1);
  });

  it("parses adjO in a plausible range for top teams", () => {
    const result = normalizeHaslametrics(fixtureXml);
    for (const team of result) {
      // College basketball OE is typically 95–135
      expect(team.adjO).toBeGreaterThan(90);
      expect(team.adjO).toBeLessThan(145);
    }
  });

  it("parses adjD in a plausible range for top teams", () => {
    const result = normalizeHaslametrics(fixtureXml);
    for (const team of result) {
      // College basketball DE is typically 85–115 (lower = better defense)
      expect(team.adjD).toBeGreaterThan(80);
      expect(team.adjD).toBeLessThan(120);
    }
  });

  it("parses pace (ou attribute) in a plausible range", () => {
    const result = normalizeHaslametrics(fixtureXml);
    for (const team of result) {
      // Pace is typically 60–80 possessions per game
      expect(team.pace).toBeGreaterThan(55);
      expect(team.pace).toBeLessThan(90);
    }
  });

  it("parses momentum (mom attribute) as a number", () => {
    const result = normalizeHaslametrics(fixtureXml);
    for (const team of result) {
      expect(typeof team.momentum).toBe("number");
    }
  });

  it("parses wins and losses as non-negative integers", () => {
    const result = normalizeHaslametrics(fixtureXml);
    for (const team of result) {
      expect(team.wins).toBeGreaterThanOrEqual(0);
      expect(team.losses).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(team.wins)).toBe(true);
      expect(Number.isInteger(team.losses)).toBe(true);
    }
  });

  it("all entries have non-empty teamName", () => {
    const result = normalizeHaslametrics(fixtureXml);
    for (const team of result) {
      expect(team.teamName.length).toBeGreaterThan(0);
    }
  });

  it("skips <mr> elements missing the required t (name) attribute", () => {
    const broken = `<?xml version="1.0"?><mydata><mr rk="1" id="130" oe="131.0" de="90.0" ou="69.0" mom="0.5" mmo="0.3" mmd="0.2" ptf="0.1" ap="0.95" w="22" l="5"/></mydata>`;
    // Missing t attribute — should be skipped
    const result = normalizeHaslametrics(broken);
    expect(result).toHaveLength(0);
  });

  it("skips <mr> elements missing the required id attribute", () => {
    const broken = `<?xml version="1.0"?><mydata><mr rk="1" t="Houston" oe="131.0" de="90.0" ou="69.0" mom="0.5" mmo="0.3" mmd="0.2" ptf="0.1" ap="0.95" w="22" l="5"/></mydata>`;
    const result = normalizeHaslametrics(broken);
    expect(result).toHaveLength(0);
  });
});
