import { describe, expect, it } from "vitest";
import { worldToScreen } from "../camera";
import { fitCameraToItems } from "../entryView";

interface TestItem {
  score: number;
}

describe("fitCameraToItems", () => {
  it("includes the lowest and highest items on screen, with a margin", () => {
    const items: TestItem[] = [{ score: -50 }, { score: 0 }, { score: 30 }];
    const viewportWidth = 1000;
    const camera = fitCameraToItems(items, viewportWidth);

    const lowestScreenX = worldToScreen(-50, camera, viewportWidth);
    const highestScreenX = worldToScreen(30, camera, viewportWidth);

    expect(lowestScreenX).toBeGreaterThan(0);
    expect(lowestScreenX).toBeLessThan(viewportWidth);
    expect(highestScreenX).toBeGreaterThan(0);
    expect(highestScreenX).toBeLessThan(viewportWidth);
  });

  it("produces the fallback -100..100 range rather than erroring on empty data", () => {
    const camera = fitCameraToItems([], 1000);
    expect(camera.center).toBe(0);

    const leftEdgeScreenX = worldToScreen(-100, camera, 1000);
    const rightEdgeScreenX = worldToScreen(100, camera, 1000);
    expect(leftEdgeScreenX).toBeGreaterThan(0);
    expect(rightEdgeScreenX).toBeLessThan(1000);
  });

  it("does not produce a zero-width (infinite zoom) view when every item shares a score", () => {
    const items: TestItem[] = [{ score: 7 }, { score: 7 }, { score: 7 }];
    const camera = fitCameraToItems(items, 1000);

    expect(camera.center).toBe(7);
    expect(Number.isFinite(camera.zoom)).toBe(true);
    expect(camera.zoom).toBeGreaterThan(0);
  });

  it("is deterministic and unaffected by item order", () => {
    const items: TestItem[] = [{ score: 30 }, { score: -50 }, { score: 0 }];
    expect(fitCameraToItems(items, 1000)).toEqual(fitCameraToItems([...items].reverse(), 1000));
  });
});
