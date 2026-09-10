import { type Item, mockItems } from "../../data/mockItems";
import { useEntriesStore } from "../entries/entriesStore";
import { applyDrift, useLivingWorldStore } from "../livingWorld/livingWorldStore";
import { effectiveItem, useVoteStore } from "../vote/voteStore";

/**
 * The full, current item set - real mock data plus anything added via a
 * link, with any cast vote and any simulated background drift applied.
 * Callable from anywhere (not a hook - reads global store state directly),
 * used by Search and the "New entry" dialog, neither of which - unlike
 * WorldViewport - ever need to see a smaller, overridden set for testing.
 */
export function getFullEffectiveItems(): Item[] {
  const { votes, settlingScores, settlingVoterCounts } = useVoteStore.getState();
  const entries = Object.values(useEntriesStore.getState().itemsByIdentifier);
  const { driftScores, driftVoterCounts, settlingDrift, settlingDriftVoterCounts } =
    useLivingWorldStore.getState();
  return [...mockItems, ...entries]
    .map((item) => effectiveItem(item, votes, settlingScores, settlingVoterCounts))
    .map((item) =>
      applyDrift(item, driftScores, driftVoterCounts, settlingDrift, settlingDriftVoterCounts),
    );
}
