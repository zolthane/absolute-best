import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Item } from "../../../data/mockItems";
import { effectiveItem, useVoteStore } from "../voteStore";

const item: Item = { id: "a", title: "Alpha", score: 20, voterCount: 5, order: 0, tags: [] };

beforeEach(() => {
  useVoteStore.setState({ votes: {}, settlingScores: {} });
  // requestAnimationFrame is never allowed to actually fire in these tests:
  // jsdom's rAF timestamps don't line up with performance.now() (see
  // cameraStore's own animateTo tests for the same issue), so a real
  // callback here would schedule itself forever and leak into later tests.
  vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(() => 0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("castVote", () => {
  it("records the vote and marks the item as voted", () => {
    useVoteStore.getState().castVote(item.id, item.score, item.voterCount, 7);
    expect(useVoteStore.getState().votes[item.id]).toBe(7);
    expect(useVoteStore.getState().hasVoted(item.id)).toBe(true);
  });

  it("does not mark an untouched item as voted", () => {
    expect(useVoteStore.getState().hasVoted("untouched")).toBe(false);
  });

  it("starts the settle animation at the item's pre-vote score", () => {
    useVoteStore.getState().castVote(item.id, item.score, item.voterCount, 7);
    // Set synchronously, before the first animation frame - see the
    // implementation comment for why this matters.
    expect(useVoteStore.getState().settlingScores[item.id]).toBe(item.score);
  });

  it("skips the settle animation entirely when prefers-reduced-motion is set", () => {
    vi.stubGlobal(
      "matchMedia",
      (query: string) => ({ matches: true, media: query }) as MediaQueryList,
    );
    useVoteStore.getState().castVote(item.id, item.score, item.voterCount, 7);

    expect(useVoteStore.getState().votes[item.id]).toBe(7);
    expect(useVoteStore.getState().settlingScores[item.id]).toBeUndefined();
  });
});

describe("effectiveItem", () => {
  it("returns the item unchanged when no vote has been cast on it", () => {
    expect(effectiveItem(item, {}, {})).toEqual(item);
  });

  it("applies the committed vote's score and voter-count change once settling has finished", () => {
    const result = effectiveItem(item, { [item.id]: 7 }, {});
    expect(result.score).toBe(27);
    expect(result.voterCount).toBe(6);
  });

  it("uses the live settling score in place of the final score while animating", () => {
    const result = effectiveItem(item, { [item.id]: 7 }, { [item.id]: 23 });
    expect(result.score).toBe(23);
    // Voter count already reflects the vote throughout the animation - only
    // the score position is what's animating.
    expect(result.voterCount).toBe(6);
  });

  it("never mutates the original item object", () => {
    const original = { ...item };
    effectiveItem(item, { [item.id]: 7 }, {});
    expect(item).toEqual(original);
  });
});
