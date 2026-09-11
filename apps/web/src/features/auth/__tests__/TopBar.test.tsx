import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useIntroStore } from "../../intro/introStore";
import { useAuthStore } from "../authStore";
import { TopBar } from "../TopBar";

beforeEach(() => {
  window.localStorage.clear();
  useAuthStore.setState({ username: null });
  useIntroStore.setState({ isOpen: false });
});

describe("TopBar", () => {
  it("offers Login and Register when logged out", () => {
    render(<TopBar />);
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
  });

  it("hides New entry when logged out, and shows it once logged in (batch 9)", () => {
    render(<TopBar />);
    expect(screen.queryByRole("button", { name: "New entry" })).not.toBeInTheDocument();

    act(() => {
      useAuthStore.setState({ username: "Alice" });
    });
    expect(screen.getByRole("button", { name: "New entry" })).toBeInTheDocument();
  });

  it("registering with a username logs in and shows the username", () => {
    render(<TopBar />);

    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Username"), { target: { value: "Alice" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Register" }));

    expect(screen.getByTestId("username")).toHaveTextContent("Alice");
    expect(screen.queryByRole("button", { name: "Log in" })).not.toBeInTheDocument();
  });

  it("does not submit with a blank or whitespace-only username", () => {
    render(<TopBar />);

    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Username"), { target: { value: "   " } });

    expect(within(dialog).getByRole("button", { name: "Log in" })).toBeDisabled();
  });

  it("reopens the intro explanation via the '?' button (product spec 2.3)", () => {
    render(<TopBar />);
    expect(useIntroStore.getState().isOpen).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "How does this work?" }));

    expect(useIntroStore.getState().isOpen).toBe(true);
  });

  it("logging out returns to the logged-out state", () => {
    useAuthStore.setState({ username: "Alice" });
    render(<TopBar />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(screen.queryByTestId("username")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });
});
