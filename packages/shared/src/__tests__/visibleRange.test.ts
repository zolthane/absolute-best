import { describe, expect, it } from "vitest";
import { DISPLAY_SCORE_DAMPING } from "../displayScore";
import { filterByVisibleRange } from "../visibleRange";

describe("filterByVisibleRange", () => {
  // voterCount: 0 makes displayScore(item) === score / DISPLAY_SCORE_DAMPING,
  // so scaling by it keeps these items at the same displayed positions
  // (-100, -50, 0, 50, 100) this file's ranges were written against,
  // regardless of the damping constant.
  const items = [
    { id: "far-left", score: -100 * DISPLAY_SCORE_DAMPING, voterCount: 0 },
    { id: "just-inside-left", score: -50 * DISPLAY_SCORE_DAMPING, voterCount: 0 },
    { id: "centre", score: 0, voterCount: 0 },
    { id: "just-inside-right", score: 50 * DISPLAY_SCORE_DAMPING, voterCount: 0 },
    { id: "far-right", score: 100 * DISPLAY_SCORE_DAMPING, voterCount: 0 },
  ];

  it("includes items within the range and excludes distant ones", () => {
    const visible = filterByVisibleRange(items, -60, 60);
    expect(visible.map((item) => item.id)).toEqual([
      "just-inside-left",
      "centre",
      "just-inside-right",
    ]);
  });

  it("includes items exactly on the boundary", () => {
    const visible = filterByVisibleRange(items, -50, 50);
    expect(visible.map((item) => item.id)).toContain("just-inside-left");
    expect(visible.map((item) => item.id)).toContain("just-inside-right");
  });

  it("returns everything when the range covers the whole data set", () => {
    expect(filterByVisibleRange(items, -1000, 1000)).toHaveLength(items.length);
  });

  it("returns nothing when the range covers none of the data set", () => {
    expect(filterByVisibleRange(items, 1000, 2000)).toEqual([]);
  });
});
