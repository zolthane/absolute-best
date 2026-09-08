import { describe, expect, it } from "vitest";
import { worldToScreen } from "../camera";
import {
  type GridCellAssignment,
  quantizeZoomForGrid,
  sampleGrid,
  screenPositionToCellIndex,
  worldPositionToCellIndex,
} from "../grid";

interface TestItem extends GridCellAssignment {
  id: string;
  voterCount: number;
  order: number;
}

const byVoterCountThenAge = (a: TestItem, b: TestItem): number =>
  a.voterCount !== b.voterCount ? b.voterCount - a.voterCount : a.order - b.order;

describe("sampleGrid", () => {
  it("never returns more than one representative per cell", () => {
    const items: TestItem[] = [
      { id: "a", voterCount: 10, order: 0, cellCol: 0, cellRow: 0 },
      { id: "b", voterCount: 20, order: 1, cellCol: 0, cellRow: 0 },
      { id: "c", voterCount: 5, order: 2, cellCol: 0, cellRow: 0 },
    ];
    const cells = sampleGrid(items, byVoterCountThenAge);
    expect(cells).toHaveLength(1);
  });

  it("picks the item the comparator ranks first - here, the most-voted", () => {
    const items: TestItem[] = [
      { id: "a", voterCount: 10, order: 0, cellCol: 0, cellRow: 0 },
      { id: "b", voterCount: 999, order: 1, cellCol: 0, cellRow: 0 },
      { id: "c", voterCount: 5, order: 2, cellCol: 0, cellRow: 0 },
    ];
    const cells = sampleGrid(items, byVoterCountThenAge);
    expect(cells[0]?.representative.id).toBe("b");
  });

  it("breaks a tie by the comparator's second criterion - here, the oldest wins", () => {
    const items: TestItem[] = [
      { id: "newer", voterCount: 10, order: 5, cellCol: 0, cellRow: 0 },
      { id: "older", voterCount: 10, order: 1, cellCol: 0, cellRow: 0 },
    ];
    const cells = sampleGrid(items, byVoterCountThenAge);
    expect(cells[0]?.representative.id).toBe("older");
  });

  it("counts every item assigned to a cell, not just whichever one wins it", () => {
    const items: TestItem[] = [
      { id: "a", voterCount: 10, order: 0, cellCol: 0, cellRow: 0 },
      { id: "b", voterCount: 20, order: 1, cellCol: 0, cellRow: 0 },
      { id: "c", voterCount: 5, order: 2, cellCol: 0, cellRow: 0 },
    ];
    const cells = sampleGrid(items, byVoterCountThenAge);
    expect(cells[0]?.count).toBe(3);
  });

  it("gives items in different cells their own separate representatives", () => {
    const items: TestItem[] = [
      { id: "a", voterCount: 10, order: 0, cellCol: 0, cellRow: 0 },
      { id: "b", voterCount: 10, order: 1, cellCol: 1, cellRow: 0 },
      { id: "c", voterCount: 10, order: 2, cellCol: 0, cellRow: 1 },
    ];
    const cells = sampleGrid(items, byVoterCountThenAge);
    expect(cells).toHaveLength(3);
  });

  it("returns nothing for an empty input, rather than erroring", () => {
    expect(sampleGrid<TestItem>([], byVoterCountThenAge)).toEqual([]);
  });

  it("is deterministic: the same input always produces the same result", () => {
    const items: TestItem[] = [
      { id: "a", voterCount: 10, order: 0, cellCol: 0, cellRow: 0 },
      { id: "b", voterCount: 999, order: 1, cellCol: 0, cellRow: 0 },
      { id: "c", voterCount: 10, order: 2, cellCol: 1, cellRow: 0 },
    ];
    const first = sampleGrid(items, byVoterCountThenAge);
    const second = sampleGrid(items, byVoterCountThenAge);
    expect(first.map((cell) => cell.representative.id)).toEqual(
      second.map((cell) => cell.representative.id),
    );
  });
});

