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

export function panCamera(camera: Camera, deltaScreenX: number): Camera {
  return {
    ...camera,
    center: camera.center - deltaScreenX / camera.zoom,
  };
}

/**
 * Changes zoom by `zoomFactor` while keeping the world point currently under
 * `pointerScreenX` under that same screen position afterwards - the
 * "zoom towards the cursor" behaviour every map application relies on.
 */
export function zoomCameraAtPoint(
  camera: Camera,
  viewportWidth: number,
  pointerScreenX: number,
  zoomFactor: number,
): Camera {
  const worldAtPointer = screenToWorld(pointerScreenX, camera, viewportWidth);
  const zoom = clampZoom(camera.zoom * zoomFactor);
  const center = worldAtPointer - (pointerScreenX - viewportWidth / 2) / zoom;
  return { center, zoom };
}
