import { describe, expect, it, vi } from "vitest";
import { mockItems, REAL_WORLD_ITEMS } from "../mockItems";

describe("mockItems", () => {
  it("has no duplicate titles in the curated real-world pool", () => {
    const titles = REAL_WORLD_ITEMS.map((entry) => entry.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("uses every curated title exactly once, with no titles invented at runtime", () => {
    expect(mockItems).toHaveLength(REAL_WORLD_ITEMS.length);
    const mockTitles = new Set(mockItems.map((item) => item.title));
    const curatedTitles = new Set(REAL_WORLD_ITEMS.map((entry) => entry.title));
    expect(mockTitles).toEqual(curatedTitles);
  });

  it("gives every item exactly one real category as its tag", () => {
    for (const item of mockItems) {
      expect(item.tags).toHaveLength(1);
    }
  });

  it("is stable across runs (same seed, same titles in the same order)", async () => {
    vi.resetModules();
    const { mockItems: reloaded } = await import("../mockItems");
    expect(reloaded.map((item) => item.title)).toEqual(mockItems.map((item) => item.title));
  });
});
