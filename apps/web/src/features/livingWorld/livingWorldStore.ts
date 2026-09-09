import { springSettleProgress } from "@teeter/shared";
import { create } from "zustand";
import { type Item, mockItems } from "../../data/mockItems";
import { useEntriesStore } from "../entries/entriesStore";
import { effectiveItem, useVoteStore } from "../vote/voteStore";

// How often a simulated "someone else just voted" event fires.
const SIMULATION_INTERVAL_MS = 3500;
// Gentler than a real vote's full +-10 (rule R4) - meant to read as
// background drift, not another dramatic vote landing every few seconds.
const MAX_SIMULATED_VOTE_MAGNITUDE = 5;
// Matches voteStore's own SETTLE_ANIMATION_MS, so a simulated vote settles
// with the same feel as a real one - both reuse springSettleProgress (W2).
const SETTLE_ANIMATION_MS = 300;

interface LivingWorldState {
  // itemId -> cumulative score change from every simulated vote it's had.
  driftScores: Record<string, number>;
  // itemId -> cumulative voter-count increase from simulated votes.
  driftVoterCounts: Record<string, number>;
  // itemId -> the live animated score while its settle animation from a
  // simulated vote is still running - same shape as voteStore's
  // settlingScores, kept separate so a real vote and a simulated one can
  // never contend over the same field.
  settlingDrift: Record<string, number>;
  // itemId -> the live animated voter count over that same settle window -
  // same reasoning as voteStore's settlingVoterCounts: a vote moves an item
  // both sideways (score) and upward (voter count), so both need to ease in
  // together or the item only ever appears to slide sideways.
  settlingDriftVoterCounts: Record<string, number>;
  intervalId: ReturnType<typeof setInterval> | null;
  start: () => void;
  stop: () => void;
}

/**
 * The item as it should actually be displayed once simulated background
 * votes are accounted for, on top of whatever effectiveItem (real votes)
 * already produced - the same "layer on top, never mutate the original"
 * shape voteStore's own effectiveItem uses.
 */
export function applyDrift(
  item: Item,
  driftScores: Record<string, number>,
  driftVoterCounts: Record<string, number>,
  settlingDrift: Record<string, number>,
  settlingDriftVoterCounts: Record<string, number> = {},
): Item {
  const delta = driftScores[item.id];
  if (delta === undefined) {
    return item;
  }
  const settlingScore = settlingDrift[item.id];
  const settlingVoterCount = settlingDriftVoterCounts[item.id];
  return {
    ...item,
    score: settlingScore ?? item.score + delta,
    voterCount: settlingVoterCount ?? item.voterCount + (driftVoterCounts[item.id] ?? 0),
  };
}

// The full current item set (real data plus anything added via a link),
// with real votes applied - what a simulated vote needs to pick a target
// and read its current score/voter count from. Called fresh on every tick
// rather than captured once, so it always reflects the latest state.
function currentItemsWithRealVotesApplied(): Item[] {
  const { votes, settlingScores, settlingVoterCounts } = useVoteStore.getState();
  const entries = Object.values(useEntriesStore.getState().itemsByIdentifier);
  return [...mockItems, ...entries].map((item) =>
    effectiveItem(item, votes, settlingScores, settlingVoterCounts),
  );
}

export const useLivingWorldStore = create<LivingWorldState>((set, get) => ({
  driftScores: {},
  driftVoterCounts: {},
  settlingDrift: {},
  settlingDriftVoterCounts: {},
  intervalId: null,

  start: () => {
    // Guards against stacking a second interval if start() is called again
    // while one is already running - the same "a stopped timer that keeps
    // running" family of bug, just approached from the other direction.
    if (get().intervalId !== null) {
      return;
    }

    const intervalId = setInterval(() => {
      const state = get();
      const itemsBeforeThisVote = applyPriorDrift(
        currentItemsWithRealVotesApplied(),
        state.driftScores,
        state.driftVoterCounts,
        state.settlingDrift,
      );
      const target = itemsBeforeThisVote[Math.floor(Math.random() * itemsBeforeThisVote.length)];
      if (!target) {
        return;
      }

      let delta = Math.round((Math.random() * 2 - 1) * MAX_SIMULATED_VOTE_MAGNITUDE);
      if (delta === 0) {
        // A "vote" that changes nothing isn't a convincing bit of "someone
        // just voted" life - nudge it to the smallest real move instead.
        delta = Math.random() < 0.5 ? -1 : 1;
      }
      // Captured in its own binding (not read as target.id below) so
      // TypeScript can keep treating it as defined inside the step()
      // closure, which control-flow narrowing from the `if (!target)`
      // guard above doesn't reach into.
      const targetId = target.id;
      const scoreBeforeVote = target.score;
      const voterCountBeforeVote = target.voterCount;

      set((current) => ({
        driftScores: {
          ...current.driftScores,
          [targetId]: (current.driftScores[targetId] ?? 0) + delta,
        },
        driftVoterCounts: {
          ...current.driftVoterCounts,
          [targetId]: (current.driftVoterCounts[targetId] ?? 0) + 1,
        },
      }));

      // Batch 7's other accessibility requirement, reused here: move
      // directly, with no spring, rather than skipping the drift entirely -
      // the score/voter-count change above already happened.
      const prefersReducedMotion =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        return;
      }

      const toScore = scoreBeforeVote + delta;
      const toVoterCount = voterCountBeforeVote + 1;
      set((current) => ({
        settlingDrift: { ...current.settlingDrift, [targetId]: scoreBeforeVote },
        settlingDriftVoterCounts: {
          ...current.settlingDriftVoterCounts,
          [targetId]: voterCountBeforeVote,
        },
      }));
      const startTime = performance.now();

      function step(now: number) {
        const t = (now - startTime) / SETTLE_ANIMATION_MS;
        if (t >= 1) {
          set((current) => {
            const nextSettlingDrift = { ...current.settlingDrift };
            delete nextSettlingDrift[targetId];
            const nextSettlingDriftVoterCounts = { ...current.settlingDriftVoterCounts };
            delete nextSettlingDriftVoterCounts[targetId];
            return {
              settlingDrift: nextSettlingDrift,
              settlingDriftVoterCounts: nextSettlingDriftVoterCounts,
            };
          });
          return;
        }
        const progress = springSettleProgress(t, voterCountBeforeVote);
        const currentScore = scoreBeforeVote + (toScore - scoreBeforeVote) * progress;
        const currentVoterCount =
          voterCountBeforeVote + (toVoterCount - voterCountBeforeVote) * progress;
        set((current) => ({
          settlingDrift: { ...current.settlingDrift, [targetId]: currentScore },
          settlingDriftVoterCounts: {
            ...current.settlingDriftVoterCounts,
            [targetId]: currentVoterCount,
          },
        }));
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, SIMULATION_INTERVAL_MS);

    set({ intervalId });
  },

  stop: () => {
    const { intervalId } = get();
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
    set({ intervalId: null });
  },
}));

function applyPriorDrift(
  items: Item[],
  driftScores: Record<string, number>,
  driftVoterCounts: Record<string, number>,
  settlingDrift: Record<string, number>,
): Item[] {
  return items.map((item) => applyDrift(item, driftScores, driftVoterCounts, settlingDrift));
}
