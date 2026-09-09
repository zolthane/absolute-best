import { create } from "zustand";

// A pretend session only - no real accounts, no passwords (docs/03-build-
// checklist.md, batch 6). Kept in localStorage so it survives a refresh but
// never leaves the visitor's own browser (docs/99-glossary.md).
const USERNAME_STORAGE_KEY = "teeter-username";

interface AuthState {
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  username: window.localStorage.getItem(USERNAME_STORAGE_KEY),

  login: (username) => {
    window.localStorage.setItem(USERNAME_STORAGE_KEY, username);
    set({ username });
  },

  logout: () => {
    window.localStorage.removeItem(USERNAME_STORAGE_KEY);
    set({ username: null });
  },
}));
