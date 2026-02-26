import { describe, it, expect } from "vitest";
import { computeProjectedScores, computeThrillScore } from "../projectScore";
import type { BartTorvikTeamStats } from "@/types/advancedStats";

// Representative team fixtures (values from real BartTorvik data)
const MICHIGAN: Pick<BartTorvikTeamStats, "adjO" | "adjD" | "adjT" | "barthag"> = {
  adjO: 128.9,
  adjD: 91.7,
  adjT: 67.2,
  barthag: 0.9804,
};

const DUKE: Pick<BartTorvikTeamStats, "adjO" | "adjD" | "adjT" | "barthag"> = {
  adjO: 127.1,
  adjD: 91.7,
  adjT: 65.2,
  barthag: 0.9771,
};

const WEAK_TEAM: Pick<BartTorvikTeamStats, "adjO" | "adjD" | "adjT" | "barthag"> = {
  adjO: 95.0,
  adjD: 115.0,
  adjT: 62.0,
  barthag: 0.1,
};

describe("computeProjectedScores", () => {
  it("returns integer scores for both teams", () => {
    const { homeScore, awayScore } = computeProjectedScores(MICHIGAN, DUKE);
    expect(Number.isInteger(homeScore)).toBe(true);
    expect(Number.isInteger(awayScore)).toBe(true);
  });

  it("higher-offense team scores more points when defense is equal", () => {
    // Michigan has higher adjO than Duke; equal adjD
    const { homeScore, awayScore } = computeProjectedScores(MICHIGAN, DUKE);
    expect(homeScore).toBeGreaterThan(awayScore);
  });

  it("better defense (lower adjD) reduces opponent's score", () => {
    const goodDefense = { ...MICHIGAN, adjD: 85 };
    const badDefense = { ...MICHIGAN, adjD: 110 };
    const { awayScore: awayVsGood } = computeProjectedScores(goodDefense, DUKE);
    const { awayScore: awayVsBad } = computeProjectedScores(badDefense, DUKE);
    // Duke should score fewer points against the better defense
    expect(awayVsGood).toBeLessThan(awayVsBad);
  });

  it("higher tempo increases both scores proportionally", () => {
    const fastMichigan = { ...MICHIGAN, adjT: 80 };
    const slowMichigan = { ...MICHIGAN, adjT: 55 };
    const { homeScore: homeFast, awayScore: awayFast } = computeProjectedScores(fastMichigan, DUKE);
    const { homeScore: homeSlow, awayScore: awaySlow } = computeProjectedScores(slowMichigan, DUKE);
    expect(homeFast).toBeGreaterThan(homeSlow);
    expect(awayFast).toBeGreaterThan(awaySlow);
  });

  it("is symmetric: swapping home/away swaps the scores", () => {
    const normal = computeProjectedScores(MICHIGAN, DUKE);
    const swapped = computeProjectedScores(DUKE, MICHIGAN);
    expect(normal.homeScore).toBe(swapped.awayScore);
    expect(normal.awayScore).toBe(swapped.homeScore);
  });

  it("produces realistic D1 score range (both teams 50–130 pts)", () => {
    const { homeScore, awayScore } = computeProjectedScores(MICHIGAN, DUKE);
    expect(homeScore).toBeGreaterThan(50);
    expect(homeScore).toBeLessThan(130);
    expect(awayScore).toBeGreaterThan(50);
    expect(awayScore).toBeLessThan(130);
  });
});

describe("computeThrillScore", () => {
  it("returns a high score (~100) for top teams with 0pt margin", () => {
    // Two elite teams, equal predicted score → maximum closeness + high quality
    const score = computeThrillScore(MICHIGAN, DUKE, 78, 78);
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it("returns a lower score for a large margin (20+ pts)", () => {
    const blowout = computeThrillScore(MICHIGAN, DUKE, 90, 65);
    const close = computeThrillScore(MICHIGAN, DUKE, 78, 76);
    expect(blowout).toBeLessThan(close);
  });

  it("returns 0 closeness contribution when margin >= 20", () => {
    // With 20+ pt margin, closeness = 0; only quality contributes
    const score = computeThrillScore(MICHIGAN, DUKE, 90, 65); // 25pt margin
    // Quality = (0.9804 + 0.9771)/2 * 100 = ~97.9 * 0.4 = ~39
    // Closeness = 0
    expect(score).toBeLessThanOrEqual(42); // only quality component
    expect(score).toBeGreaterThan(0);
  });

  it("returns a lower score for weak teams even with 0pt margin", () => {
    const eliteClose = computeThrillScore(MICHIGAN, DUKE, 78, 78);
    const weakClose = computeThrillScore(WEAK_TEAM, WEAK_TEAM, 65, 65);
    expect(eliteClose).toBeGreaterThan(weakClose);
  });

  it("clamps result to 0–100 range", () => {
    const score = computeThrillScore(MICHIGAN, DUKE, 78, 78);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns an integer", () => {
    const score = computeThrillScore(MICHIGAN, DUKE, 78, 75);
    expect(Number.isInteger(score)).toBe(true);
  });
});
