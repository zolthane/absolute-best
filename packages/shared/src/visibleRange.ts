export interface ScoredItem {
  score: number;
}

/**
 * Keeps only items whose score falls within [minScore, maxScore]. The
 * caller decides how wide that range is - WorldViewport pads it beyond
 * the exact pixel edges of the screen, the same way batch 1 buffers tick
 * marks, so a pan never reveals a gap before new items have a chance to
 * render.
 */
export function filterByVisibleRange<T extends ScoredItem>(
  items: readonly T[],
  minScore: number,
  maxScore: number,
): T[] {
  return items.filter((item) => item.score >= minScore && item.score <= maxScore);
}
