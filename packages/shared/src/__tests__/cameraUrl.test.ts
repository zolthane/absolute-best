import { describe, expect, it } from "vitest";
import type { Camera } from "../camera";
import { cameraFromUrlParams, cameraToUrlParams } from "../cameraUrl";

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
