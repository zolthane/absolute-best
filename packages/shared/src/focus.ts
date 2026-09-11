import { type Camera, clampZoom } from "./camera";
import { displayScore } from "./displayScore";
import type { ScoredItem } from "./visibleRange";

// Product spec, section 3: zoom settles so that roughly this many items on
// either side of the focused one are visible, giving it context.
const NEIGHBORS_PER_SIDE = 20;

// Guards against a zero-width (infinite zoom) view when the focused item has
// fewer than NEIGHBORS_PER_SIDE neighbours on both sides, or shares its
// exact displayed X with everyone nearby - arbitrary but reasonable,
// matching entryView's own guard for the same situation.
const MIN_HALF_WIDTH = 1;

/**
 * Centres the camera exactly on `target`'s displayed X position (see
 * displayScore.ts), at a zoom chosen so that roughly `NEIGHBORS_PER_SIDE`
 * items on each side (by that same position, not screen distance) are
 * visible - the "focus an item" camera move from the product spec,
 * section 3.
 */
export function computeFocusCamera<T extends ScoredItem>(
  target: T,
  allItems: readonly T[],
  viewportWidth: number,
): Camera {
  const targetX = displayScore(target);
  const sortedPositions = allItems.map((item) => displayScore(item)).sort((a, b) => a - b);
  const targetIndex = sortedPositions.indexOf(targetX);

  const leftIndex = Math.max(0, targetIndex - NEIGHBORS_PER_SIDE);
  const rightIndex = Math.min(sortedPositions.length - 1, targetIndex + NEIGHBORS_PER_SIDE);

  const leftX = sortedPositions[leftIndex] ?? targetX;
  const rightX = sortedPositions[rightIndex] ?? targetX;

  // The larger of the two sides decides the zoom, so both are guaranteed
  // visible even when the item sits near one end of the data (uneven
  // neighbour counts on each side).
  const halfWidth = Math.max(targetX - leftX, rightX - targetX, MIN_HALF_WIDTH);

  return {
    center: targetX,
    zoom: clampZoom(viewportWidth / (halfWidth * 2)),
  };
}
