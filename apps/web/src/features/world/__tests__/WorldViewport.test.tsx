import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Item } from "../../../data/mockItems";
import { useAuthStore } from "../../auth/authStore";
import { useCameraStore } from "../cameraStore";
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
});
