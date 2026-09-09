import { describe, expect, it } from "vitest";
import { settleOvershoot, springSettleProgress } from "../springSettle";

describe("settleOvershoot", () => {
  it("is largest for a brand-new item", () => {
    expect(settleOvershoot(1)).toBeGreaterThan(settleOvershoot(100));
  });

  it("shrinks as voter count grows, never reaching exactly zero", () => {
    const counts = [1, 10, 100, 1000, 100_000];
    for (let i = 1; i < counts.length; i++) {
      const previous = counts[i - 1];
      const current = counts[i];
      if (previous === undefined || current === undefined) throw new Error("fixture error");
      expect(settleOvershoot(current)).toBeLessThan(settleOvershoot(previous));
    }
    expect(settleOvershoot(100_000)).toBeGreaterThan(0);
  });

  it("treats 0 the same as 1 voter, rather than dividing by zero", () => {
    expect(settleOvershoot(0)).toBe(settleOvershoot(1));
    expect(Number.isFinite(settleOvershoot(0))).toBe(true);
  });
});

describe("springSettleProgress", () => {
  it("starts at 0 and ends at 1", () => {
    expect(springSettleProgress(0, 10)).toBeCloseTo(0, 9);
    expect(springSettleProgress(1, 10)).toBe(1);
  });

  it("overshoots past 1 partway through, for a low-voter-count item", () => {
    const values = [0.1, 0.2, 0.3, 0.5, 0.7, 0.9].map((t) => springSettleProgress(t, 1));
    expect(Math.max(...values)).toBeGreaterThan(1);
  });

  it("overshoots less (or not at all) for a well-established item, at the same t", () => {
    const overshootLow = Math.max(
      ...[0.5, 0.6, 0.7, 0.8].map((t) => springSettleProgress(t, 1) - 1),
    );
    const overshootHigh = Math.max(
      ...[0.5, 0.6, 0.7, 0.8].map((t) => springSettleProgress(t, 1_000_000) - 1),
    );
    expect(overshootHigh).toBeLessThan(overshootLow);
  });

  it("clamps t outside [0, 1] rather than overshooting the clamp itself", () => {
    expect(springSettleProgress(-1, 10)).toBeCloseTo(0, 9);
    expect(springSettleProgress(2, 10)).toBe(1);
  });
});
