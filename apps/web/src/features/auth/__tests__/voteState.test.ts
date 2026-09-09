import { describe, expect, it } from "vitest";
import { isItemVotable } from "../voteState";

describe("isItemVotable", () => {
  it("is locked for a logged-out visitor, regardless of vote history", () => {
    expect(isItemVotable(false, false)).toBe(false);
    expect(isItemVotable(false, true)).toBe(false);
  });

  it("is votable for a logged-in user who has not voted on it", () => {
    expect(isItemVotable(true, false)).toBe(true);
  });

  it("is locked for a logged-in user who has already voted on it", () => {
    expect(isItemVotable(true, true)).toBe(false);
  });
});
