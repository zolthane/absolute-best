import type { VerticalCamera } from "./verticalCamera";

// A guard against a zero-height range when every item has the same (or
// very few) voters - keeps a single dot from being asked to fill the
// whole screen, mirroring entryView.ts's MIN_FIT_RANGE.
const MIN_FIT_DECADES = 1;

// Only the top edge needs breathing room - the bottom of the range is the
// ground line itself, a real boundary rather than an arbitrary edge, so it
// does not need the same margin entryView.ts gives both edges of X.
const TOP_PADDING_RATIO = 0.1;

// How many screens tall the full voter-count range is by default, rather
// than always cramming it into exactly one (batch 6b: with ~500 items, one
// screen's worth of log-scaled height packed every label and dot together).
// Picked halfway between "2 or 3 screens" - cheap to retune once seen.
const ENTRY_ZOOM_MULTIPLIER = 2.5;

/**
 * The vertical zoom at which the whole voter-count range (1 voter to the
 * most-voted item) fits in one screen - the floor vertical zoom can never
 * go below, since there is nothing beyond the data to show. The same
 * reasoning fitCameraToItems uses for X's entry view.
 */
export function minZoomYForItems(
  items: readonly { voterCount: number }[],
  viewportHeight: number,
): number {
  const maxVoterCount = Math.max(1, ...items.map((item) => item.voterCount));
  const decades = Math.max(Math.log10(maxVoterCount), MIN_FIT_DECADES);
  return viewportHeight / (decades * (1 + TOP_PADDING_RATIO));
}

/**
 * The default vertical camera on arrival. Anchored at the ground (1 voter)
 * rather than centred the way X is - Y has no meaningful midpoint - and
 * zoomed in a little past the "whole world fits" floor so items have room
 * to breathe from the start instead of being packed into one screen.
 */
export function fitVerticalCameraToItems(
  items: readonly { voterCount: number }[],
  viewportHeight: number,
): VerticalCamera {
  return {
    centerY: 0,
    zoomY: minZoomYForItems(items, viewportHeight) * ENTRY_ZOOM_MULTIPLIER,
  };
}
