import { MAX_EMPTY_SCREEN_FRACTION } from "./panBounds";
import type { VerticalCamera } from "./verticalCamera";

// A guard against a zero-height range when every item has the same (or
// very few) voters - keeps a single dot from being asked to fill the
// whole screen, mirroring entryView.ts's MIN_FIT_RANGE.
const MIN_FIT_DECADES = 1;

/**
 * The vertical zoom at which the whole voter-count range (1 voter to the
 * most-voted item) fits in one screen with exactly panBoundsY's own top
 * margin left above it - the floor vertical zoom can never go below, since
 * there is nothing beyond the data to show, and anything looser would mean
 * the top margin and the ground floor (panBoundsY) can't both be satisfied
 * at once (there wouldn't be enough room for both). The same reasoning
 * fitCameraToItems uses for X's entry view, expressed through the same
 * margin panBoundsY uses rather than its own separate number.
 */
export function minZoomYForItems(
  items: readonly { voterCount: number }[],
  viewportHeight: number,
): number {
  const maxVoterCount = Math.max(1, ...items.map((item) => item.voterCount));
  const decades = Math.max(Math.log10(maxVoterCount), MIN_FIT_DECADES);
  return ((1 - MAX_EMPTY_SCREEN_FRACTION) * viewportHeight) / decades;
}

/**
 * The default vertical camera on arrival. Anchored at the ground (1 voter)
 * rather than centred the way X is - Y has no meaningful midpoint - pinned
 * exactly to the bottom edge of the screen (panBoundsY's own ground floor,
 * at zero slack) rather than to `anchorScreenY`'s fixed 80%-down position,
 * so the default view doesn't waste the gap between the ground and the
 * bottom edge that anchoring there would leave. At the floor zoom this
 * computes, that also puts the top item exactly at panBoundsY's own top
 * margin - the two boundaries were calibrated together on purpose.
 */
export function fitVerticalCameraToItems(
  items: readonly { voterCount: number }[],
  viewportHeight: number,
  anchorScreenY: number,
): VerticalCamera {
  const zoomY = minZoomYForItems(items, viewportHeight);
  return {
    centerY: (viewportHeight - anchorScreenY) / zoomY,
    zoomY,
  };
}
