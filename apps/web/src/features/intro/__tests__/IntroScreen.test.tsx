import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IntroScreen, TRANSITION_MS } from "../IntroScreen";
import { useIntroStore } from "../introStore";

beforeEach(() => {
  useIntroStore.setState({ isOpen: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("IntroScreen", () => {
  it("shows the wordmark, tagline, explanation and a Start button", () => {
    render(<IntroScreen />);
    expect(screen.getByTestId("intro-screen")).toHaveTextContent("Better Than");
    expect(screen.getByTestId("intro-screen")).toHaveTextContent("Everyone's tier list.");
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });

  it("renders nothing once closed", () => {
    useIntroStore.setState({ isOpen: false });
    render(<IntroScreen />);
    expect(screen.queryByTestId("intro-screen")).not.toBeInTheDocument();
  });

  it("shows a loading indicator in place of Start while the exit transition runs, then closes", () => {
    vi.useFakeTimers();
    render(<IntroScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.queryByRole("button", { name: "Start" })).not.toBeInTheDocument();
    expect(screen.getByTestId("intro-loading-indicator")).toBeInTheDocument();
    // Still mounted (mid-transition), not gone yet.
    expect(screen.getByTestId("intro-screen")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TRANSITION_MS);
    });
    expect(useIntroStore.getState().isOpen).toBe(false);
  });

  it("does not break if Start is clicked again immediately, before the transition settles", () => {
    vi.useFakeTimers();
    render(<IntroScreen />);

    const startButton = screen.getByRole("button", { name: "Start" });
    fireEvent.click(startButton);
    // The button is already replaced by the loading indicator (see above),
    // so a second click has nothing left to click - reproduces the manual
    // test guide's "press Start immediately, before the animation settles"
    // by firing the same click event twice in a row regardless.
    fireEvent.click(startButton);

    act(() => {
      vi.advanceTimersByTime(TRANSITION_MS);
    });
    expect(useIntroStore.getState().isOpen).toBe(false);
  });

  it("resets to its initial state when reopened (e.g. via the '?' button), rather than reappearing mid-exit", () => {
    vi.useFakeTimers();
    render(<IntroScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    act(() => {
      vi.advanceTimersByTime(TRANSITION_MS);
    });
    expect(screen.queryByTestId("intro-screen")).not.toBeInTheDocument();

    act(() => {
      useIntroStore.getState().open();
    });
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(screen.queryByTestId("intro-loading-indicator")).not.toBeInTheDocument();
  });
});
