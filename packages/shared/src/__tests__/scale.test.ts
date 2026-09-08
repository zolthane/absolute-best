import { describe, expect, it } from "vitest";
import { logScale } from "../scale";

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
