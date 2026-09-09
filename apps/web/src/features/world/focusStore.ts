import { create } from "zustand";

// The focused item's id, lifted out of WorldViewport's own state (where it
// lived through batch 7) so that Search - a sibling component in TopBar,
// batch 8 - can focus an item too, without duplicating WorldViewport's own
// focus/vote-clearing logic. WorldViewport remains the only thing that ever
// reacts to this changing.
interface FocusState {
  focusedItemId: string | null;
  setFocusedItemId: (id: string | null) => void;
}

export const useFocusStore = create<FocusState>((set) => ({
  focusedItemId: null,
  setFocusedItemId: (id) => set({ focusedItemId: id }),
}));
