import { create } from "zustand";

interface IntroState {
  // Shown once on load, and reopened on demand via TopBar's "?" button
  // (product spec 2.3 / batch 11) - true by default so first load shows it
  // without any extra wiring.
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useIntroStore = create<IntroState>((set) => ({
  isOpen: true,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
