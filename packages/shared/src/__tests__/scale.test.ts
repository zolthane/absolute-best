import { describe, expect, it } from "vitest";
import { logScale, sqrtScale } from "../scale";

describe("logScale", () => {
  it("maps 1, 10, 100 and 1000 voters to evenly spaced heights", () => {
    const positions = [1, 10, 100, 1000].map((voters) => logScale(voters, 1, 1000, 0, 300));
    const gaps = positions.slice(1).map((value, i) => value - (positions[i] ?? 0));
    for (const gap of gaps) {
      expect(gap).toBeCloseTo(gaps[0] ?? 0, 9);
    }
  });

  it("maps the domain minimum to the range minimum and the domain maximum to the range maximum", () => {
    expect(logScale(1, 1, 1000, 0, 300)).toBeCloseTo(0, 9);
    expect(logScale(1000, 1, 1000, 0, 300)).toBeCloseTo(300, 9);
  });

  it("treats 0 voters the same as 1 voter rather than producing -Infinity or NaN", () => {
    const zeroVoters = logScale(0, 1, 1000, 0, 300);
    const oneVoter = logScale(1, 1, 1000, 0, 300);
    expect(Number.isFinite(zeroVoters)).toBe(true);
    expect(zeroVoters).toBeCloseTo(oneVoter, 9);
  });

  it("never produces a non-finite result, however extreme the input", () => {
    for (const value of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      -1000,
      1e300,
    ]) {
      expect(Number.isFinite(logScale(value, 1, 1000, 0, 300))).toBe(true);
    }
  });

  it("falls back to the range minimum for a degenerate or non-finite domain", () => {
    expect(logScale(10, 0, 1000, 0, 300)).toBe(0);
    expect(logScale(10, -5, 1000, 0, 300)).toBe(0);
    expect(logScale(10, 100, 100, 0, 300)).toBe(0);
  });
});

describe("sqrtScale", () => {
  it("maps the domain minimum to the range minimum and the domain maximum to the range maximum", () => {
    expect(sqrtScale(1, 1, 50, 8, 22)).toBeCloseTo(8, 9);
    expect(sqrtScale(50, 1, 50, 8, 22)).toBeCloseTo(22, 9);
  });

  it("grows more gradually than logScale, leaving room to keep growing past the low end", () => {
    const sqrtAtFifteen = sqrtScale(15, 1, 50, 8, 22);
    const logAtFifteen = logScale(15, 1, 50, 8, 22);
    expect(sqrtAtFifteen).toBeLessThan(logAtFifteen);
  });

  it("keeps growing noticeably between 15 and 50, unlike a plateaued curve", () => {
    const atFifteen = sqrtScale(15, 1, 50, 8, 22);
    const atFifty = sqrtScale(50, 1, 50, 8, 22);
    expect(atFifty - atFifteen).toBeGreaterThan(4);
  });

  it("never produces a non-finite result, however extreme the input", () => {
    for (const value of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      -1000,
      1e300,
    ]) {
      expect(Number.isFinite(sqrtScale(value, 1, 1000, 0, 300))).toBe(true);
    }
  });

  it("falls back to the range minimum for a degenerate or non-finite domain", () => {
    expect(sqrtScale(10, -5, 1000, 0, 300)).toBe(0);
    expect(sqrtScale(10, 100, 100, 0, 300)).toBe(0);
  });
});
