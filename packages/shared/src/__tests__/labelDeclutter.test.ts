import { describe, expect, it } from "vitest";
import { declutterLabels, type LabelCandidate } from "../labelDeclutter";

function candidate(overrides: Partial<LabelCandidate> & { id: string }): LabelCandidate {
  return {
    screenX: 0,
    screenY: 0,
    dotSizePx: 10,
    priority: 0,
    labelWidthPx: 40,
    labelHeightPx: 14,
    ...overrides,
  };
}

describe("declutterLabels", () => {
  it("shows every label when nothing is close enough to collide", () => {
    const candidates = [
      candidate({ id: "a", screenX: 0 }),
      candidate({ id: "b", screenX: 500 }),
      candidate({ id: "c", screenX: 1000 }),
    ];
    const shown = declutterLabels(candidates, candidates);
    expect(shown).toEqual(new Set(["a", "b", "c"]));
  });

  it("keeps the higher-priority label and drops the other when two would collide", () => {
    const low = candidate({ id: "low", screenX: 0, priority: 1 });
    const high = candidate({ id: "high", screenX: 5, priority: 100 });
    const shown = declutterLabels([low, high], [low, high]);

    expect(shown.has("high")).toBe(true);
    expect(shown.has("low")).toBe(false);
  });

  it("hides a label that would overlap a dot, even an unlabelled one", () => {
    const label = candidate({ id: "label", screenX: 0, screenY: 0 });
    // Sits right where "label"'s text would be drawn (just below its dot),
    // but is not itself a label candidate - e.g. a crowded, multi-item cell.
    const blockingDot = candidate({ id: "blocker", screenX: 0, screenY: 20, dotSizePx: 30 });

    const shown = declutterLabels([label, blockingDot], [label]);
    expect(shown.has("label")).toBe(false);
  });

  it("never hides a label because of its own dot", () => {
    const only = candidate({ id: "only" });
    expect(declutterLabels([only], [only])).toEqual(new Set(["only"]));
  });

  it("is deterministic and unaffected by candidate order", () => {
    const a = candidate({ id: "a", screenX: 0, priority: 1 });
    const b = candidate({ id: "b", screenX: 5, priority: 2 });
    const first = declutterLabels([a, b], [a, b]);
    const second = declutterLabels([b, a], [b, a]);
    expect(first).toEqual(second);
  });

  it("returns nothing for no candidates, rather than erroring", () => {
    expect(declutterLabels([], [])).toEqual(new Set());
  });
});
