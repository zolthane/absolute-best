import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Item } from "../../../data/mockItems";
import { useEntriesStore } from "../../entries/entriesStore";
import { useVoteStore } from "../../vote/voteStore";
import { applyDrift, SIMULATION_INTERVAL_MS, useLivingWorldStore } from "../livingWorldStore";

beforeEach(() => {
  useLivingWorldStore.setState({
    driftScores: {},
    driftVoterCounts: {},
    settlingDrift: {},
    settlingDriftVoterCounts: {},
  });
  useVoteStore.setState({ votes: {}, settlingScores: {}, settlingVoterCounts: {} });
  useEntriesStore.setState({ itemsByIdentifier: {} });
  vi.useFakeTimers();
  // The settle animation's own requestAnimationFrame loop is not what these
  // tests are about (and, per the project's established jsdom hazard,
  // real timestamps never line up under fake timers either) - mocked to a
  // no-op, same as voteStore's own tests.
  vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(() => 0);
});

afterEach(() => {
  useLivingWorldStore.getState().stop();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("applyDrift", () => {
  const item: Item = { id: "a", title: "Alpha", score: 20, voterCount: 100, order: 0, tags: [] };

  it("returns the item unchanged when it has no drift", () => {
    expect(applyDrift(item, {}, {}, {})).toEqual(item);
  });

  it("applies accumulated drift to score and voter count", () => {
    const result = applyDrift(item, { a: 6 }, { a: 3 }, {});
    expect(result.score).toBe(26);
    expect(result.voterCount).toBe(103);
  });

  it("uses the live settling score in place of the final one while mid-animation", () => {
    const result = applyDrift(item, { a: 6 }, { a: 3 }, { a: 23 });
    expect(result.score).toBe(23);
    expect(result.voterCount).toBe(103);
  });

  it("uses the live settling voter count in place of the final one while mid-animation", () => {
    const result = applyDrift(item, { a: 6 }, { a: 3 }, { a: 23 }, { a: 101.5 });
    expect(result.score).toBe(23);
    expect(result.voterCount).toBe(101.5);
  });

  it("never mutates the original item", () => {
    const original = { ...item };
    applyDrift(item, { a: 6 }, { a: 3 }, {});
    expect(item).toEqual(original);
  });
});

describe("useLivingWorldStore", () => {
  it("does nothing until start() is called", () => {
    vi.advanceTimersByTime(60_000);
    expect(useLivingWorldStore.getState().driftScores).toEqual({});
  });

  it("simulates a vote on some item after start()", () => {
    useLivingWorldStore.getState().start();
    vi.advanceTimersByTime(SIMULATION_INTERVAL_MS);

    const state = useLivingWorldStore.getState();
    expect(Object.keys(state.driftScores)).toHaveLength(1);
    expect(Object.keys(state.driftVoterCounts)).toHaveLength(1);
    // Exactly one simulated vote happened - voter count only ever rises by
    // whole votes.
    expect(Object.values(state.driftVoterCounts)[0]).toBe(1);
  });

  it("stops cleanly: no further changes happen once stopped", () => {
    useLivingWorldStore.getState().start();
    vi.advanceTimersByTime(SIMULATION_INTERVAL_MS);
    const afterFirstTick = useLivingWorldStore.getState().driftScores;

    useLivingWorldStore.getState().stop();
    vi.advanceTimersByTime(60_000);

    expect(useLivingWorldStore.getState().driftScores).toEqual(afterFirstTick);
  });

  it("does not stack a second interval if start() is called again while running", () => {
    useLivingWorldStore.getState().start();
    useLivingWorldStore.getState().start();
    vi.advanceTimersByTime(SIMULATION_INTERVAL_MS);

    // A stacked second interval would cause two simulated votes (across
    // however many items they land on) in the same tick instead of one.
    const totalVotesSimulated = Object.values(
      useLivingWorldStore.getState().driftVoterCounts,
    ).reduce((sum, count) => sum + count, 0);
    expect(totalVotesSimulated).toBe(1);
  });

  it("keeps voter-count drift within sensible bounds over many ticks - it only ever rises", () => {
    useLivingWorldStore.getState().start();
    for (let i = 0; i < 50; i++) {
      vi.advanceTimersByTime(SIMULATION_INTERVAL_MS);
    }

    const state = useLivingWorldStore.getState();
    for (const count of Object.values(state.driftVoterCounts)) {
      expect(count).toBeGreaterThan(0);
      expect(Number.isFinite(count)).toBe(true);
    }
    for (const score of Object.values(state.driftScores)) {
      expect(Number.isFinite(score)).toBe(true);
    }
  });
});
