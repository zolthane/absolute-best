import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVoteStore } from "../../vote/voteStore";
import { useCameraStore } from "../../world/cameraStore";
import { useFocusStore } from "../../world/focusStore";
import { useEntriesStore } from "../entriesStore";
import { NewEntryDialog } from "../NewEntryDialog";

beforeEach(() => {
  useCameraStore.setState({
    camera: { center: 0, zoom: 4 },
    cameraY: { centerY: 0, zoomY: 100 },
    viewportWidth: 1000,
    viewportHeight: 800,
  });
  useFocusStore.setState({ focusedItemId: null });
  useEntriesStore.setState({ itemsByIdentifier: {} });
  useVoteStore.setState({ votes: {}, settlingScores: {}, settlingVoterCounts: {} });
  // animateTo is mocked for the same reason every other focus-triggering
  // test in this project mocks it: jsdom's requestAnimationFrame timestamps
  // never line up with performance.now(), so the real implementation would
  // loop forever.
  vi.spyOn(useCameraStore.getState(), "animateTo").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function openDialogAndSubmit(url: string) {
  fireEvent.click(screen.getByRole("button", { name: "New entry" }));
  const dialog = screen.getByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Link"), { target: { value: url } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
}

describe("NewEntryDialog", () => {
  it("does not submit with a blank link", () => {
    render(<NewEntryDialog />);
    fireEvent.click(screen.getByRole("button", { name: "New entry" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("adds a new item at score 0 with 0 voters and focuses it", () => {
    render(<NewEntryDialog />);
    openDialogAndSubmit("https://example.com/a");

    const items = Object.values(useEntriesStore.getState().itemsByIdentifier);
    expect(items).toHaveLength(1);
    expect(items[0]?.score).toBe(0);
    expect(items[0]?.voterCount).toBe(0);
    expect(useFocusStore.getState().focusedItemId).toBe(items[0]?.id);
  });

  it("closes and clears the link field after adding", () => {
    render(<NewEntryDialog />);
    openDialogAndSubmit("https://example.com/a");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "New entry" }));
    expect(screen.getByLabelText("Link")).toHaveValue("");
  });

  it("does not create a second item for the same link, and still focuses it", () => {
    render(<NewEntryDialog />);
    openDialogAndSubmit("https://example.com/a");
    const firstId = Object.values(useEntriesStore.getState().itemsByIdentifier)[0]?.id;

    useFocusStore.setState({ focusedItemId: null });
    openDialogAndSubmit("https://example.com/a");

    expect(Object.keys(useEntriesStore.getState().itemsByIdentifier)).toHaveLength(1);
    expect(useFocusStore.getState().focusedItemId).toBe(firstId);
  });

  it("creates a separate item for a different link", () => {
    render(<NewEntryDialog />);
    openDialogAndSubmit("https://example.com/a");
    openDialogAndSubmit("https://example.com/b");

    expect(Object.keys(useEntriesStore.getState().itemsByIdentifier)).toHaveLength(2);
  });

  it("aims the camera at the item's current position, not its stale starting score, when re-adding a link already voted on", () => {
    // Reported bug: re-adding an already-voted-on entry flew to score 0 (its
    // starting point when first added) instead of to where it actually sits
    // now - the raw entriesStore record is never updated by voting (votes
    // live separately, applied only at render time via effectiveItem), so
    // using it directly for the camera target used its stale, pre-vote score.
    // prefers-reduced-motion is stubbed to skip the settle animation, so the
    // vote's effective score is immediately final - see voteStore.test.ts's
    // identical use of this for the same reason (there's no clean way to let
    // a real settle animation finish in jsdom).
    vi.stubGlobal(
      "matchMedia",
      (query: string) => ({ matches: true, media: query }) as MediaQueryList,
    );
    render(<NewEntryDialog />);
    openDialogAndSubmit("https://example.com/a");
    const item = Object.values(useEntriesStore.getState().itemsByIdentifier)[0];
    expect(item).toBeDefined();
    if (!item) {
      throw new Error("expected an item to have been added");
    }
    useVoteStore.getState().castVote(item.id, item.score, item.voterCount, 7);

    const animateTo = vi.mocked(useCameraStore.getState().animateTo);
    animateTo.mockClear();
    openDialogAndSubmit("https://example.com/a");

    const [targetCamera] = animateTo.mock.calls[0] ?? [];
    expect(targetCamera?.center).toBe(7);
  });
});
