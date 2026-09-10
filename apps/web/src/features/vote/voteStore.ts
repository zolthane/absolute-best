import { springSettleProgress } from "@teeter/shared";
import { create } from "zustand";
import type { Item } from "../../data/mockItems";

// How long the weighted-settle animation (product spec 9.2, decision W2)
// takes to finish, once Submit is pressed.
const SETTLE_ANIMATION_MS = 300;

interface VoteState {
  // itemId -> the committed vote (whole number, -10..10). Rule R3: a vote is
  // immutable, so this only ever gains entries, never changes or removes one.
  votes: Record<string, number>;
  // itemId -> the item's animated score while its settle animation is still
  // running. Present only for the (at most one, in Stage 0) item currently
  // mid-animation; absent otherwise, including once it finishes.
  settlingScores: Record<string, number>;
  // itemId -> the item's animated voter count over the same window as
  // settlingScores. A vote moves an item both sideways (score) and upward
  // (voter count, on the log-scaled Y axis) - without this, voter count
  // jumped to its final value instantly while score eased in, so the item
  // only ever appeared to slide sideways.
  settlingVoterCounts: Record<string, number>;
  hasVoted: (itemId: string) => boolean;
  // `scoreBeforeVote`/`voterCountBeforeVote` are supplied by the caller
  // rather than looked up here - this store holds only the vote itself, not
  // a copy of the item data (see effectiveItem, which combines the two for
  // rendering).
  castVote: (
    itemId: string,
    scoreBeforeVote: number,
    voterCountBeforeVote: number,
    delta: number,
  ) => void;
}

export const useVoteStore = create<VoteState>((set, get) => ({
  votes: {},
  settlingScores: {},
  settlingVoterCounts: {},

  hasVoted: (itemId) => get().votes[itemId] !== undefined,

  castVote: (itemId, scoreBeforeVote, voterCountBeforeVote, delta) => {
    set((state) => ({ votes: { ...state.votes, [itemId]: delta } }));

    // Batch 7's other accessibility requirement: move directly, with no
    // spring, rather than skipping the requirement entirely - votes is
    // already updated above, so there is nothing left to animate.
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    const toScore = scoreBeforeVote + delta;
    const toVoterCount = voterCountBeforeVote + 1;
    // Set synchronously (rather than waiting for the first animation frame)
    // so the very next render already shows the start position instead of
    // the item's finished, post-vote score flashing up for one frame first.
    set((state) => ({
      settlingScores: { ...state.settlingScores, [itemId]: scoreBeforeVote },
      settlingVoterCounts: { ...state.settlingVoterCounts, [itemId]: voterCountBeforeVote },
    }));
    const startTime = performance.now();

    function step(now: number) {
      const t = (now - startTime) / SETTLE_ANIMATION_MS;
      if (t >= 1) {
        set((state) => {
          const nextSettlingScores = { ...state.settlingScores };
          delete nextSettlingScores[itemId];
          const nextSettlingVoterCounts = { ...state.settlingVoterCounts };
          delete nextSettlingVoterCounts[itemId];
          return {
            settlingScores: nextSettlingScores,
            settlingVoterCounts: nextSettlingVoterCounts,
          };
        });
        return;
      }
      const progress = springSettleProgress(t, voterCountBeforeVote);
      const currentScore = scoreBeforeVote + (toScore - scoreBeforeVote) * progress;
      const currentVoterCount =
        voterCountBeforeVote + (toVoterCount - voterCountBeforeVote) * progress;
      set((state) => ({
        settlingScores: { ...state.settlingScores, [itemId]: currentScore },
        settlingVoterCounts: { ...state.settlingVoterCounts, [itemId]: currentVoterCount },
      }));
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  },
}));

/**
 * The item as it should actually be rendered: its real data, unless a vote
 * has been cast on it, in which case the score and voter count reflect that
 * vote - either its final committed value, or its live position mid-settle-
 * animation. Item objects themselves are never mutated (mockItems.ts stays
 * the single source of the "as generated" data); this combines the two only
 * at render time.
 */
export function effectiveItem(
  item: Item,
  votes: Record<string, number>,
  settlingScores: Record<string, number>,
  settlingVoterCounts: Record<string, number> = {},
): Item {
  const delta = votes[item.id];
  if (delta === undefined) {
    return item;
  }
  const settlingScore = settlingScores[item.id];
  const settlingVoterCount = settlingVoterCounts[item.id];
  return {
    ...item,
    score: settlingScore ?? item.score + delta,
    voterCount: settlingVoterCount ?? item.voterCount + 1,
  };
}
