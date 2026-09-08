import { describe, expect, it } from "vitest";
import { computeNiceTicks } from "../ticks";

describe("computeNiceTicks", () => {
  it("returns evenly-spaced round numbers within the range", () => {
    const ticks = computeNiceTicks(0, 100, 8);
    expect(ticks.length).toBeGreaterThan(0);
    for (const tick of ticks) {
      expect(tick).toBeGreaterThanOrEqual(0);
      expect(tick).toBeLessThanOrEqual(100);
    }
    const steps = new Set(ticks.slice(1).map((value, i) => value - (ticks[i] ?? 0)));
    expect(steps.size).toBe(1);
  });

  it("includes 0 when the range straddles zero", () => {
    const ticks = computeNiceTicks(-50, 50, 8);
    expect(ticks).toContain(0);
  });

  it("stays small and finite for a hugely zoomed-out range", () => {
    const ticks = computeNiceTicks(-1e9, 1e9, 8);
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.length).toBeLessThan(20);
    for (const tick of ticks) {
      expect(Number.isFinite(tick)).toBe(true);
    }
  });

  it("stays small and finite for a hugely zoomed-in range", () => {
    const ticks = computeNiceTicks(9.9999, 10.0001, 8);
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.length).toBeLessThan(20);
    for (const tick of ticks) {
      expect(Number.isFinite(tick)).toBe(true);
    }
  });

  it("returns no ticks for a zero-width or inverted range, rather than looping forever", () => {
    expect(computeNiceTicks(10, 10)).toEqual([]);
    expect(computeNiceTicks(10, 5)).toEqual([]);
  });

  it("returns no ticks for non-finite input", () => {
    expect(computeNiceTicks(Number.NaN, 10)).toEqual([]);
    expect(computeNiceTicks(0, Number.POSITIVE_INFINITY)).toEqual([]);
  });

  describe("minStep", () => {
    it("produces fractional ticks by default when zoomed in close", () => {
      const ticks = computeNiceTicks(47, 49, 8);
      expect(ticks.some((value) => !Number.isInteger(value))).toBe(true);
    });

    it("never produces a fractional tick when minStep is 1, however far zoomed in", () => {
      // A vote score is always a whole number (R2), so a label like "48.5"
      // does not correspond to anything that could actually exist.
      const ticks = computeNiceTicks(47, 49, 8, 1);
      for (const tick of ticks) {
        expect(Number.isInteger(tick)).toBe(true);
      }
    });

    it("falls back to whole numbers rather than fabricating extra ticks to hit the target count", () => {
      const ticks = computeNiceTicks(10, 13, 8, 1);
      expect(ticks).toEqual([10, 11, 12, 13]);
    });

    it("has no effect once the natural step is already at or above minStep", () => {
      const withMinStep = computeNiceTicks(0, 1000, 8, 1);
      const withoutMinStep = computeNiceTicks(0, 1000, 8);
      expect(withMinStep).toEqual(withoutMinStep);
    });
  });
});
