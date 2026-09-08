import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("App", () => {
  it("renders the Teeter heading, proving React, Vite and Vitest are wired up", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Teeter" })).toBeInTheDocument();
  });
});