describe("worldPositionToCellIndex", () => {
  it("stays the same across a pan, even though the screen position it would use does change", () => {
    // This is the whole fix batch 3 exists for: worldToScreen depends on
    // camera.center (panning), but worldPositionToCellIndex has no such
    // parameter to give it - there is no way to make it respond to pan.
    const worldPosition = 37;
    const zoom = 4;

    const screenAtCentre0 = worldToScreen(worldPosition, { center: 0, zoom }, 1000);
    const screenAtCentre50 = worldToScreen(worldPosition, { center: 50, zoom }, 1000);
    expect(screenAtCentre0).not.toBe(screenAtCentre50);

    const cellAtCentre0 = worldPositionToCellIndex(worldPosition, zoom, 40);
    const cellAtCentre50 = worldPositionToCellIndex(worldPosition, zoom, 40);
    expect(cellAtCentre0).toBe(cellAtCentre50);
  });

  it("produces smaller, more numerous cells as zoom increases", () => {
    const cellsAtLowZoom = new Set(
      [0, 5, 10, 15, 20].map((score) => worldPositionToCellIndex(score, 1, 40)),
    );
    const cellsAtHighZoom = new Set(
      [0, 5, 10, 15, 20].map((score) => worldPositionToCellIndex(score, 10, 40)),
    );
    expect(cellsAtHighZoom.size).toBeGreaterThan(cellsAtLowZoom.size);
  });

  it("returns a safe fallback for non-finite or invalid input, never NaN", () => {
    for (const zoom of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(Number.isFinite(worldPositionToCellIndex(10, zoom, 40))).toBe(true);
    }
    expect(Number.isFinite(worldPositionToCellIndex(Number.NaN, 4, 40))).toBe(true);
  });
});

describe("quantizeZoomForGrid", () => {
  it("absorbs a change too small to be a deliberate zoom", () => {
    // The reported bug: two items near a cell boundary flip in and out of
    // being merged as the zoom value jitters by a fraction of a percent -
    // from mouse-wheel notches, trackpad sensor noise, or floating-point
    // drift across repeated pinch gestures. None of that should be able to
    // move the grid at all.
    const base = quantizeZoomForGrid(4);
    expect(quantizeZoomForGrid(4 * 1.001)).toBe(base);
    expect(quantizeZoomForGrid(4 * 0.999)).toBe(base);
  });

  it("still moves for a real, sustained zoom", () => {
    expect(quantizeZoomForGrid(4)).not.toBe(quantizeZoomForGrid(8));
  });

  it("returns a safe fallback for non-finite or invalid input, never NaN", () => {
    for (const zoom of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(Number.isFinite(quantizeZoomForGrid(zoom))).toBe(true);
    }
  });
});

describe("screenPositionToCellIndex", () => {
  it("buckets equal-sized screen ranges into the same cell", () => {
    expect(screenPositionToCellIndex(0, 1, 40)).toBe(screenPositionToCellIndex(39, 1, 40));
    expect(screenPositionToCellIndex(0, 1, 40)).not.toBe(screenPositionToCellIndex(40, 1, 40));
  });

  it("returns a safe fallback for non-finite or invalid input", () => {
    expect(Number.isFinite(screenPositionToCellIndex(Number.NaN, 1, 40))).toBe(true);
    expect(Number.isFinite(screenPositionToCellIndex(10, 1, 0))).toBe(true);
    for (const zoom of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(Number.isFinite(screenPositionToCellIndex(10, zoom, 40))).toBe(true);
    }
  });

  it("splits two screen positions that zoomed-out shared a cell, once zoomed in enough", () => {
    // The bug this exists to fix: two items tied on the exact same score
    // (so X can never separate them - see worldPositionToCellIndex) but
    // with slightly different vote counts, so a close-but-not-identical
    // screen position. Without this, they'd stay merged forever, no matter
    // how far the user zoomed in.
    const near = 100;
    const nearby = 108;
    expect(screenPositionToCellIndex(near, 1, 40)).toBe(screenPositionToCellIndex(nearby, 1, 40));
    expect(screenPositionToCellIndex(near, 10, 40)).not.toBe(
      screenPositionToCellIndex(nearby, 10, 40),
    );
  });

  it("never separates two items at the exact same screen position, at any zoom", () => {
    // Genuinely identical items (same score, same vote count) are correctly
    // indistinguishable - there is nothing left to zoom into.
    expect(screenPositionToCellIndex(100, 500, 40)).toBe(screenPositionToCellIndex(100, 500, 40));
  });
});

describe("worldPositionToCellIndex + sampleGrid together", () => {
  const scores = [0, 5, 10, 15, 20];

  function asGridItems(zoom: number, cellSizePixels: number): TestItem[] {
    return scores.map((score, index) => ({
      id: `item-${index}`,
      voterCount: 10,
      order: index,
      cellCol: worldPositionToCellIndex(score, zoom, cellSizePixels),
      cellRow: 0,
    }));
  }

  it("merges nearby items into one representative when zoomed out", () => {
    const cells = sampleGrid(asGridItems(1, 40), byVoterCountThenAge);
    expect(cells).toHaveLength(1);
  });

  it("splits the same items into several representatives when zoomed in - strictly more than before", () => {
    const zoomedOutCount = sampleGrid(asGridItems(1, 40), byVoterCountThenAge).length;
    const zoomedInCount = sampleGrid(asGridItems(10, 40), byVoterCountThenAge).length;
    expect(zoomedInCount).toBeGreaterThan(zoomedOutCount);
  });
});
