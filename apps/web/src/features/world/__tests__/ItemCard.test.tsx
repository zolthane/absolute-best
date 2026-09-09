import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Item } from "../../../data/mockItems";
import { ItemCard } from "../ItemCard";

const item: Item = {
  id: "a",
  title: "Alpha",
  score: 10,
  voterCount: 500,
  order: 0,
  tags: ["Drama"],
};

describe("ItemCard", () => {
  it("appears above the dot when there is enough room", () => {
    render(<ItemCard item={item} screenX={500} screenY={400} />);
    const transform = screen.getByTestId("item-card").style.transform;
    expect(transform).toContain("-100%");
  });

  it("flips below the dot when it sits too close to the top of the screen", () => {
    // A high-voter-count item's dot can end up here - the bug this guards
    // against: the card used to always render above, getting clipped by
    // the viewport edge.
    render(<ItemCard item={item} screenX={500} screenY={50} />);
    const transform = screen.getByTestId("item-card").style.transform;
    expect(transform).not.toContain("-100%");
  });

  describe("shared cell / alternates", () => {
    it("shows nothing when the cell has no other members", () => {
      render(<ItemCard item={item} screenX={500} screenY={400} alternates={[]} />);
      expect(screen.queryByTestId("item-card-alternates")).not.toBeInTheDocument();
    });

    it("lists the cell's other members and lets you pick one", () => {
      const onSelectAlternate = vi.fn();
      render(
        <ItemCard
          item={item}
          screenX={500}
          screenY={400}
          alternates={[
            { id: "b", title: "Beta" },
            { id: "c", title: "Gamma" },
          ]}
          onSelectAlternate={onSelectAlternate}
        />,
      );
      expect(screen.getByTestId("item-card-alternates")).toHaveTextContent("2 more");
      fireEvent.click(screen.getByRole("button", { name: "Beta" }));
      expect(onSelectAlternate).toHaveBeenCalledWith("b");
    });
  });

  describe("vote (batch 7)", () => {
    it("shows no vote preview or Submit button when not voting", () => {
      render(<ItemCard item={item} screenX={500} screenY={400} />);
      expect(screen.queryByTestId("vote-preview")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("previews the projected score while dragging, without a Submit button yet", () => {
      render(
        <ItemCard
          item={item}
          screenX={500}
          screenY={400}
          vote={{ delta: 7, isPending: false, onSubmit: vi.fn() }}
        />,
      );
      expect(screen.getByTestId("vote-preview")).toHaveTextContent("10 → 17");
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows a Submit button with the signed delta once released (rule R9)", () => {
      const onSubmit = vi.fn();
      render(
        <ItemCard
          item={item}
          screenX={500}
          screenY={400}
          vote={{ delta: 7, isPending: true, onSubmit }}
        />,
      );

      const button = screen.getByRole("button", { name: /submit vote: \+7/i });
      fireEvent.click(button);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("signs a negative vote correctly, without a double minus", () => {
      render(
        <ItemCard
          item={item}
          screenX={500}
          screenY={400}
          vote={{ delta: -3, isPending: true, onSubmit: vi.fn() }}
        />,
      );
      expect(screen.getByRole("button")).toHaveTextContent("Submit vote: -3");
    });
  });
});
