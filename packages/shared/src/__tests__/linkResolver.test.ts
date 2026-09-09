import { describe, expect, it } from "vitest";
import { resolveLink } from "../linkResolver";

describe("resolveLink", () => {
  it("is deterministic: the same link always resolves the same way", () => {
    const url = "https://example.com/some-article";
    expect(resolveLink(url)).toEqual(resolveLink(url));
  });

  it("treats leading/trailing whitespace as the same link", () => {
    const a = resolveLink("https://example.com/some-article");
    const b = resolveLink("  https://example.com/some-article  ");
    expect(a).toEqual(b);
  });

  it("gives different links different identifiers", () => {
    const a = resolveLink("https://example.com/a");
    const b = resolveLink("https://example.com/b");
    expect(a.identifier).not.toBe(b.identifier);
  });

  it("returns a non-empty title", () => {
    const { title } = resolveLink("https://example.com/anything");
    expect(title.trim().length).toBeGreaterThan(0);
  });

  it("produces a good spread of titles across many different links", () => {
    // Not a uniqueness guarantee (a small word bank can coincidentally
    // repeat) - just proof it isn't always returning the same title.
    const titles = new Set(
      Array.from({ length: 30 }, (_, index) => resolveLink(`https://example.com/${index}`).title),
    );
    expect(titles.size).toBeGreaterThan(1);
  });
});
