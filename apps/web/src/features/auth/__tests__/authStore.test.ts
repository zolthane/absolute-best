import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../authStore";

const USERNAME_STORAGE_KEY = "teeter-username";

beforeEach(() => {
  window.localStorage.clear();
  useAuthStore.setState({ username: null });
});

describe("useAuthStore", () => {
  it("starts logged out when localStorage has no session", () => {
    expect(useAuthStore.getState().username).toBeNull();
  });

  it("logging in stores a session in localStorage and updates state", () => {
    useAuthStore.getState().login("Alice");

    expect(useAuthStore.getState().username).toBe("Alice");
    expect(window.localStorage.getItem(USERNAME_STORAGE_KEY)).toBe("Alice");
  });

  it("logging out removes the session from localStorage and clears state", () => {
    useAuthStore.getState().login("Alice");

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().username).toBeNull();
    expect(window.localStorage.getItem(USERNAME_STORAGE_KEY)).toBeNull();
  });

  it("a session already in localStorage is picked up when the store is created", async () => {
    window.localStorage.setItem(USERNAME_STORAGE_KEY, "Bob");

    // The store only reads localStorage once, at module load - reimport it
    // fresh (as a real page load would) to prove that initial read works.
    vi.resetModules();
    const { useAuthStore: freshAuthStore } = await import("../authStore");

    expect(freshAuthStore.getState().username).toBe("Bob");
  });
});
