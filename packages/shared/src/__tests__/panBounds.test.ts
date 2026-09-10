import { describe, expect, it } from "vitest";
import { worldToScreen } from "../camera";
import { panBoundsX, panBoundsY } from "../panBounds";
import { worldToScreenY } from "../verticalCamera";
import { minZoomYForItems } from "../verticalEntryView";

describe("panBoundsX", () => {
  const viewportWidth = 1000;
  const zoom = 4;

  it("puts the leftmost item at exactly the 25% mark when panned to minCenter", () => {
    const { minCenter } = panBoundsX(-100, 200, viewportWidth, zoom);
    const screenX = worldToScreen(-100, { center: minCenter, zoom }, viewportWidth);
    expect(screenX).toBeCloseTo(viewportWidth * 0.25, 9);
  });

  it("puts the rightmost item at exactly the 75% mark when panned to maxCenter", () => {
    const { maxCenter } = panBoundsX(-100, 200, viewportWidth, zoom);
    const screenX = worldToScreen(200, { center: maxCenter, zoom }, viewportWidth);
    expect(screenX).toBeCloseTo(viewportWidth * 0.75, 9);
  });

  it("is symmetric: the same margin in world units on both sides", () => {
    const { minCenter, maxCenter } = panBoundsX(-100, 200, viewportWidth, zoom);
    expect(minCenter - -100).toBeCloseTo(200 - maxCenter, 9);
  });

  it("shrinks the margin (in world units) as zoom increases", () => {
    const loose = panBoundsX(-100, 200, viewportWidth, 1);
    const tight = panBoundsX(-100, 200, viewportWidth, 10);
    const looseMargin = loose.minCenter - -100;
    const tightMargin = tight.minCenter - -100;
    expect(tightMargin).toBeLessThan(looseMargin);
  });
});

describe("panBoundsY", () => {
  const viewportHeight = 800;
  const anchorScreenY = 640; // 80% down, matching WorldViewport's AXIS_TOP_PERCENT
  const zoomY = 100;

  it("puts the ground (world-Y 0) exactly at the 75% mark when panned to minCenterY", () => {
    const { minCenterY } = panBoundsY(3, viewportHeight, anchorScreenY, zoomY);
    const groundScreenY = worldToScreenY(0, { centerY: minCenterY, zoomY }, anchorScreenY);
    expect(groundScreenY).toBeCloseTo(viewportHeight * 0.75, 9);
  });

  it("puts the top item exactly at the 25% mark when panned to maxCenterY", () => {
    const maxWorldY = 3;
    const { maxCenterY } = panBoundsY(maxWorldY, viewportHeight, anchorScreenY, zoomY);
    const topScreenY = worldToScreenY(maxWorldY, { centerY: maxCenterY, zoomY }, anchorScreenY);
    expect(topScreenY).toBeCloseTo(viewportHeight * 0.25, 9);
  });

  it("minCenterY does not depend on the data (only maxCenterY does) - the ground floor is a fixed boundary", () => {
    const a = panBoundsY(1, viewportHeight, anchorScreenY, zoomY);
    const b = panBoundsY(20, viewportHeight, anchorScreenY, zoomY);
    expect(a.minCenterY).toBe(b.minCenterY);
  });

  it("minCenterY and maxCenterY exactly coincide at minZoomYForItems's own floor zoom - that's what calibrates it", () => {
    const items = [{ voterCount: 1000 }];
    const floorZoomY = minZoomYForItems(items, viewportHeight);
    const maxWorldY = Math.log10(1000);
    const { minCenterY, maxCenterY } = panBoundsY(
      maxWorldY,
      viewportHeight,
      anchorScreenY,
      floorZoomY,
    );
    expect(minCenterY).toBeCloseTo(maxCenterY, 9);
  });

  it("leaves room to pan (minCenterY below maxCenterY) once zoomed in past the floor", () => {
    const items = [{ voterCount: 1000 }];
    const maxWorldY = Math.log10(1000);
    const zoomedIn = minZoomYForItems(items, viewportHeight) * 2;
    const { minCenterY, maxCenterY } = panBoundsY(
      maxWorldY,
      viewportHeight,
      anchorScreenY,
      zoomedIn,
    );
    expect(minCenterY).toBeLessThan(maxCenterY);
  });
});
