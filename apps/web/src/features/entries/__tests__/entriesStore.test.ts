import { beforeEach, describe, expect, it } from "vitest";
import { useEntriesStore } from "../entriesStore";

beforeEach(() => {
  useEntriesStore.setState({ itemsByIdentifier: {} });
});

describe("entriesStore", () => {
  it("adds a new entry at score 0 with 0 voters", () => {
    const item = useEntriesStore.getState().addEntry("https://example.com/a");
    expect(item.score).toBe(0);
    expect(item.voterCount).toBe(0);
  });

  it("stores the new entry so it shows up in the list", () => {
    const item = useEntriesStore.getState().addEntry("https://example.com/a");
    expect(Object.values(useEntriesStore.getState().itemsByIdentifier)).toContainEqual(item);
  });

  it("returns the existing item, not a new one, for a link added before", () => {
    const first = useEntriesStore.getState().addEntry("https://example.com/a");
    const second = useEntriesStore.getState().addEntry("https://example.com/a");
    expect(second).toEqual(first);
    expect(Object.keys(useEntriesStore.getState().itemsByIdentifier)).toHaveLength(1);
  });

  it("creates a separate item for a different link", () => {
    const first = useEntriesStore.getState().addEntry("https://example.com/a");
    const second = useEntriesStore.getState().addEntry("https://example.com/b");
    expect(second.id).not.toBe(first.id);
    expect(Object.keys(useEntriesStore.getState().itemsByIdentifier)).toHaveLength(2);
  });
});
