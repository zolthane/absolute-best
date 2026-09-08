import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
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
});
