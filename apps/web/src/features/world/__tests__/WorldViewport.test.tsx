import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Item } from "../../../data/mockItems";
import { useAuthStore } from "../../auth/authStore";
import { useEntriesStore } from "../../entries/entriesStore";
import { useVoteStore } from "../../vote/voteStore";
import { useCameraStore } from "../cameraStore";
import { useFocusStore } from "../focusStore";
import { WorldViewport } from "../WorldViewport";

// The exhaustive coordinate-maths correctness lives in packages/shared's own
// tests, run against plain functions. These tests only prove the component
// wires pointer events through to the camera store correctly.

beforeEach(() => {
  useCameraStore.setState({
    camera: { center: 0, zoom: 4 },
    cameraY: { centerY: 0, zoomY: 100 },
    viewportWidth: 1000,
    viewportHeight: 800,
  });
  useAuthStore.setState({ username: null });
  useVoteStore.setState({ votes: {}, settlingScores: {} });
  useFocusStore.setState({ focusedItemId: null });
  useEntriesStore.setState({ itemsByIdentifier: {} });
});

describe("WorldViewport", () => {
  it("renders the axis, the zero fulcrum, and at least one tick label", () => {
    render(<WorldViewport />);
    expect(screen.getByTestId("world-axis")).toBeInTheDocument();
    expect(screen.getByTestId("world-fulcrum")).toBeInTheDocument();
    expect(screen.getAllByTestId("world-tick").length).toBeGreaterThan(0);
  });

  it("positions the fulcrum at the screen location of world position 0", () => {
    render(<WorldViewport />);
    // camera is centred on 0, so world 0 sits at the horizontal centre.
    expect(screen.getByTestId("world-fulcrum")).toHaveStyle({ left: "500px" });
  });

  it("pans the camera by exactly the dragged distance on a single-pointer drag", () => {
    render(<WorldViewport />);
    const viewport = screen.getByTestId("world-viewport");

    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 500 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 460 });
    fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 460 });

    // Dragging 40px left must move world 0's screen position by exactly
    // -40px - the "does it track the mouse 1:1" property from batch 1's
    // manual test guide, verified here instead of by eye every time.
    expect(useCameraStore.getState().camera.center).toBeCloseTo(10, 9);
  });

  it("does not touch the camera store while a pan gesture is still in progress", () => {
    // This is the fix for reported panning lag: touching the store on every
    // pointermove forced a full React re-render per pixel of movement.
    render(<WorldViewport />);
    const viewport = screen.getByTestId("world-viewport");
    const before = useCameraStore.getState().camera;

    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 500 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 300 });

    expect(useCameraStore.getState().camera).toEqual(before);
  });

  it("previews an in-progress pan with a CSS transform instead", () => {
    render(<WorldViewport />);
    const viewport = screen.getByTestId("world-viewport");

    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 500 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 460 });

    expect(screen.getByTestId("world-content")).toHaveStyle({
      transform: "translate(-40px, 0px)",
    });
  });

  it("clears the preview transform once the gesture is committed", () => {
    render(<WorldViewport />);
    const viewport = screen.getByTestId("world-viewport");

    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 500 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 460 });
    fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 460 });

    expect(screen.getByTestId("world-content")).toHaveStyle({ transform: "none" });
  });

  it("ignores a pointermove for a pointer that never went down (hover, not drag)", () => {
    render(<WorldViewport />);
    const viewport = screen.getByTestId("world-viewport");
    const before = useCameraStore.getState().camera;

    fireEvent.pointerMove(viewport, { pointerId: 99, clientX: 300 });

    expect(useCameraStore.getState().camera).toEqual(before);
  });

  it("zooms in on pinch and keeps the two touch points where they were", () => {
    render(<WorldViewport />);
    const viewport = screen.getByTestId("world-viewport");

    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 400 });
    fireEvent.pointerDown(viewport, { pointerId: 2, clientX: 600 });
    // Fingers spread apart: 200px apart becomes 400px apart.
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 300 });
    fireEvent.pointerMove(viewport, { pointerId: 2, clientX: 700 });

    expect(useCameraStore.getState().camera.zoom).toBeGreaterThan(4);
  });

  it("does not take pointer capture for a stationary or barely-moved single pointer", () => {
    // Regression test: capturing the pointer immediately on pointerdown
    // retargets the click event a plain tap ends with to this div instead
    // of whichever item dot was under the pointer, silently breaking
    // "click an item to focus it" for every click. jsdom does not simulate
    // that retargeting itself (so a test asserting the click's target
    // wouldn't have caught the original bug) - this instead asserts the
    // fix's actual mechanism: capture must not be requested until the
    // pointer has genuinely moved like a drag.
    const setPointerCapture = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      value: setPointerCapture,
      configurable: true,
    });

    render(<WorldViewport />);
    const viewport = screen.getByTestId("world-viewport");

    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 500 });
    expect(setPointerCapture).not.toHaveBeenCalled();

    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 501 }); // 1px: still a tap
    expect(setPointerCapture).not.toHaveBeenCalled();

    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 520 }); // past the threshold
    expect(setPointerCapture).toHaveBeenCalledWith(1);

    // Restores the environment's own absence of this API for later tests.
    delete (HTMLElement.prototype as { setPointerCapture?: unknown }).setPointerCapture;
  });

  describe("items", () => {
    it("positions a dot at the screen location of its score", () => {
      const items: Item[] = [
        { id: "1", title: "Solo", score: 20, voterCount: 100, order: 0, tags: [] },
      ];
      render(<WorldViewport items={items} />);

      // camera is { center: 0, zoom: 4 }, viewportWidth 1000: worldToScreen(20) = 20*4 + 500 = 580.
      expect(screen.getByTestId("item-dot")).toHaveStyle({ left: "580px" });
    });

    it("positions a dot at the screen location of its (log) voter count", () => {
      const items: Item[] = [
        { id: "1", title: "Solo", score: 0, voterCount: 100, order: 0, tags: [] },
      ];
      render(<WorldViewport items={items} />);

      // cameraY is { centerY: 0, zoomY: 100 }, viewportHeight 800: axisTopPx
      // = 0.8*800 = 640. worldY = log10(100) = 2, so
      // screenY = 640 - (2-0)*100 = 440.
      const actualScreenY = Number.parseFloat(screen.getByTestId("item-dot").style.top);
      expect(actualScreenY).toBeCloseTo(440, 9);
    });

    it("does not crash or misplace an item with zero voters", () => {
      const items: Item[] = [
        { id: "1", title: "Unvoted", score: 0, voterCount: 0, order: 0, tags: [] },
      ];
      render(<WorldViewport items={items} />);

      const dot = screen.getByTestId("item-dot");
      const top = Number.parseFloat(dot.style.top);
      expect(Number.isFinite(top)).toBe(true);
    });

    it("only renders items within the visible (buffered) range", () => {
      const items: Item[] = [
        { id: "near", title: "Near", score: 0, voterCount: 10, order: 0, tags: [] },
        { id: "far", title: "Far", score: 1_000_000, voterCount: 10, order: 1, tags: [] },
      ];
      render(<WorldViewport items={items} />);

      expect(screen.getAllByTestId("item-dot")).toHaveLength(1);
    });
  });

  describe("vote-state colour (batch 6)", () => {
    const items: Item[] = [
      { id: "a", title: "Alpha", score: 0, voterCount: 10, order: 0, tags: [] },
    ];

    it("is locked (not blue) for a logged-out visitor - rule R11", () => {
      render(<WorldViewport items={items} />);
      expect(screen.getByTestId("item-dot")).not.toHaveClass("bg-blue-600");
    });

    it("is votable (blue) for a logged-in user - rule R10", () => {
      useAuthStore.setState({ username: "Alice" });
      render(<WorldViewport items={items} />);
      expect(screen.getByTestId("item-dot")).toHaveClass("bg-blue-600");
    });
  });

  describe("grid sampling (batch 3)", () => {
    it("collapses two items sharing a cell into a single dot, at the older item's position on a tie", () => {
      // Winner-selection itself (most-voted, ties broken by age) is tested
      // exhaustively in packages/shared's grid.test.ts against plain
      // {cellCol, cellRow} values; this only proves the real component
      // wires real score/voterCount data into the same grid correctly.
      // Equal voterCount keeps both items in the same screen-Y band too -
      // giving them different voterCount would have put them in different
      // Y cells, which is a distinct behaviour, not what this test is for.
      const items: Item[] = [
        { id: "a", title: "Alpha", score: 2, voterCount: 100, order: 0, tags: [] },
        { id: "b", title: "Beta", score: 3, voterCount: 100, order: 1, tags: [] },
      ];
      render(<WorldViewport items={items} />);

      const dots = screen.getAllByTestId("item-dot");
      expect(dots).toHaveLength(1);
      // worldToScreen(2, {center:0,zoom:4}, 1000) = 508 - Alpha's position,
      // the older of the two on this voterCount tie.
      expect(Number.parseFloat(dots[0]?.style.left ?? "")).toBeCloseTo(508, 9);
    });

    it("keeps items in different cells as separate dots", () => {
      const items: Item[] = [
        { id: "a", title: "Alpha", score: -50, voterCount: 10, order: 0, tags: [] },
        { id: "b", title: "Beta", score: 50, voterCount: 10, order: 1, tags: [] },
      ];
      render(<WorldViewport items={items} />);

      expect(screen.getAllByTestId("item-dot")).toHaveLength(2);
    });

    it("shows a plain label for a lone item and a '+N' label for a crowded cell", () => {
      // Batch 6b: a crowded cell now gets a label too (its representative's
      // name plus how many more it stands for) - otherwise a group that can
      // never be split by zoom (an exact tie on both score and voter count,
      // as some of the realistic mock data turned out to have) would be
      // permanently silent, which is exactly what was reported as a bug.
      const alone: Item[] = [
        { id: "a", title: "Alpha", score: 0, voterCount: 10, order: 0, tags: [] },
      ];
      const { unmount } = render(<WorldViewport items={alone} />);
      expect(screen.getByTestId("item-label")).toHaveTextContent("Alpha");
      unmount();

      const crowded: Item[] = [
        { id: "a", title: "Alpha", score: 2, voterCount: 100, order: 0, tags: [] },
        { id: "b", title: "Beta", score: 3, voterCount: 100, order: 1, tags: [] },
      ];
      render(<WorldViewport items={crowded} />);
      expect(screen.getByTestId("item-label")).toHaveTextContent("Alpha +1");
    });

    it("lets a crowded (tied) cell's label win over a nearby lone item's, even with fewer voters", () => {
      // Reported bug: an exact score-and-voter-count tie is common precisely
      // among low-voter items (a single vote has only 21 possible scores),
      // so its label used to always lose the collision fight to whatever
      // higher-voter item happened to sit nearby - the crowded cluster's
      // priority (its representative's own voterCount) was the lowest in
      // the whole dataset by construction. zoomY is flattened to 1 here so
      // the two items' very different voter counts don't also separate them
      // vertically - this test is about label priority, not geometry.
      useCameraStore.setState({ cameraY: { centerY: 0, zoomY: 1 } });
      const items: Item[] = [
        { id: "a", title: "Alpha", score: 9, voterCount: 1, order: 0, tags: [] },
        { id: "b", title: "Beta", score: 9, voterCount: 1, order: 1, tags: [] },
        { id: "c", title: "Zz", score: 10, voterCount: 5, order: 2, tags: [] },
      ];
      render(<WorldViewport items={items} />);

      expect(screen.getByTestId("item-label")).toHaveTextContent("Alpha +1");
    });

    it("draws a larger dot for a more crowded cell than for a lone item", () => {
      const alone: Item[] = [
        { id: "a", title: "Alpha", score: 0, voterCount: 10, order: 0, tags: [] },
      ];
      const { unmount } = render(<WorldViewport items={alone} />);
      const aloneSize = Number.parseFloat(screen.getByTestId("item-dot").style.width);
      unmount();

      const crowded: Item[] = [
        { id: "a", title: "Alpha", score: 2, voterCount: 100, order: 0, tags: [] },
        { id: "b", title: "Beta", score: 3, voterCount: 100, order: 1, tags: [] },
      ];
      render(<WorldViewport items={crowded} />);
      const crowdedSize = Number.parseFloat(screen.getByTestId("item-dot").style.width);

      expect(crowdedSize).toBeGreaterThan(aloneSize);
    });

    it("does not reshuffle which items are shown when panning less than one cell", () => {
      const items: Item[] = [
        { id: "a", title: "Alpha", score: -50, voterCount: 10, order: 0, tags: [] },
        { id: "b", title: "Beta", score: 50, voterCount: 10, order: 1, tags: [] },
      ];
      render(<WorldViewport items={items} />);
      const before = screen.getAllByTestId("item-dot").map((dot) => dot.style.left);

      const viewport = screen.getByTestId("world-viewport");
      fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 500 });
      fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 505 });
      fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 505 });

      const after = screen.getAllByTestId("item-dot").map((dot) => dot.style.left);
      expect(after).toHaveLength(before.length);
      // Both dots should have moved by exactly the pan distance (5px),
      // not reshuffled to a different representative or a different count.
      for (const [index, leftBefore] of before.entries()) {
        expect(Number.parseFloat(after[index] ?? "")).toBeCloseTo(
          Number.parseFloat(leftBefore ?? "") + 5,
          9,
        );
      }
    });
  });

  describe("shared cell picker (batch 7 follow-up)", () => {
    const items: Item[] = [
      { id: "a", title: "Alpha", score: 2, voterCount: 100, order: 0, tags: [] },
      { id: "b", title: "Beta", score: 3, voterCount: 100, order: 1, tags: [] },
    ];

    it("lets you pick a different member of a crowded cell, which then becomes the shown, interactive dot", () => {
      render(<WorldViewport items={items} />);
      // See "focuses the clicked item..." below for why this must be mocked.
      const animateTo = vi
        .spyOn(useCameraStore.getState(), "animateTo")
        .mockImplementation(() => {});

      fireEvent.click(screen.getByTestId("item-dot"));
      expect(screen.getByTestId("item-card")).toHaveTextContent("Alpha");
      expect(screen.getByTestId("item-card-alternates")).toHaveTextContent("Beta");

      fireEvent.click(screen.getByRole("button", { name: "Beta" }));

      expect(screen.getByTestId("item-card")).toHaveTextContent("Beta");
      expect(screen.getByTestId("item-card-alternates")).toHaveTextContent("Alpha");
      expect(screen.getByTestId("item-dot")).toHaveAttribute("data-item-id", "b");

      animateTo.mockRestore();
    });
  });

  describe("item cards and focusing (batch 5)", () => {
    const items: Item[] = [
      {
        id: "a",
        title: "Alpha",
        score: 35,
        voterCount: 100,
        order: 0,
        tags: ["Drama", "1990s"],
      },
    ];

    it("shows a card with the item's name, score and voter count on hover", () => {
      render(<WorldViewport items={items} />);
      expect(screen.queryByTestId("item-card")).not.toBeInTheDocument();

      fireEvent.mouseEnter(screen.getByTestId("item-dot"));

      const card = screen.getByTestId("item-card");
      expect(card).toHaveTextContent("Alpha");
      expect(card).toHaveTextContent("Score 35");
      expect(card).toHaveTextContent("100 voters");
      expect(card).toHaveTextContent("Drama");
    });

    it("hides the card once the mouse leaves the dot", () => {
      render(<WorldViewport items={items} />);
      const dot = screen.getByTestId("item-dot");

      fireEvent.mouseEnter(dot);
      expect(screen.getByTestId("item-card")).toBeInTheDocument();

      fireEvent.mouseLeave(dot);
      expect(screen.queryByTestId("item-card")).not.toBeInTheDocument();
    });

    it("focuses the clicked item by animating the camera to centre it, both horizontally and vertically", () => {
      // The glide itself (eased, not instant) is exhaustively covered by
      // interpolateCamera's own tests in packages/shared, and running the
      // animation for real depends on requestAnimationFrame timestamps
      // lining up with performance.now() - true in a real browser, not
      // reliable in jsdom. This only proves clicking a dot computes the
      // right focus camera and hands it to the store's animation.
      render(<WorldViewport items={items} />);
      // Mocked rather than left to call through: jsdom's requestAnimationFrame
      // timestamps don't line up with performance.now(), so the real
      // implementation would start a loop that never reaches t=1 and leaks
      // into later tests.
      const animateTo = vi
        .spyOn(useCameraStore.getState(), "animateTo")
        .mockImplementation(() => {});

      fireEvent.click(screen.getByTestId("item-dot"));

      expect(animateTo).toHaveBeenCalledTimes(1);
      const [target, targetY] = animateTo.mock.calls[0] ?? [];
      expect(target?.center).toBe(35);
      // voterCount is 100: log10(100) = 2.
      expect(targetY?.centerY).toBeCloseTo(2, 9);
      animateTo.mockRestore();
    });

    it("writes the camera position into the web address", () => {
      render(<WorldViewport items={items} />);

      act(() => {
        useCameraStore.setState({ camera: { center: 12.5, zoom: 8 }, viewportWidth: 1000 });
      });

      expect(window.location.search).toContain("c=12.5");
      expect(window.location.search).toContain("z=8");
    });
  });

  describe("vertical camera and label decluttering (batch 6b)", () => {
    it("pans the vertical camera by exactly the dragged distance on a single-pointer drag", () => {
      render(<WorldViewport />);
      const viewport = screen.getByTestId("world-viewport");

      fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 500, clientY: 400 });
      fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 500, clientY: 440 });
      fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 500, clientY: 440 });

      // cameraY.zoomY is 100: dragging 40px down must move centerY by 40/100.
      expect(useCameraStore.getState().cameraY.centerY).toBeCloseTo(0.4, 9);
    });

    it("zooms the vertical camera in on the wheel, alongside the horizontal one", () => {
      render(<WorldViewport />);
      const viewport = screen.getByTestId("world-viewport");
      const before = useCameraStore.getState().cameraY.zoomY;

      fireEvent.wheel(viewport, { deltaY: -100, clientX: 500, clientY: 400 });

      expect(useCameraStore.getState().cameraY.zoomY).toBeGreaterThan(before);
    });

    it("never zooms the vertical camera out past the point where the whole data range fits", () => {
      const items: Item[] = [
        { id: "a", title: "A", score: 0, voterCount: 1000, order: 0, tags: [] },
      ];
      render(<WorldViewport items={items} />);
      const viewport = screen.getByTestId("world-viewport");

      // A huge positive deltaY asks for a drastic zoom-out.
      fireEvent.wheel(viewport, { deltaY: 100_000, clientX: 500, clientY: 400 });

      // viewportHeight is 800 (set in beforeEach); minZoomYForItems([1000], 800)
      // is the floor - there is nothing beyond a 1000-voter item to show.
      const decades = Math.max(Math.log10(1000), 1);
      const minZoomY = 800 / (decades * 1.1);
      expect(useCameraStore.getState().cameraY.zoomY).toBeGreaterThanOrEqual(minZoomY);
    });

    it("never pans further than half a screen past the last item, horizontally", () => {
      const items: Item[] = [{ id: "a", title: "A", score: 0, voterCount: 10, order: 0, tags: [] }];
      render(<WorldViewport items={items} />);
      const viewport = screen.getByTestId("world-viewport");

      fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 500 });
      fireEvent.pointerMove(viewport, { pointerId: 1, clientX: -5000 });
      fireEvent.pointerUp(viewport, { pointerId: 1, clientX: -5000 });

      // viewportWidth 1000, zoom 4: half a screen is (1000/2)/4 = 125 world
      // units past the only item's score of 0.
      expect(useCameraStore.getState().camera.center).toBeCloseTo(125, 9);
    });

    it("never pans further than half a screen past the top item, vertically", () => {
      const items: Item[] = [{ id: "a", title: "A", score: 0, voterCount: 10, order: 0, tags: [] }];
      render(<WorldViewport items={items} />);
      const viewport = screen.getByTestId("world-viewport");

      fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 500, clientY: 400 });
      fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 500, clientY: 6000 });
      fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 500, clientY: 6000 });

      // viewportHeight 800, zoomY 100: half a screen is (800/2)/100 = 4 world
      // units past the only item's voter count (10 -> worldY 1), so the
      // ceiling is 1 + 4 = 5.
      expect(useCameraStore.getState().cameraY.centerY).toBeCloseTo(5, 9);
    });

    it("hides the lower-priority label when two lone items' labels would collide", () => {
      // Chosen so both fall one grid row apart (so neither dot merges with
      // the other) yet land within a fraction of a pixel of the same screen
      // position - guaranteeing their labels overlap. See labelDeclutter.ts
      // for the general rule; this only proves the component wires real
      // item data into it.
      const items: Item[] = [
        { id: "less-voted", title: "Less Voted", score: 0, voterCount: 1584, order: 0, tags: [] },
        { id: "more-voted", title: "More Voted", score: 0, voterCount: 1585, order: 1, tags: [] },
      ];
      render(<WorldViewport items={items} />);

      expect(screen.getAllByTestId("item-dot")).toHaveLength(2);
      const labels = screen.getAllByTestId("item-label");
      expect(labels).toHaveLength(1);
      expect(labels[0]).toHaveTextContent("More Voted");
    });
  });

  describe("axis ruler (batch 6b)", () => {
    // A wide score range so the pan below stays far inside the pan-bound
    // clamp - this test is about the ruler, not that boundary.
    const items: Item[] = [
      { id: "a", title: "A", score: -1000, voterCount: 10, order: 0, tags: [] },
      { id: "b", title: "B", score: 1000, voterCount: 10, order: 1, tags: [] },
    ];

    it("keeps X tick marks at the same screen position after panning, and relabels them instead", () => {
      render(<WorldViewport items={items} />);
      const positionsBefore = screen.getAllByTestId("world-tick").map((tick) => tick.style.left);
      const labelsBefore = screen.getAllByTestId("world-tick").map((tick) => tick.textContent);

      const viewport = screen.getByTestId("world-viewport");
      fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 500 });
      fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 100 });
      fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 100 });

      const positionsAfter = screen.getAllByTestId("world-tick").map((tick) => tick.style.left);
      const labelsAfter = screen.getAllByTestId("world-tick").map((tick) => tick.textContent);

      expect(positionsAfter).toEqual(positionsBefore);
      expect(labelsAfter).not.toEqual(labelsBefore);
    });

    it("keeps Y tick marks at the same screen position after a vertical pan, and relabels them instead", () => {
      render(<WorldViewport items={items} />);
      const positionsBefore = screen.getAllByTestId("world-tick-y").map((tick) => tick.style.top);
      const labelsBefore = screen.getAllByTestId("world-tick-y").map((tick) => tick.textContent);

      const viewport = screen.getByTestId("world-viewport");
      fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 500, clientY: 400 });
      fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 500, clientY: 250 });
      fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 500, clientY: 250 });

      const positionsAfter = screen.getAllByTestId("world-tick-y").map((tick) => tick.style.top);
      const labelsAfter = screen.getAllByTestId("world-tick-y").map((tick) => tick.textContent);

      expect(positionsAfter).toEqual(positionsBefore);
      expect(labelsAfter).not.toEqual(labelsBefore);
    });

    it("pins the ground line and grid to the bottom/left edges of the viewport, not the world", () => {
      render(<WorldViewport items={items} />);
      expect(screen.getByTestId("world-axis")).toHaveClass("bottom-0");
    });
  });

  describe("drag to vote (batch 7)", () => {
    const items: Item[] = [
      { id: "a", title: "Alpha", score: 20, voterCount: 100, order: 0, tags: [] },
    ];

    // Every test here focuses the item with a plain click first, which also
    // triggers the real animateTo - mocked for the same reason the
    // "item cards and focusing" tests mock it: jsdom's requestAnimationFrame
    // timestamps never line up with performance.now(), so the unmocked
    // implementation would start a loop that never finishes and leaks into
    // later tests.
    beforeEach(() => {
      vi.spyOn(useCameraStore.getState(), "animateTo").mockImplementation(() => {});
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("makes the focused, votable item's dot bigger - reported as hard to grab", () => {
      useAuthStore.setState({ username: "Alice" });
      render(<WorldViewport items={items} />);
      const sizeBefore = Number.parseFloat(screen.getByTestId("item-dot").style.width);

      fireEvent.click(screen.getByTestId("item-dot"));

      const sizeAfter = Number.parseFloat(screen.getByTestId("item-dot").style.width);
      expect(sizeAfter).toBeGreaterThan(sizeBefore);
    });

    it("does not let a logged-out visitor start a vote drag - it pans instead (rule R11)", () => {
      render(<WorldViewport items={items} />);
      fireEvent.click(screen.getByTestId("item-dot"));
      const dot = screen.getByTestId("item-dot");
      const centerBefore = useCameraStore.getState().camera.center;

      fireEvent.pointerDown(dot, { pointerId: 1, clientX: 580 });
      fireEvent.pointerMove(dot, { pointerId: 1, clientX: 620 });
      fireEvent.pointerUp(dot, { pointerId: 1, clientX: 620 });

      expect(screen.queryByTestId("vote-preview")).not.toBeInTheDocument();
      // Fell through to the ordinary pan gesture instead of voting.
      expect(useCameraStore.getState().camera.center).not.toBe(centerBefore);
    });

    it("previews a live vote amount while dragging the focused, logged-in item", () => {
      useAuthStore.setState({ username: "Alice" });
      render(<WorldViewport items={items} />);
      fireEvent.click(screen.getByTestId("item-dot"));
      const dot = screen.getByTestId("item-dot");

      // VOTE_DRAG_PX_PER_POINT is 12: dragging 36px right is +3.
      fireEvent.pointerDown(dot, { pointerId: 1, clientX: 580 });
      fireEvent.pointerMove(dot, { pointerId: 1, clientX: 616 });

      expect(screen.getByTestId("vote-preview")).toHaveTextContent("20 + 3 = 23");
      expect(screen.queryByRole("button", { name: /submit/i })).not.toBeInTheDocument();
      // Not cast until Submit, and the map must not have panned instead.
      expect(useVoteStore.getState().hasVoted("a")).toBe(false);
    });

    it("shows the item the drag would pass, live while still dragging (batch 7b)", () => {
      useAuthStore.setState({ username: "Alice" });
      const twoItems: Item[] = [
        { id: "a", title: "Alpha", score: 20, voterCount: 100, order: 0, tags: [] },
        { id: "b", title: "Beta", score: 25, voterCount: 500, order: 1, tags: [] },
      ];
      render(<WorldViewport items={twoItems} />);
      fireEvent.click(screen.getAllByTestId("item-dot")[0] as HTMLElement);
      const dot = screen.getAllByTestId("item-dot")[0] as HTMLElement;

      // +5 lands exactly on Beta's score (25).
      fireEvent.pointerDown(dot, { pointerId: 1, clientX: 580 });
      fireEvent.pointerMove(dot, { pointerId: 1, clientX: 640 });

      expect(screen.getByTestId("vote-passed-item")).toHaveTextContent("Would pass: Beta");
    });

    it("shows nothing about passing when the drag doesn't reach another item", () => {
      useAuthStore.setState({ username: "Alice" });
      const twoItems: Item[] = [
        { id: "a", title: "Alpha", score: 20, voterCount: 100, order: 0, tags: [] },
        { id: "b", title: "Beta", score: 25, voterCount: 500, order: 1, tags: [] },
      ];
      render(<WorldViewport items={twoItems} />);
      fireEvent.click(screen.getAllByTestId("item-dot")[0] as HTMLElement);
      const dot = screen.getAllByTestId("item-dot")[0] as HTMLElement;

      // +2 lands on 22 - short of Beta's 25.
      fireEvent.pointerDown(dot, { pointerId: 1, clientX: 580 });
      fireEvent.pointerMove(dot, { pointerId: 1, clientX: 604 });

      expect(screen.getByTestId("vote-preview")).toHaveTextContent("20 + 2 = 22");
      expect(screen.queryByTestId("vote-passed-item")).not.toBeInTheDocument();
    });

    it("clamps the drag to +-10 points, however far the pointer moves (rule R4)", () => {
      useAuthStore.setState({ username: "Alice" });
      render(<WorldViewport items={items} />);
      fireEvent.click(screen.getByTestId("item-dot"));
      const dot = screen.getByTestId("item-dot");

      fireEvent.pointerDown(dot, { pointerId: 1, clientX: 580 });
      fireEvent.pointerMove(dot, { pointerId: 1, clientX: 5000 });

      expect(screen.getByTestId("vote-preview")).toHaveTextContent("20 + 10 = 30");
    });

    it("needs the same drag distance to reach +10 regardless of the map's zoom level", () => {
      // Reported bug: this used to be tied to camera.zoom (the map's own
      // pan/zoom), so reaching +-10 could take the full width of the screen
      // at a typical zoomed-out level - worse on a narrow phone screen,
      // where the far end of that range could fall outside the screen
      // entirely. It must now take the exact same drag at any zoom.
      useAuthStore.setState({ username: "Alice" });
      useCameraStore.setState({ camera: { center: 0, zoom: 0.1 } });
      render(<WorldViewport items={items} />);
      fireEvent.click(screen.getByTestId("item-dot"));
      const dot = screen.getByTestId("item-dot");

      fireEvent.pointerDown(dot, { pointerId: 1, clientX: 580 });
      fireEvent.pointerMove(dot, { pointerId: 1, clientX: 700 });

      expect(screen.getByTestId("vote-preview")).toHaveTextContent("20 + 10 = 30");
    });

    it("does not cast the vote on release - a Submit button appears instead (rule R9)", () => {
      useAuthStore.setState({ username: "Alice" });
      render(<WorldViewport items={items} />);
      fireEvent.click(screen.getByTestId("item-dot"));
      const dot = screen.getByTestId("item-dot");

      fireEvent.pointerDown(dot, { pointerId: 1, clientX: 580 });
      fireEvent.pointerMove(dot, { pointerId: 1, clientX: 700 });
      fireEvent.pointerUp(dot, { pointerId: 1, clientX: 700 });

      expect(useVoteStore.getState().hasVoted("a")).toBe(false);
      expect(screen.getByRole("button", { name: /submit vote: \+10/i })).toBeInTheDocument();
    });

    it("commits the vote on Submit and locks the item (grey, no longer draggable)", () => {
      useAuthStore.setState({ username: "Alice" });
      render(<WorldViewport items={items} />);
      fireEvent.click(screen.getByTestId("item-dot"));
      const dot = screen.getByTestId("item-dot");

      fireEvent.pointerDown(dot, { pointerId: 1, clientX: 580 });
      fireEvent.pointerMove(dot, { pointerId: 1, clientX: 700 });
      fireEvent.pointerUp(dot, { pointerId: 1, clientX: 700 });
      fireEvent.click(screen.getByRole("button", { name: /submit vote: \+10/i }));

      expect(useVoteStore.getState().hasVoted("a")).toBe(true);
      expect(useVoteStore.getState().votes.a).toBe(10);
      expect(screen.queryByRole("button", { name: /submit/i })).not.toBeInTheDocument();
      expect(screen.getByTestId("item-dot")).not.toHaveClass("bg-blue-600");
    });

    it("zooms the vertical camera out on Submit for a low-voter item, so it doesn't jump off-screen", () => {
      // Reported bug: voting moves an item up by one step of voterCount,
      // which the log-scaled Y axis can turn into a large jump for a
      // low-voter item - a 1-voter item's position doubles just by going to
      // 2 voters. Without this, the item could simply vanish off-screen the
      // instant the vote landed.
      useAuthStore.setState({ username: "Alice" });
      const lowVoterItems: Item[] = [
        { id: "a", title: "Alpha", score: 20, voterCount: 1, order: 0, tags: [] },
      ];
      render(<WorldViewport items={lowVoterItems} />);
      fireEvent.click(screen.getByTestId("item-dot"));
      const dot = screen.getByTestId("item-dot");

      // Simulates having zoomed in close on this one item before voting -
      // realistic, since voting requires focusing it first, and a lone,
      // low-voter item is easy to zoom in close on.
      act(() => {
        useCameraStore.setState({ cameraY: { centerY: 0, zoomY: 5000 } });
      });

      fireEvent.pointerDown(dot, { pointerId: 1, clientX: 580 });
      fireEvent.pointerMove(dot, { pointerId: 1, clientX: 700 });
      fireEvent.pointerUp(dot, { pointerId: 1, clientX: 700 });

      const animateTo = vi.mocked(useCameraStore.getState().animateTo);
      animateTo.mockClear();

      fireEvent.click(screen.getByRole("button", { name: /submit vote: \+10/i }));

      expect(animateTo).toHaveBeenCalledTimes(1);
      const [, targetCameraY] = animateTo.mock.calls[0] ?? [];
      // voterCount 1 -> 2 is a worldY jump of log10(2) ≈ 0.301, which at
      // zoom 5000 is ~1505px - more than half the 800px viewport - so the
      // camera must zoom out to exactly the zoom that keeps it within half.
      expect(targetCameraY?.zoomY).toBeCloseTo((800 * 0.5) / Math.log10(2), 5);
    });

    it("starts fresh, not additive, when re-dragging before Submit", () => {
      useAuthStore.setState({ username: "Alice" });
      render(<WorldViewport items={items} />);
      fireEvent.click(screen.getByTestId("item-dot"));
      const dot = screen.getByTestId("item-dot");

      fireEvent.pointerDown(dot, { pointerId: 1, clientX: 580 });
      fireEvent.pointerMove(dot, { pointerId: 1, clientX: 700 }); // +10
      fireEvent.pointerUp(dot, { pointerId: 1, clientX: 700 });
      expect(screen.getByTestId("vote-preview")).toHaveTextContent("20 + 10 = 30");

      // A fresh drag, not one continuing from +10 - rule R4: always the
      // full range, centred on the item.
      fireEvent.pointerDown(dot, { pointerId: 2, clientX: 580 });
      fireEvent.pointerMove(dot, { pointerId: 2, clientX: 520 }); // -5
      expect(screen.getByTestId("vote-preview")).toHaveTextContent("20 - 5 = 15");
    });

    it("un-focuses (and abandons a pending vote) when the background is clicked", () => {
      useAuthStore.setState({ username: "Alice" });
      render(<WorldViewport items={items} />);
      fireEvent.click(screen.getByTestId("item-dot"));
      const dot = screen.getByTestId("item-dot");

      fireEvent.pointerDown(dot, { pointerId: 1, clientX: 580 });
      fireEvent.pointerMove(dot, { pointerId: 1, clientX: 620 });
      fireEvent.pointerUp(dot, { pointerId: 1, clientX: 620 });
      expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();

      // world-content, not world-viewport: it's the full-size layer stacked
      // on top of everything else in the viewport, so it's the real target
      // a genuine click on empty space would have in a browser.
      fireEvent.click(screen.getByTestId("world-content"));

      expect(screen.queryByTestId("item-card")).not.toBeInTheDocument();
      expect(useVoteStore.getState().hasVoted("a")).toBe(false);
    });

    it("does not un-focus when a pan drag happens to end over empty space", () => {
      useAuthStore.setState({ username: "Alice" });
      render(<WorldViewport items={items} />);
      fireEvent.click(screen.getByTestId("item-dot"));
      expect(screen.getByTestId("item-card")).toBeInTheDocument();

      const viewport = screen.getByTestId("world-viewport");
      fireEvent.pointerDown(viewport, { pointerId: 2, clientX: 100, clientY: 100 });
      fireEvent.pointerMove(viewport, { pointerId: 2, clientX: 130, clientY: 100 });
      fireEvent.pointerUp(viewport, { pointerId: 2, clientX: 130, clientY: 100 });
      // The browser still fires a click after the drag, landing on
      // world-content wherever the pointer was released.
      fireEvent.click(screen.getByTestId("world-content"));

      expect(screen.getByTestId("item-card")).toBeInTheDocument();
    });

    it("keeps the Submit button on the item being voted on, even if the pointer ends up hovering a different dot", () => {
      useAuthStore.setState({ username: "Alice" });
      const twoItems: Item[] = [
        { id: "a", title: "Alpha", score: 20, voterCount: 100, order: 0, tags: [] },
        { id: "b", title: "Beta", score: 30, voterCount: 100, order: 1, tags: [] },
      ];
      render(<WorldViewport items={twoItems} />);
      fireEvent.click(screen.getAllByTestId("item-dot")[0] as HTMLElement);
      const dot = screen.getAllByTestId("item-dot")[0] as HTMLElement;

      fireEvent.pointerDown(dot, { pointerId: 1, clientX: 580 });
      fireEvent.pointerMove(dot, { pointerId: 1, clientX: 700 });
      fireEvent.pointerUp(dot, { pointerId: 1, clientX: 700 });
      // Simulates the pointer landing over the OTHER item's dot on release -
      // exactly what used to make the Submit button vanish.
      fireEvent.mouseEnter(screen.getAllByTestId("item-dot")[1] as HTMLElement);

      expect(screen.getByRole("button", { name: /submit vote: \+10/i })).toBeInTheDocument();
    });
  });

  describe("added entries (batch 9)", () => {
    it("renders an item added via the entries store alongside the given items", () => {
      const items: Item[] = [
        { id: "a", title: "Alpha", score: 0, voterCount: 10, order: 0, tags: [] },
      ];
      render(<WorldViewport items={items} />);
      expect(screen.getAllByTestId("item-dot")).toHaveLength(1);

      act(() => {
        useEntriesStore.getState().addEntry("https://example.com/new-thing");
      });

      expect(screen.getAllByTestId("item-dot")).toHaveLength(2);
    });
  });
});
