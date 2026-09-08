/**
 * The vertical counterpart to Camera (camera.ts): describes what slice of
 * the voter-count axis is visible. Kept as its own type rather than folded
 * into Camera because the two axes are not symmetric - X is centred on a
 * meaningful zero (a score can be negative) and pans/zooms around it; Y has
 * no negative side (a voter count is never below zero) and is anchored at
 * its own zero (1 voter, the "ground") instead. `centerY` is the world-Y
 * value - log10 of a voter count - that currently sits at a fixed screen
 * anchor (the ground line's screen position); `zoomY` is screen pixels per
 * world-Y unit, i.e. per order of magnitude of voters.
 */
export interface VerticalCamera {
  centerY: number;
  zoomY: number;
}

// A generous upper guard, not a practical limit - purely to keep the maths
// below finite at an extreme zoom, mirroring camera.ts's MAX_ZOOM.
const MAX_ZOOM_Y = 1_000_000;

export function clampZoomY(zoomY: number, minZoomY: number): number {
  if (!Number.isFinite(zoomY)) {
    return minZoomY;
  }
  return Math.min(MAX_ZOOM_Y, Math.max(minZoomY, zoomY));
}

export function worldToScreenY(
  worldY: number,
  cameraY: VerticalCamera,
  anchorScreenY: number,
): number {
  // Screen Y grows downward while world Y (more voters) should read as
  // "higher up" - hence the subtraction, the mirror image of worldToScreen's
  // addition for X.
  return anchorScreenY - (worldY - cameraY.centerY) * cameraY.zoomY;
}

export function screenToWorldY(
  screenY: number,
  cameraY: VerticalCamera,
  anchorScreenY: number,
): number {
  return cameraY.centerY - (screenY - anchorScreenY) / cameraY.zoomY;
}

/**
 * Moves the vertical camera by a screen-pixel drag delta, keeping whatever
 * was under the pointer moving with it - the Y equivalent of panCamera.
 */
export function panCameraY(cameraY: VerticalCamera, deltaScreenY: number): VerticalCamera {
  return { ...cameraY, centerY: cameraY.centerY + deltaScreenY / cameraY.zoomY };
}

/**
 * Changes vertical zoom by `zoomFactor` while keeping the world point under
 * `pointerScreenY` at that same screen position afterwards - the Y
 * equivalent of zoomCameraAtPoint. `minZoomY` is supplied by the caller
 * (it depends on the current data and viewport height, which this module
 * has no notion of) and is the floor below which zooming out would show
 * emptiness beyond the actual data - see verticalEntryView.ts.
 */
export function zoomCameraAtPointY(
  cameraY: VerticalCamera,
  anchorScreenY: number,
  pointerScreenY: number,
  zoomFactor: number,
  minZoomY: number,
): VerticalCamera {
  const worldAtPointer = screenToWorldY(pointerScreenY, cameraY, anchorScreenY);
  const zoomY = clampZoomY(cameraY.zoomY * zoomFactor, minZoomY);
  const centerY = worldAtPointer + (pointerScreenY - anchorScreenY) / zoomY;
  return { centerY, zoomY };
}
