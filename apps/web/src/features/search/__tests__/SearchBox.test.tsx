import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCameraStore } from "../../world/cameraStore";
import { useFocusStore } from "../../world/focusStore";
import { SearchBox } from "../SearchBox";

beforeEach(() => {
  useCameraStore.setState({
    camera: { center: 0, zoom: 4 },
    cameraY: { centerY: 0, zoomY: 100 },
    viewportWidth: 1000,
    viewportHeight: 800,
  });
  useFocusStore.setState({ focusedItemId: null });
});

describe("SearchBox", () => {
  it("shows no results box until something is typed", () => {
    render(<SearchBox />);
    expect(screen.queryByTestId("search-results")).not.toBeInTheDocument();
  });

  it("matches a partial, case-insensitive query against the real mock data", () => {
    // Uses the real mockItems set (like WorldViewport's own tests do for a
    // handful of cases) rather than a fixture, specifically to prove search
    // and the map are looking at the same data - "Albert Einstein" is one of
    // the curated real-world titles mockItems.ts always includes.
    render(<SearchBox />);
    fireEvent.change(screen.getByLabelText("Search items"), { target: { value: "einstein" } });
    expect(screen.getByRole("button", { name: "Albert Einstein" })).toBeInTheDocument();
  });

  it("shows a polite message rather than a blank box for a nonsense query", () => {
    render(<SearchBox />);
    fireEvent.change(screen.getByLabelText("Search items"), { target: { value: "zzzzzznope" } });
    expect(screen.getByTestId("search-results")).toHaveTextContent("No matches found");
  });

  it("focuses the chosen item and clears the search on selection", () => {
    // animateTo is mocked for the same reason WorldViewport's own focus
    // tests mock it: jsdom's requestAnimationFrame timestamps never line up
    // with performance.now(), so the real implementation would loop forever.
    const animateTo = vi.spyOn(useCameraStore.getState(), "animateTo").mockImplementation(() => {});
    render(<SearchBox />);

    fireEvent.change(screen.getByLabelText("Search items"), { target: { value: "einstein" } });
    fireEvent.click(screen.getByRole("button", { name: "Albert Einstein" }));

    expect(animateTo).toHaveBeenCalledTimes(1);
    expect(useFocusStore.getState().focusedItemId).not.toBeNull();
    expect(screen.getByLabelText("Search items")).toHaveValue("");
    expect(screen.queryByTestId("search-results")).not.toBeInTheDocument();

    animateTo.mockRestore();
  });
});
