import { describe, expect, it } from "vitest";
import { findPassedItem, type PassableItem } from "../passedItem";

const item = (id: string, score: number, voterCount: number): PassableItem => ({
  id,
  score,
  voterCount,
});

describe("findPassedItem", () => {
  it("returns null when the vote is zero", () => {
    const voting = item("a", 10, 50);
    const others = [item("b", 12, 50)];
    expect(findPassedItem(voting, 0, [voting, ...others])).toBeNull();
  });

  it("returns null when nothing lies between the old and new score", () => {
    const voting = item("a", 10, 50);
    const others = [item("b", 50, 50)];
    expect(findPassedItem(voting, 3, [voting, ...others])).toBeNull();
  });

  it("finds the one item passed when voting upward", () => {
    const voting = item("a", 10, 50);
    const others = [item("b", 12, 50)];
    expect(findPassedItem(voting, 5, [voting, ...others])?.id).toBe("b");
  });

  it("finds the one item passed when voting downward", () => {
    const voting = item("a", 10, 50);
    const others = [item("b", 8, 50)];
    expect(findPassedItem(voting, -5, [voting, ...others])?.id).toBe("b");
  });

  it("never returns the voting item itself", () => {
    const voting = item("a", 10, 50);
    expect(findPassedItem(voting, 5, [voting])).toBeNull();
  });

  it("picks the item closest in voter count when several are passed - the busy-middle case", () => {
    const voting = item("a", 10, 500);
    const others = [
      item("far-below", 12, 1),
      item("closest", 13, 480),
      item("far-above", 14, 100_000),
    ];
    expect(findPassedItem(voting, 5, [voting, ...others])?.id).toBe("closest");
  });

  it("includes an item landing exactly on the new score", () => {
    const voting = item("a", 10, 50);
    const others = [item("b", 15, 50)];
    expect(findPassedItem(voting, 5, [voting, ...others])?.id).toBe("b");
  });

  it("excludes an item sitting at the old score - it wasn't newly passed", () => {
    const voting = item("a", 10, 50);
    const others = [item("b", 10, 50)];
    expect(findPassedItem(voting, 5, [voting, ...others])).toBeNull();
  });
});
