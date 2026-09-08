import { type Camera, clampZoom } from "./camera";
import type { ScoredItem } from "./visibleRange";

// Used when there is no data at all (or, in the real product, before it has
// loaded) - wide enough to look like a world, not a single point.
const FALLBACK_MIN_SCORE = -100;
const FALLBACK_MAX_SCORE = 100;

// "Fit the camera with 5% padding" (build checklist, batch 4): each edge
// keeps a 5% margin, so the outermost items sit just inside the frame
// rather than flush against it.
const EDGE_PADDING_RATIO = 0.05;

// A guard against a zero-width view when every item shares the same score
// (or there is only one item) - arbitrary but reasonable: wide enough that
// a single dot doesn't fill the screen edge-to-edge.
const MIN_FIT_RANGE = 20;

/**
 * Fits a camera to show every item's score with a small margin - the "arrive
 * and see the whole world" entry view (product spec, batch 4). Falls back to
 * a fixed -100..100 range when there is no data.
 */
export function fitCameraToItems<T extends ScoredItem>(
  items: readonly T[],
  viewportWidth: number,
): Camera {
  const scores = items.map((item) => item.score);
  const minScore = scores.length > 0 ? Math.min(...scores) : FALLBACK_MIN_SCORE;
  const maxScore = scores.length > 0 ? Math.max(...scores) : FALLBACK_MAX_SCORE;

  const range = Math.max(maxScore - minScore, MIN_FIT_RANGE);
  const paddedRange = range * (1 + 2 * EDGE_PADDING_RATIO);

  return {
    center: (minScore + maxScore) / 2,
    zoom: clampZoom(viewportWidth / paddedRange),
  };
}
