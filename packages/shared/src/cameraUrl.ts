import { type Camera, clampZoom } from "./camera";
import { clampZoomY, type VerticalCamera } from "./verticalCamera";

// Short, deliberately terse param names - this is a shareable link (product
// spec, section 3), not an API, so brevity in the address bar wins.
const CENTER_PARAM = "c";
const ZOOM_PARAM = "z";
const CENTER_Y_PARAM = "cy";
const ZOOM_Y_PARAM = "zy";

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

/**
 * The Y-camera equivalent of cameraToUrlParams. Independent of the X params,
 * so a link missing or malformed on one axis still restores the other -
 * each falls back to its own entry-view fit rather than failing together.
 */
export function verticalCameraToUrlParams(cameraY: VerticalCamera): URLSearchParams {
  const params = new URLSearchParams();
  params.set(CENTER_Y_PARAM, cameraY.centerY.toFixed(4));
  params.set(ZOOM_Y_PARAM, cameraY.zoomY.toFixed(4));
  return params;
}

/**
 * The inverse of verticalCameraToUrlParams. `minZoomY` depends on the
 * current data and viewport, so it is supplied by the caller rather than
 * guessed here - see verticalEntryView.ts.
 */
export function verticalCameraFromUrlParams(
  params: URLSearchParams,
  minZoomY: number,
): VerticalCamera | null {
  const centerY = Number.parseFloat(params.get(CENTER_Y_PARAM) ?? "");
  const zoomY = Number.parseFloat(params.get(ZOOM_Y_PARAM) ?? "");

  if (!Number.isFinite(centerY) || !Number.isFinite(zoomY) || zoomY <= 0) {
    return null;
  }

  return { centerY, zoomY: clampZoomY(zoomY, minZoomY) };
}
