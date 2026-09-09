import { describe, expect, it } from "vitest";
import { type SearchableItem, searchItems } from "../searchItems";

const item = (id: string, title: string): SearchableItem => ({ id, title });

const items: SearchableItem[] = [
  item("a", "Silent Elephant"),
  item("b", "The Crimson Compass"),
  item("c", "Captain Ashworth"),
];

describe("searchItems", () => {
  it("matches a partial word", () => {
    expect(searchItems(items, "sil")).toEqual([items[0]]);
  });

  it("matches a substring anywhere in the title, not just the start", () => {
    expect(searchItems(items, "phant")).toEqual([items[0]]);
  });

  it("does not care about capitalisation", () => {
    expect(searchItems(items, "SILENT")).toEqual([items[0]]);
    expect(searchItems(items, "silent")).toEqual([items[0]]);
  });

  it("returns nothing for a query matching no title", () => {
    expect(searchItems(items, "zzzzz")).toEqual([]);
  });

  it("returns nothing for an empty or whitespace-only query", () => {
    expect(searchItems(items, "")).toEqual([]);
    expect(searchItems(items, "   ")).toEqual([]);
  });

  it("caps the number of results", () => {
    const manyItems: SearchableItem[] = Array.from({ length: 20 }, (_, index) =>
      item(`item-${index}`, `Common Title ${index}`),
    );
    expect(searchItems(manyItems, "common").length).toBe(8);
  });

  it("can match more than one item", () => {
    expect(searchItems(items, "a").map((result) => result.id)).toEqual(["a", "b", "c"]);
  });
});
