import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { TRANSITION_MS } from "../features/intro/IntroScreen";
import { useIntroStore } from "../features/intro/introStore";

beforeEach(() => {
  useIntroStore.setState({ isOpen: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("App", () => {
  it("renders the world viewport with its axis and zero fulcrum", () => {
    render(<App />);
    expect(screen.getByTestId("world-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("world-axis")).toBeInTheDocument();
    expect(screen.getByTestId("world-fulcrum")).toBeInTheDocument();
  });

  it("shows the intro screen first, on top of the (already-rendered) map", () => {
    render(<App />);
    expect(screen.getByTestId("intro-screen")).toBeInTheDocument();
  });

  it("closes the intro screen after pressing Start, revealing the map underneath", () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    act(() => {
      // Advances by exactly the intro's own transition, not runAllTimers -
      // WorldViewport's living-world simulation is also mounted here with
      // its own recurring setInterval, which runAllTimers would spin on
      // forever.
      vi.advanceTimersByTime(TRANSITION_MS);
    });

    expect(screen.queryByTestId("intro-screen")).not.toBeInTheDocument();
    expect(screen.getByTestId("world-viewport")).toBeInTheDocument();
  });
});
