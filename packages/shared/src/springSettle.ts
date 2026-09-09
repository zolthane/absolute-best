// Product spec section 9.2 ("weighted settle", decision W2 - "yes, but keep
// it very subtle"): when a vote lands, the item does not glide to its new
// position at a constant speed - it moves like a weight on a spring,
// slightly overshooting before settling. How much it overshoots depends on
// how many people had already voted on it: a barely-known item lurches and
// wobbles, a well-established one barely twitches.

// The overshoot for a brand-new item (0 or 1 prior voters) - deliberately
// small ("very subtle"), not the bouncier defaults typically used for this
// easing shape.
const BASE_OVERSHOOT = 0.4;

/**
 * How far past its destination the settle animation swings before easing
 * back, given how many voters an item had *before* this vote. Divides down
 * smoothly as voter count grows rather than cutting off at a hard
 * threshold, so there is no visible "step" between two similar items.
 */
export function settleOvershoot(voterCountBeforeVote: number): number {
  return BASE_OVERSHOOT / (1 + Math.log10(Math.max(1, voterCountBeforeVote)));
}

// Robert Penner's "ease out back": eases toward 1, overshoots past it once,
// then settles back - `overshoot` of 0 degenerates to a plain ease with no
// overshoot at all.
function easeOutBack(t: number, overshoot: number): number {
  const shifted = t - 1;
  return 1 + (overshoot + 1) * shifted ** 3 + overshoot * shifted ** 2;
}

/**
 * The settle animation's progress at time `t` (0 to 1) - 0 at the start
 * position, 1 at the destination, briefly exceeding 1 (or dropping below 0
 * for a negative move) along the way for a low-voter-count item. Multiply
 * (destination - start) by this and add to start to get the animated value
 * at time t.
 */
export function springSettleProgress(t: number, voterCountBeforeVote: number): number {
  const clampedT = Math.min(1, Math.max(0, t));
  return easeOutBack(clampedT, settleOvershoot(voterCountBeforeVote));
}
