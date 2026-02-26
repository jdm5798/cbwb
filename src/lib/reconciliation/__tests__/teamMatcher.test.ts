import { describe, it, expect } from "vitest";
import { normalizeTeamName, matchScore } from "../teamMatcher";

// Note: findBestMatch is DB-dependent — not tested here (covered by integration tests).
// These tests cover the pure functions only.

describe("normalizeTeamName", () => {
  it("lowercases the input", () => {
    expect(normalizeTeamName("MICHIGAN")).toBe("michigan");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeTeamName("  Duke  ")).toBe("duke");
  });

  it("strips punctuation except spaces", () => {
    expect(normalizeTeamName("St. John's")).toContain("john");
    expect(normalizeTeamName("St. John's")).not.toContain("'");
    expect(normalizeTeamName("St. John's")).not.toContain(".");
  });

  it("collapses multiple spaces into one", () => {
    const result = normalizeTeamName("North  Carolina");
    expect(result).toBe("north carolina");
  });

  it("expands known abbreviation 'unc' to 'north carolina'", () => {
    expect(normalizeTeamName("UNC")).toBe("north carolina");
  });

  it("expands known abbreviation 'uconn' to 'connecticut'", () => {
    expect(normalizeTeamName("UConn")).toBe("connecticut");
  });

  it("expands known abbreviation 'vt' to 'virginia tech'", () => {
    expect(normalizeTeamName("VT")).toBe("virginia tech");
  });

  it("returns an empty string for an empty input", () => {
    expect(normalizeTeamName("")).toBe("");
  });
});

describe("matchScore", () => {
  it("returns 1.0 for identical strings", () => {
    expect(matchScore("Duke", "Duke")).toBe(1.0);
  });

  it("returns 1.0 for identical strings after normalization", () => {
    expect(matchScore("DUKE", "duke")).toBe(1.0);
  });

  it("returns >= 0.85 for very close variants: 'Michigan St.' vs 'Michigan State'", () => {
    expect(matchScore("Michigan St.", "Michigan State")).toBeGreaterThanOrEqual(0.85);
  });

  it("returns >= 0.85 for abbreviation match: 'UNC' vs 'North Carolina'", () => {
    expect(matchScore("UNC", "North Carolina")).toBeGreaterThanOrEqual(0.85);
  });

  it("returns >= 0.85 for 'UConn' vs 'Connecticut'", () => {
    expect(matchScore("UConn", "Connecticut")).toBeGreaterThanOrEqual(0.85);
  });

  it("returns < 0.5 for completely different teams", () => {
    expect(matchScore("Duke", "Kansas State")).toBeLessThan(0.5);
  });

  it("returns < 0.5 for unrelated short strings", () => {
    expect(matchScore("UCLA", "Iowa")).toBeLessThan(0.5);
  });

  it("is symmetric: matchScore(a,b) === matchScore(b,a)", () => {
    const a = matchScore("North Carolina", "UNC");
    const b = matchScore("UNC", "North Carolina");
    expect(a).toBeCloseTo(b, 5);
  });

  it("handles whitespace variants: 'Iowa St.' vs 'Iowa State'", () => {
    expect(matchScore("Iowa St.", "Iowa State")).toBeGreaterThanOrEqual(0.8);
  });
});
