import { type Camera, clampZoom } from "./camera";
import { displayScore } from "./displayScore";
import type { ScoredItem } from "./visibleRange";

// Used when there is no data at all (or, in the real product, before it has
// loaded) - wide enough to look like a world, not a single point. In the
// same units as displayScore (roughly +-MAX_VOTE_MAGNITUDE), not raw score.
const FALLBACK_MIN_X = -10;
const FALLBACK_MAX_X = 10;

// "Fit the camera with 5% padding" (build checklist, batch 4): each edge
// keeps a 5% margin, so the outermost items sit just inside the frame
// rather than flush against it.
const EDGE_PADDING_RATIO = 0.05;

// A guard against a zero-width view when every item displays at the same X
// (or there is only one item) - arbitrary but reasonable: wide enough that
// a single dot doesn't fill the screen edge-to-edge.
const MIN_FIT_RANGE = 2;

/**
 * Fits a camera to show every item's displayed X position (see
 * displayScore.ts) with a small margin - the "arrive and see the whole
 * world" entry view (product spec, batch 4). Falls back to a fixed range
 * when there is no data.
 */
export function fitCameraToItems<T extends ScoredItem>(
  items: readonly T[],
  viewportWidth: number,
): Camera {
  const positions = items.map((item) => displayScore(item));
  const minX = positions.length > 0 ? Math.min(...positions) : FALLBACK_MIN_X;
  const maxX = positions.length > 0 ? Math.max(...positions) : FALLBACK_MAX_X;

  const range = Math.max(maxX - minX, MIN_FIT_RANGE);
  const paddedRange = range * (1 + 2 * EDGE_PADDING_RATIO);

  return {
    center: (minX + maxX) / 2,
    zoom: clampZoom(viewportWidth / paddedRange),
  };
}
