import { describe, expect, it } from "vitest";
import { worldToScreen } from "../camera";
import { DISPLAY_SCORE_DAMPING } from "../displayScore";
import { fitCameraToItems } from "../entryView";

interface TestItem {
  score: number;
  voterCount: number;
}

// voterCount: 0 makes displayScore(item) === score / DISPLAY_SCORE_DAMPING,
// so scaling a desired displayed position by DISPLAY_SCORE_DAMPING gives an
// item that lands exactly there - keeping these tests' expected screen
// positions in the same round numbers regardless of the damping constant.
function itemAt(displayedX: number): TestItem {
  return { score: displayedX * DISPLAY_SCORE_DAMPING, voterCount: 0 };
}

describe("fitCameraToItems", () => {
  it("includes the lowest and highest items on screen, with a margin", () => {
    const items: TestItem[] = [itemAt(-5), itemAt(0), itemAt(3)];
    const viewportWidth = 1000;
    const camera = fitCameraToItems(items, viewportWidth);

    const lowestScreenX = worldToScreen(-5, camera, viewportWidth);
    const highestScreenX = worldToScreen(3, camera, viewportWidth);

    expect(lowestScreenX).toBeGreaterThan(0);
    expect(lowestScreenX).toBeLessThan(viewportWidth);
    expect(highestScreenX).toBeGreaterThan(0);
    expect(highestScreenX).toBeLessThan(viewportWidth);
  });

  it("produces the fallback range rather than erroring on empty data", () => {
    const camera = fitCameraToItems([], 1000);
    expect(camera.center).toBe(0);

    const leftEdgeScreenX = worldToScreen(-10, camera, 1000);
    const rightEdgeScreenX = worldToScreen(10, camera, 1000);
    expect(leftEdgeScreenX).toBeGreaterThan(0);
    expect(rightEdgeScreenX).toBeLessThan(1000);
  });

  it("does not produce a zero-width (infinite zoom) view when every item shares a displayed position", () => {
    const items: TestItem[] = [itemAt(7), itemAt(7), itemAt(7)];
    const camera = fitCameraToItems(items, 1000);

    expect(camera.center).toBe(7);
    expect(Number.isFinite(camera.zoom)).toBe(true);
    expect(camera.zoom).toBeGreaterThan(0);
  });

  it("is deterministic and unaffected by item order", () => {
    const items: TestItem[] = [itemAt(3), itemAt(-5), itemAt(0)];
    expect(fitCameraToItems(items, 1000)).toEqual(fitCameraToItems([...items].reverse(), 1000));
  });
});
