export interface PassableItem {
  id: string;
  score: number;
  voterCount: number;
}

/**
 * The single item a vote would cause `votingItem` to pass on the score axis
 * - among every OTHER item whose score now falls between the old and new
 * score, the one whose voter count is closest to votingItem's own.
 *
 * Only one is ever returned, deliberately: the busy middle of the map can
 * put many items in that range, at wildly different voter counts, and
 * naming all of them (or an arbitrary one) is either overwhelming or
 * meaningless. Picking the closest peer by popularity gives a comparison
 * that actually means something. Ties are broken by whichever comes first
 * in `allItems`.
 *
 * Returns null when there is nothing to report: no vote (`delta` 0), or
 * nothing lying between the old and new score.
 */
export function findPassedItem<T extends PassableItem>(
  votingItem: T,
  delta: number,
  allItems: readonly T[],
): T | null {
  if (delta === 0) {
    return null;
  }

  const oldScore = votingItem.score;
  const newScore = oldScore + delta;

  let closest: T | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const item of allItems) {
    if (item.id === votingItem.id) {
      continue;
    }
    const isPassed =
      delta > 0
        ? item.score > oldScore && item.score <= newScore
        : item.score < oldScore && item.score >= newScore;
    if (!isPassed) {
      continue;
    }
    const distance = Math.abs(item.voterCount - votingItem.voterCount);
    if (distance < closestDistance) {
      closest = item;
      closestDistance = distance;
    }
  }

  return closest;
}
