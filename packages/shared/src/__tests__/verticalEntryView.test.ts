import { describe, expect, it } from "vitest";
import { worldToScreenY } from "../verticalCamera";
import { fitVerticalCameraToItems, minZoomYForItems } from "../verticalEntryView";

interface TestItem {
  voterCount: number;
}

describe("minZoomYForItems", () => {
  it("fits the top item within the viewport height, with a margin", () => {
    const items: TestItem[] = [{ voterCount: 1 }, { voterCount: 1000 }];
    const viewportHeight = 800;
    const minZoomY = minZoomYForItems(items, viewportHeight);

    const topScreenY = worldToScreenY(Math.log10(1000), { centerY: 0, zoomY: minZoomY }, 800);
    expect(topScreenY).toBeGreaterThan(0);
  });

  it("grows smaller (zooms out further) as the top item's voter count grows", () => {
    const modest = minZoomYForItems([{ voterCount: 100 }], 800);
    const huge = minZoomYForItems([{ voterCount: 1_000_000 }], 800);
    expect(huge).toBeLessThan(modest);
  });

  it("does not divide by zero or produce a non-finite result for a flat (all-1-voter) dataset", () => {
    const minZoomY = minZoomYForItems([{ voterCount: 1 }, { voterCount: 1 }], 800);
    expect(Number.isFinite(minZoomY)).toBe(true);
    expect(minZoomY).toBeGreaterThan(0);
  });

  it("treats an empty dataset the same as a single 1-voter item, rather than erroring", () => {
    expect(minZoomYForItems([], 800)).toBe(minZoomYForItems([{ voterCount: 1 }], 800));
  });
});

describe("fitVerticalCameraToItems", () => {
  // 80% down, matching WorldViewport's AXIS_TOP_PERCENT - used throughout
  // this describe block so the ground-at-bottom-edge check below has a real
  // gap to prove it's closing.
  const anchorScreenY = 640;

  it("pins the ground (1 voter) to the very bottom edge of the screen, not anchorScreenY's 80%-down position", () => {
    const items: TestItem[] = [{ voterCount: 1 }, { voterCount: 1000 }];
    const camera = fitVerticalCameraToItems(items, 800, anchorScreenY);
    expect(worldToScreenY(0, camera, anchorScreenY)).toBeCloseTo(800, 9);
  });

  it("zooms in exactly to the floor - no looser, since the floor already leaves the intended top margin", () => {
    const items: TestItem[] = [{ voterCount: 1 }, { voterCount: 1000 }];
    const floor = minZoomYForItems(items, 800);
    expect(fitVerticalCameraToItems(items, 800, anchorScreenY).zoomY).toBe(floor);
  });

  it("is deterministic and unaffected by item order", () => {
    const items: TestItem[] = [{ voterCount: 1000 }, { voterCount: 1 }, { voterCount: 50 }];
    expect(fitVerticalCameraToItems(items, 800, anchorScreenY)).toEqual(
      fitVerticalCameraToItems([...items].reverse(), 800, anchorScreenY),
    );
  });
});
