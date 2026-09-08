import { describe, expect, it } from "vitest";
import type { Camera } from "../camera";
import {
  cameraFromUrlParams,
  cameraToUrlParams,
  verticalCameraFromUrlParams,
  verticalCameraToUrlParams,
} from "../cameraUrl";
import type { VerticalCamera } from "../verticalCamera";

describe("cameraToUrlParams + cameraFromUrlParams", () => {
  it("restores the same view after a round trip", () => {
    const camera: Camera = { center: 12.5, zoom: 8.25 };
    const restored = cameraFromUrlParams(cameraToUrlParams(camera));

    expect(restored?.center).toBeCloseTo(camera.center, 1);
    expect(restored?.zoom).toBeCloseTo(camera.zoom, 3);
  });

  it("returns null for params with no camera in them, rather than a broken camera", () => {
    expect(cameraFromUrlParams(new URLSearchParams(""))).toBeNull();
    expect(cameraFromUrlParams(new URLSearchParams("foo=bar"))).toBeNull();
  });

  it("returns null for malformed values instead of NaN or a zero/negative zoom", () => {
    expect(cameraFromUrlParams(new URLSearchParams("c=notanumber&z=4"))).toBeNull();
    expect(cameraFromUrlParams(new URLSearchParams("c=0&z=0"))).toBeNull();
    expect(cameraFromUrlParams(new URLSearchParams("c=0&z=-4"))).toBeNull();
  });
});

describe("verticalCameraToUrlParams + verticalCameraFromUrlParams", () => {
  const minZoomY = 1;

  it("restores the same view after a round trip", () => {
    const cameraY: VerticalCamera = { centerY: 1.5, zoomY: 250 };
    const restored = verticalCameraFromUrlParams(verticalCameraToUrlParams(cameraY), minZoomY);

    expect(restored?.centerY).toBeCloseTo(cameraY.centerY, 3);
    expect(restored?.zoomY).toBeCloseTo(cameraY.zoomY, 3);
  });

  it("returns null for params with no vertical camera in them", () => {
    expect(verticalCameraFromUrlParams(new URLSearchParams(""), minZoomY)).toBeNull();
    expect(verticalCameraFromUrlParams(new URLSearchParams("foo=bar"), minZoomY)).toBeNull();
  });

  it("returns null for malformed values instead of NaN or a zero/negative zoom", () => {
    expect(
      verticalCameraFromUrlParams(new URLSearchParams("cy=notanumber&zy=4"), minZoomY),
    ).toBeNull();
    expect(verticalCameraFromUrlParams(new URLSearchParams("cy=0&zy=0"), minZoomY)).toBeNull();
    expect(verticalCameraFromUrlParams(new URLSearchParams("cy=0&zy=-4"), minZoomY)).toBeNull();
  });

  it("clamps a stale link's zoom up to the current minZoomY floor", () => {
    const restored = verticalCameraFromUrlParams(new URLSearchParams("cy=0&zy=1"), 50);
    expect(restored?.zoomY).toBe(50);
  });
});
