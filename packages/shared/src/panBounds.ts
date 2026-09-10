// At most this fraction of the screen may be empty beyond the data, on a
// "soft" edge - one with no real domain boundary (a score can always be a
// little more extreme; there could always be a slightly more-voted item).
// This is the guardrail itself (batch 6b): pan or zoom out reveals some
// room past the data, never an unbounded sea of it. See panBoundsY for the
// one edge that isn't soft.
export const MAX_EMPTY_SCREEN_FRACTION = 0.25;

/**
 * How far camera.center may pan on the X axis before more than
 * MAX_EMPTY_SCREEN_FRACTION of the screen would be empty beyond the data,
 * on either side. Both sides are soft (see MAX_EMPTY_SCREEN_FRACTION), so
 * both get the same margin.
 *
 * Note this bounds `center` (the world-X value at the screen's *middle*),
 * not the data's own edge position - center sitting exactly at minScore
 * already means minScore's item is at the screen's middle, which is
 * already 50% empty to its left. To cap that at 25%, center has to stay
 * further from minScore than minScore itself, by that same margin.
 */
export function panBoundsX(
  minScore: number,
  maxScore: number,
  viewportWidth: number,
  zoom: number,
): { minCenter: number; maxCenter: number } {
  const margin = (viewportWidth * (0.5 - MAX_EMPTY_SCREEN_FRACTION)) / zoom;
  return { minCenter: minScore + margin, maxCenter: maxScore - margin };
}

/**
 * The Y-axis equivalent - but asymmetric, unlike X. Decreasing centerY
 * reveals emptiness below the ground (world-Y 0, 1 voter) at the bottom of
 * the screen; increasing centerY reveals emptiness above the top (the
 * most-voted item) at the top of the screen - so each direction gets its
 * own, differently-shaped bound.
 *
 * The bottom is a real domain boundary - there is no such thing as fewer
 * than 1 voter - so it gets zero slack, not a fractional margin: ground can
 * be dragged down to the very bottom edge of the screen, never past it
 * (`minCenterY`). The top has no such boundary - a more-voted item could
 * always arrive later - so it gets the same soft MAX_EMPTY_SCREEN_FRACTION
 * margin X uses (`maxCenterY`).
 *
 * minZoomYForItems (verticalEntryView.ts) calibrates the floor zoom so that
 * minCenterY and maxCenterY coincide exactly there - below that zoom this
 * pair would invert, which is why that floor exists.
 */
export function panBoundsY(
  maxWorldY: number,
  viewportHeight: number,
  anchorScreenY: number,
  zoomY: number,
): { minCenterY: number; maxCenterY: number } {
  const minCenterY = (viewportHeight - anchorScreenY) / zoomY;
  const maxCenterY =
    maxWorldY - (anchorScreenY - MAX_EMPTY_SCREEN_FRACTION * viewportHeight) / zoomY;
  return { minCenterY, maxCenterY };
}
