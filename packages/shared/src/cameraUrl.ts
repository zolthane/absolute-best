import { type Camera, clampZoom } from "./camera";

// Short, deliberately terse param names - this is a shareable link (product
// spec, section 3), not an API, so brevity in the address bar wins.
const CENTER_PARAM = "c";
const ZOOM_PARAM = "z";

/**
 * Encodes a camera into URL search params, so the current view can be
 * shared as a link (product spec, section 3).
 */
export function cameraToUrlParams(camera: Camera): URLSearchParams {
  const params = new URLSearchParams();
  params.set(CENTER_PARAM, camera.center.toFixed(2));
  params.set(ZOOM_PARAM, camera.zoom.toFixed(4));
  return params;
}

/**
 * The inverse of `cameraToUrlParams`. Returns null for missing or malformed
 * params (a hand-edited or stale link) rather than producing a broken
 * camera - callers should fall back to the normal entry view in that case.
 */
export function cameraFromUrlParams(params: URLSearchParams): Camera | null {
  const center = Number.parseFloat(params.get(CENTER_PARAM) ?? "");
  const zoom = Number.parseFloat(params.get(ZOOM_PARAM) ?? "");

  if (!Number.isFinite(center) || !Number.isFinite(zoom) || zoom <= 0) {
    return null;
  }

  return { center, zoom: clampZoom(zoom) };
}
