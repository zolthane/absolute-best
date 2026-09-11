// A vote is always -10..10 (MAX_VOTE_MAGNITUDE), but raw score is an
// unbounded running total - so voter count alone can put one item
// permanently out of another's reach on the map, no matter how strongly
// people feel about either (an item can never out-position a
// hundred-times-more-voted one just by being loved just as much). Damping
// by a constant number of phantom "neutral" votes fixes this: an item's
// on-screen X position reflects how convinced its voters are, not how many
// of them there have been, while still asymptoting toward the true average
// (bounded to +-MAX_VOTE_MAGNITUDE) as voterCount grows. The stored score
// itself is untouched - this only affects where an item is drawn.
export const DISPLAY_SCORE_DAMPING = 10;

export interface DisplayScoredItem {
  score: number;
  voterCount: number;
}

/**
 * An item's position on the map's X axis - a damped average of its votes,
 * not the raw sum. See DISPLAY_SCORE_DAMPING above for why.
 */
export function displayScore(item: DisplayScoredItem): number {
  return item.score / (item.voterCount + DISPLAY_SCORE_DAMPING);
}
