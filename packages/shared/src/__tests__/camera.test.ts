import { describe, expect, it } from "vitest";
import {
  type Camera,
  clampZoom,
  MAX_ZOOM,
  MIN_ZOOM,
  panCamera,
  screenToWorld,
  worldToScreen,
  zoomCameraAtPoint,
} from "../camera";

const camera: Camera = { center: 0, zoom: 4 };
const viewportWidth = 1000;

describe("worldToScreen / screenToWorld", () => {
  it("are exact inverses of each other", () => {
    for (const worldX of [0, 1, -1, 42.5, -1000, 999999]) {
      const screenX = worldToScreen(worldX, camera, viewportWidth);
      expect(screenToWorld(screenX, camera, viewportWidth)).toBeCloseTo(worldX, 9);
    }
  });

  it("places world 0 at the centre of the viewport when the camera is centred on 0", () => {
    expect(worldToScreen(0, camera, viewportWidth)).toBe(viewportWidth / 2);
  });

  it("places the camera's centre at the centre of the viewport regardless of value", () => {
    const offCentre: Camera = { center: 250, zoom: 2 };
    expect(worldToScreen(250, offCentre, viewportWidth)).toBe(viewportWidth / 2);
  });

  it("moves one screen pixel per (1 / zoom) world units", () => {
    const a = worldToScreen(10, camera, viewportWidth);
    const b = worldToScreen(10 + 1 / camera.zoom, camera, viewportWidth);
    expect(b - a).toBeCloseTo(1, 9);
  });
});

describe("panCamera", () => {
  it("moves every world point on screen by exactly the panned distance", () => {
    for (const deltaScreenX of [1, -1, 50, -237.5, 0]) {
      const worldX = 17;
      const before = worldToScreen(worldX, camera, viewportWidth);
      const panned = panCamera(camera, deltaScreenX);
      const after = worldToScreen(worldX, panned, viewportWidth);
      expect(after - before).toBeCloseTo(deltaScreenX, 9);
    }
  });

  it("does not change zoom", () => {
    const panned = panCamera(camera, 123);
    expect(panned.zoom).toBe(camera.zoom);
  });
});

describe("zoomCameraAtPoint", () => {
  it("keeps the world point under the pointer under the pointer after zooming", () => {
    const pointerPositions = [0, 1, 500, 999, viewportWidth];
    const zoomFactors = [2, 0.5, 10, 0.1, 1];

    for (const pointerScreenX of pointerPositions) {
      for (const zoomFactor of zoomFactors) {
        const worldUnderPointerBefore = screenToWorld(pointerScreenX, camera, viewportWidth);
        const zoomed = zoomCameraAtPoint(camera, viewportWidth, pointerScreenX, zoomFactor);
        const worldUnderPointerAfter = screenToWorld(pointerScreenX, zoomed, viewportWidth);
        expect(worldUnderPointerAfter).toBeCloseTo(worldUnderPointerBefore, 6);
      }
    }
  });

  it("increases zoom for a factor above 1 and decreases it for a factor below 1", () => {
    expect(zoomCameraAtPoint(camera, viewportWidth, 500, 2).zoom).toBeGreaterThan(camera.zoom);
    expect(zoomCameraAtPoint(camera, viewportWidth, 500, 0.5).zoom).toBeLessThan(camera.zoom);
  });

  it("never produces NaN or Infinity, however extreme the zoom factor", () => {
    for (const zoomFactor of [1e300, 1e-300, Number.POSITIVE_INFINITY, 0, -5]) {
      const zoomed = zoomCameraAtPoint(camera, viewportWidth, 500, zoomFactor);
      expect(Number.isFinite(zoomed.zoom)).toBe(true);
      expect(Number.isFinite(zoomed.center)).toBe(true);
    }
  });

  it("clamps zoom to MIN_ZOOM and MAX_ZOOM rather than growing without bound", () => {
    const zoomedIn = zoomCameraAtPoint(camera, viewportWidth, 500, 1e10);
    expect(zoomedIn.zoom).toBe(MAX_ZOOM);

    const zoomedOut = zoomCameraAtPoint(camera, viewportWidth, 500, 1e-10);
    expect(zoomedOut.zoom).toBe(MIN_ZOOM);
  });
});

describe("clampZoom", () => {
  it("passes values already inside the range through unchanged", () => {
    expect(clampZoom(4)).toBe(4);
  });

  it("clamps values outside the range", () => {
    expect(clampZoom(MAX_ZOOM * 10)).toBe(MAX_ZOOM);
    expect(clampZoom(MIN_ZOOM / 10)).toBe(MIN_ZOOM);
  });

  it("treats non-finite input as the minimum zoom rather than propagating NaN", () => {
    expect(clampZoom(Number.NaN)).toBe(MIN_ZOOM);
    expect(clampZoom(Number.POSITIVE_INFINITY)).toBe(MIN_ZOOM);
  });
});
