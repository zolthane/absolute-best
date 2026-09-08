import { describe, expect, it } from "vitest";
import {
  clampZoomY,
  panCameraY,
  screenToWorldY,
  type VerticalCamera,
  worldToScreenY,
  zoomCameraAtPointY,
} from "../verticalCamera";

const cameraY: VerticalCamera = { centerY: 0, zoomY: 100 };
const anchorScreenY = 640;

describe("worldToScreenY / screenToWorldY", () => {
  it("are exact inverses of each other", () => {
    for (const worldY of [0, 1, 2.5, 3.5, -1]) {
      const screenY = worldToScreenY(worldY, cameraY, anchorScreenY);
      expect(screenToWorldY(screenY, cameraY, anchorScreenY)).toBeCloseTo(worldY, 9);
    }
  });

  it("places the camera's centre at the anchor screen position", () => {
    expect(worldToScreenY(cameraY.centerY, cameraY, anchorScreenY)).toBe(anchorScreenY);
  });

  it("moves up the screen (smaller pixel Y) as world Y increases", () => {
    const lower = worldToScreenY(1, cameraY, anchorScreenY);
    const higher = worldToScreenY(2, cameraY, anchorScreenY);
    expect(higher).toBeLessThan(lower);
  });
});

describe("panCameraY", () => {
  it("moves every world point on screen by exactly the panned distance", () => {
    for (const deltaScreenY of [1, -1, 50, -237.5, 0]) {
      const worldY = 2;
      const before = worldToScreenY(worldY, cameraY, anchorScreenY);
      const panned = panCameraY(cameraY, deltaScreenY);
      const after = worldToScreenY(worldY, panned, anchorScreenY);
      expect(after - before).toBeCloseTo(deltaScreenY, 9);
    }
  });

  it("does not change zoom", () => {
    expect(panCameraY(cameraY, 123).zoomY).toBe(cameraY.zoomY);
  });
});

describe("zoomCameraAtPointY", () => {
  const minZoomY = 1;

  it("keeps the world point under the pointer under the pointer after zooming", () => {
    const pointerPositions = [0, 100, 640, 799, 1000];
    const zoomFactors = [2, 0.5, 10, 0.1, 1];

    for (const pointerScreenY of pointerPositions) {
      for (const zoomFactor of zoomFactors) {
        const worldUnderPointerBefore = screenToWorldY(pointerScreenY, cameraY, anchorScreenY);
        const zoomed = zoomCameraAtPointY(
          cameraY,
          anchorScreenY,
          pointerScreenY,
          zoomFactor,
          minZoomY,
        );
        const worldUnderPointerAfter = screenToWorldY(pointerScreenY, zoomed, anchorScreenY);
        expect(worldUnderPointerAfter).toBeCloseTo(worldUnderPointerBefore, 6);
      }
    }
  });

  it("increases zoom for a factor above 1 and decreases it for a factor below 1", () => {
    expect(zoomCameraAtPointY(cameraY, anchorScreenY, 500, 2, minZoomY).zoomY).toBeGreaterThan(
      cameraY.zoomY,
    );
    expect(zoomCameraAtPointY(cameraY, anchorScreenY, 500, 0.5, minZoomY).zoomY).toBeLessThan(
      cameraY.zoomY,
    );
  });

  it("never zooms out past minZoomY - there is nothing beyond the data to show", () => {
    const zoomedWayOut = zoomCameraAtPointY(cameraY, anchorScreenY, 500, 1e-10, 25);
    expect(zoomedWayOut.zoomY).toBe(25);
  });

  it("never produces NaN or Infinity, however extreme the zoom factor", () => {
    for (const zoomFactor of [1e300, 1e-300, Number.POSITIVE_INFINITY, 0, -5]) {
      const zoomed = zoomCameraAtPointY(cameraY, anchorScreenY, 500, zoomFactor, minZoomY);
      expect(Number.isFinite(zoomed.zoomY)).toBe(true);
      expect(Number.isFinite(zoomed.centerY)).toBe(true);
    }
  });
});

describe("clampZoomY", () => {
  it("passes values already above the floor through unchanged", () => {
    expect(clampZoomY(50, 10)).toBe(50);
  });

  it("clamps a value below the floor up to it", () => {
    expect(clampZoomY(1, 10)).toBe(10);
  });

  it("treats non-finite input as the floor rather than propagating NaN", () => {
    expect(clampZoomY(Number.NaN, 10)).toBe(10);
    expect(clampZoomY(Number.POSITIVE_INFINITY, 10)).toBe(10);
  });
});
