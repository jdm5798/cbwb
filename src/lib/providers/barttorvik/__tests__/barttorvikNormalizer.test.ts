import { describe, it, expect } from "vitest";
import { normalizeBartTorvik } from "../barttorvikNormalizer";

// Load the real fixture captured from barttorvik.com/2026_team_results.json
import sampleData from "./fixtures/barttorvik_sample.json";

describe("normalizeBartTorvik", () => {
  it("returns an empty array for an empty input", () => {
    expect(normalizeBartTorvik([])).toEqual([]);
  });

  it("returns an empty array for non-array input", () => {
    expect(normalizeBartTorvik(null)).toEqual([]);
    expect(normalizeBartTorvik({})).toEqual([]);
    expect(normalizeBartTorvik("invalid")).toEqual([]);
  });

  it("parses the fixture and returns the correct number of entries", () => {
    const result = normalizeBartTorvik(sampleData);
    expect(result).toHaveLength(8);
  });

  it("maps positional columns to named fields correctly", () => {
    const result = normalizeBartTorvik(sampleData);
    const first = result[0];

    // [0] → trank
    expect(first.trank).toBe(1);
    // [1] → teamName
    expect(first.teamName).toBe("Michigan");
    // [4] → adjO (offensive efficiency ~120-135 for top teams)
    expect(first.adjO).toBeGreaterThan(115);
    expect(first.adjO).toBeLessThan(145);
    // [6] → adjD (defensive efficiency ~88-98 for top teams, lower is better)
    expect(first.adjD).toBeGreaterThan(85);
    expect(first.adjD).toBeLessThan(105);
    // [8] → barthag (pythagorean win expectancy 0–1)
    expect(first.barthag).toBeGreaterThan(0.9);
    expect(first.barthag).toBeLessThan(1.0);
  });

  it("parses wins and losses from the record string [3]", () => {
    const result = normalizeBartTorvik(sampleData);
    const first = result[0]; // Michigan "26-2"
    expect(first.wins).toBe(26);
    expect(first.losses).toBe(2);
  });

  it("returns wab from column [41]", () => {
    const result = normalizeBartTorvik(sampleData);
    const first = result[0];
    // Michigan's WAB should be a positive number (top team, well above bubble)
    expect(first.wab).toBeGreaterThan(0);
  });

  it("returns adjT (tempo) from column [44] in valid range", () => {
    const result = normalizeBartTorvik(sampleData);
    const first = result[0];
    // College basketball tempo: 60–80 possessions per 40 minutes
    expect(first.adjT).toBeGreaterThan(60);
    expect(first.adjT).toBeLessThan(85);
  });

  it("skips entries that are too short (< 45 columns)", () => {
    const short = [[1, "Short Team", "ACC", "10-5"]]; // only 4 columns
    const result = normalizeBartTorvik(short);
    expect(result).toHaveLength(0);
  });

  it("skips entries with a non-string team name", () => {
    const bad = [[...sampleData[0]]];
    bad[0][1] = null; // corrupt team name
    const result = normalizeBartTorvik(bad);
    expect(result).toHaveLength(0);
  });

  it("skips entries where record string cannot be parsed", () => {
    const badRecord = [sampleData[0].slice()];
    badRecord[0] = [...sampleData[0]];
    badRecord[0][3] = "invalid-record";
    const result = normalizeBartTorvik(badRecord);
    // A non-parseable record should still produce a result with wins/losses = 0
    // (graceful degradation, not hard failure)
    expect(result).toHaveLength(1);
    expect(result[0].wins).toBe(0);
    expect(result[0].losses).toBe(0);
  });

  it("all returned entries have required numeric fields", () => {
    const result = normalizeBartTorvik(sampleData);
    for (const entry of result) {
      expect(typeof entry.trank).toBe("number");
      expect(typeof entry.adjO).toBe("number");
      expect(typeof entry.adjD).toBe("number");
      expect(typeof entry.barthag).toBe("number");
      expect(typeof entry.adjT).toBe("number");
      expect(typeof entry.wab).toBe("number");
      expect(typeof entry.wins).toBe("number");
      expect(typeof entry.losses).toBe("number");
      expect(typeof entry.teamName).toBe("string");
      expect(entry.teamName.length).toBeGreaterThan(0);
    }
  });
});
