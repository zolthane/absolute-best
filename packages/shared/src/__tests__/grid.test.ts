import { describe, expect, it } from "vitest";
import { worldToScreen } from "../camera";
import {
  type GridCellAssignment,
  nextGridZoom,
  sampleGrid,
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

  it("returns every member of a crowded cell, ranked the same way the representative was chosen", () => {
    const items: TestItem[] = [
      { id: "a", voterCount: 10, order: 0, cellCol: 0, cellRow: 0 },
      { id: "b", voterCount: 999, order: 1, cellCol: 0, cellRow: 0 },
      { id: "c", voterCount: 5, order: 2, cellCol: 0, cellRow: 0 },
    ];
    const cells = sampleGrid(items, byVoterCountThenAge);
    expect(cells[0]?.members.map((member) => member.id)).toEqual(["b", "a", "c"]);
    expect(cells[0]?.representative).toBe(cells[0]?.members[0]);
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

describe("nextGridZoom", () => {
  it("holds still for a change too small to be a deliberate zoom", () => {
    // The reported bug: crowded, zoomed-out views kept reshuffling on their
    // own with no user input large enough to explain it. None of this
    // should be able to move the grid at all.
    expect(nextGridZoom(4, 4 * 1.001)).toBe(4);
    expect(nextGridZoom(4, 4 * 0.999)).toBe(4);
  });

  it("has no fixed threshold a raw zoom can sit next to and flip", () => {
    // A first attempt at this snapped zoom to the nearest of a fixed ladder
    // of levels. That has hard lines in zoom-space: a raw zoom sitting a
    // floating-point epsilon away from one of those lines flips the entire
    // grid on the next, arbitrarily small, change - confirmed against that
    // implementation, a change of 1e-12 was enough. A dead zone centred on
    // the *previous result* has no such fixed line to sit next to.
    const settled = 1.0594630943592953; // sits exactly on an old ladder line
    expect(nextGridZoom(settled, settled + 1e-9)).toBe(settled);
    expect(nextGridZoom(settled, settled - 1e-9)).toBe(settled);
  });

  it("still moves for a real, sustained zoom", () => {
    expect(nextGridZoom(4, 8)).toBe(8);
    expect(nextGridZoom(4, 1)).toBe(1);
  });

  it("stays put through many tiny steps, then catches up once they add up to a real zoom", () => {
    let gridZoom = 4;
    let rawZoom = 4;
    let updates = 0;
    // A smooth continuous zoom gesture, modelled as many tiny multiplicative
    // steps (as a real wheel/pinch gesture would deliver) rather than one
    // big jump.
    for (let i = 0; i < 400; i++) {
      rawZoom *= 1.001;
      const next = nextGridZoom(gridZoom, rawZoom);
      if (next !== gridZoom) {
        updates++;
      }
      gridZoom = next;
    }
    // rawZoom has grown by roughly 1.001^400 ≈ 1.49x - a real, sustained
    // zoom - so the grid must have moved to keep up, just not on every step:
    // it should be within one dead zone of the final raw value, not still
    // sitting all the way back at 4.
    expect(gridZoom / rawZoom).toBeGreaterThan(1 / 1.12);
    expect(updates).toBeGreaterThan(0);
    expect(updates).toBeLessThan(400);
  });

  it("returns a safe fallback for non-finite or invalid input, never NaN", () => {
    for (const rawZoom of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(Number.isFinite(nextGridZoom(4, rawZoom))).toBe(true);
    }
    for (const previous of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(Number.isFinite(nextGridZoom(previous, 4))).toBe(true);
    }
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
