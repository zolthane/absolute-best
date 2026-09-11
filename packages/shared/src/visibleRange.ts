import { displayScore } from "./displayScore";

export interface ScoredItem {
  score: number;
  voterCount: number;
}

/**
 * Keeps only items whose displayed X position (see displayScore.ts) falls
 * within [minX, maxX]. The caller decides how wide that range is -
 * WorldViewport pads it beyond the exact pixel edges of the screen, the
 * same way batch 1 buffers tick marks, so a pan never reveals a gap before
 * new items have a chance to render.
 */
export function filterByVisibleRange<T extends ScoredItem>(
  items: readonly T[],
  minX: number,
  maxX: number,
): T[] {
  return items.filter((item) => {
    const x = displayScore(item);
    return x >= minX && x <= maxX;
  });
}
