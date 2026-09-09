/**
 * The camera describes what part of the infinite world line is visible.
 *
 * `center` is the world x-coordinate (a score) that sits at the horizontal
 * centre of the viewport. `zoom` is how many screen pixels represent one
 * unit of score - so zooming in means a larger number.
 */
export interface Camera {
  center: number;
  zoom: number;
}

// Zoom is clamped to keep worldToScreen/screenToWorld finite and readable
// at both extremes - see the "extreme zoom" tests, which is where a
// clamp-free version of this produced Infinity/NaN during development.
export const MIN_ZOOM = 0.001;
export const MAX_ZOOM = 500;

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) {
    return MIN_ZOOM;
  }
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function worldToScreen(worldX: number, camera: Camera, viewportWidth: number): number {
  return (worldX - camera.center) * camera.zoom + viewportWidth / 2;
}

export function screenToWorld(screenX: number, camera: Camera, viewportWidth: number): number {
  return (screenX - viewportWidth / 2) / camera.zoom + camera.center;
}

// `minCenter`/`maxCenter` default to unbounded, so every existing caller
// that doesn't pass them keeps panning freely. Batch 6b adds real bounds -
// the current data's extent plus half a screen's slack on each side, so
// dragging can't reveal an unbounded sea of empty space (see WorldViewport,
// which computes them fresh each render from the live data and viewport).
export function panCamera(
  camera: Camera,
  deltaScreenX: number,
  minCenter = Number.NEGATIVE_INFINITY,
  maxCenter = Number.POSITIVE_INFINITY,
): Camera {
  const center = camera.center - deltaScreenX / camera.zoom;
  return { ...camera, center: Math.min(maxCenter, Math.max(minCenter, center)) };
}

/**
 * Changes zoom by `zoomFactor` while keeping the world point currently under
 * `pointerScreenX` under that same screen position afterwards - the
 * "zoom towards the cursor" behaviour every map application relies on.
 * `minCenter`/`maxCenter` are the same pan bounds panCamera takes.
 */
export function zoomCameraAtPoint(
  camera: Camera,
  viewportWidth: number,
  pointerScreenX: number,
  zoomFactor: number,
  minCenter = Number.NEGATIVE_INFINITY,
  maxCenter = Number.POSITIVE_INFINITY,
): Camera {
  const worldAtPointer = screenToWorld(pointerScreenX, camera, viewportWidth);
  const zoom = clampZoom(camera.zoom * zoomFactor);
  const center = worldAtPointer - (pointerScreenX - viewportWidth / 2) / zoom;
  return { center: Math.min(maxCenter, Math.max(minCenter, center)), zoom };
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * A point partway between two cameras, for animating a "glide" (product
 * spec, section 3: focusing an item animates smoothly, it does not jump).
 * `t` runs from 0 (`from`) to 1 (`to`) and is eased rather than linear, so
 * the motion starts and ends gently. `zoom` is interpolated in log space,
 * since zoom is naturally multiplicative - lerping it directly would make
 * the zoom change feel front- or back-loaded instead of even.
 */
export function interpolateCamera(from: Camera, to: Camera, t: number): Camera {
  const eased = easeInOutCubic(Math.min(1, Math.max(0, t)));
  const logZoom = Math.log(from.zoom) + (Math.log(to.zoom) - Math.log(from.zoom)) * eased;
  return {
    center: from.center + (to.center - from.center) * eased,
    zoom: clampZoom(Math.exp(logZoom)),
  };
}
