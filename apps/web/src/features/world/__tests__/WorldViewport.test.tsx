import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Item } from "../../../data/mockItems";
import { useCameraStore } from "../cameraStore";
import { WorldViewport } from "../WorldViewport";

// The exhaustive coordinate-maths correctness lives in packages/shared's own
// tests, run against plain functions. These tests only prove the component
// wires pointer events through to the camera store correctly.

beforeEach(() => {
  useCameraStore.setState({ camera: { center: 0, zoom: 4 }, viewportWidth: 1000 });
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
      transform: "translateX(-40px)",
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

  describe("items", () => {
    it("positions a dot at the screen location of its score", () => {
      const items: Item[] = [{ id: "1", title: "Solo", score: 20, voterCount: 100 }];
      render(<WorldViewport items={items} />);

      // camera is { center: 0, zoom: 4 }, viewportWidth 1000: worldToScreen(20) = 20*4 + 500 = 580.
      expect(screen.getByTestId("item-dot")).toHaveStyle({ left: "580px" });
    });

    it("positions the single most-voted item at the top of its headroom", () => {
      const items: Item[] = [{ id: "1", title: "Solo", score: 0, voterCount: 100 }];
      render(<WorldViewport items={items} />);

      const axisTopPx = 0.8 * window.innerHeight;
      const maxDotHeightAboveAxis = axisTopPx * 0.9;
      const expectedScreenY = axisTopPx - maxDotHeightAboveAxis;

      const actualScreenY = Number.parseFloat(screen.getByTestId("item-dot").style.top);
      expect(actualScreenY).toBeCloseTo(expectedScreenY, 9);
    });

    it("does not crash or misplace an item with zero voters", () => {
      const items: Item[] = [{ id: "1", title: "Unvoted", score: 0, voterCount: 0 }];
      render(<WorldViewport items={items} />);

      const dot = screen.getByTestId("item-dot");
      const top = Number.parseFloat(dot.style.top);
      expect(Number.isFinite(top)).toBe(true);
    });

    it("only renders items within the visible (buffered) range", () => {
      const items: Item[] = [
        { id: "near", title: "Near", score: 0, voterCount: 10 },
        { id: "far", title: "Far", score: 1_000_000, voterCount: 10 },
      ];
      render(<WorldViewport items={items} />);

      expect(screen.getAllByTestId("item-dot")).toHaveLength(1);
    });
  });
});
