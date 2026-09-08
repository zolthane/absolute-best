import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
