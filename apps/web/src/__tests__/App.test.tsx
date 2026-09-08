import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("App", () => {
  it("renders the world viewport with its axis and zero fulcrum", () => {
    render(<App />);
    expect(screen.getByTestId("world-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("world-axis")).toBeInTheDocument();
    expect(screen.getByTestId("world-fulcrum")).toBeInTheDocument();
  });
});
