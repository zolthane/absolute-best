import { resolveLink } from "@teeter/shared";
import { create } from "zustand";
import type { Item } from "../../data/mockItems";

// Comfortably past mockItems.ts's own 500 - order breaks a tie by "oldest
// wins" (product spec Q3b), and every added entry should lose that tie to
// any pre-existing item, never win it by coincidence.
const NEW_ENTRY_ORDER_BASE = 1_000_000;

interface EntriesState {
  // Keyed by resolveLink's identifier, not the item's own id - this is what
  // makes "paste the same link twice" find the existing item instead of
  // creating a second one.
  itemsByIdentifier: Record<string, Item>;
  // Session-only, like votes (see voteStore.ts): nothing here survives a
  // refresh. Stage 0 has no server to persist it to.
  addEntry: (url: string) => Item;
}

let nextOrder = 0;

export const useEntriesStore = create<EntriesState>((set, get) => ({
  itemsByIdentifier: {},

  addEntry: (url) => {
    const { identifier, title } = resolveLink(url);
    const existing = get().itemsByIdentifier[identifier];
    if (existing) {
      return existing;
    }
    const item: Item = {
      id: `entry-${identifier}`,
      title,
      // Rule (batch 9): a new entry lands at score 0 with 0 voters.
      score: 0,
      voterCount: 0,
      order: NEW_ENTRY_ORDER_BASE + nextOrder++,
      // Stage 0 has no tagging pipeline for a freshly-added entry either
      // (see mockItems.ts's own tags comment) - an empty list, not invented
      // ones, since there's nothing to plausibly base them on.
      tags: [],
    };
    set((state) => ({
      itemsByIdentifier: { ...state.itemsByIdentifier, [identifier]: item },
    }));
    return item;
  },
}));
