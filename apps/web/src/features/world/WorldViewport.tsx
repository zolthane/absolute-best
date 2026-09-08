import { computeNiceTicks, screenToWorld, worldToScreen } from "@teeter/shared";
import { useEffect, useRef } from "react";
import { useCameraStore } from "./cameraStore";

interface Point {
  x: number;
  y: number;
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function WorldViewport() {
  const camera = useCameraStore((state) => state.camera);
  const viewportWidth = useCameraStore((state) => state.viewportWidth);

  const viewportRef = useRef<HTMLDivElement>(null);
  const activePointers = useRef(new Map<number, Point>());
  const lastPanX = useRef<number | null>(null);
  const pinchStartDistance = useRef<number | null>(null);

  // The viewport is assumed to fill the browser window horizontally (see
  // App.tsx), so window width doubles as viewport width - this sidesteps
  // getBoundingClientRect, which jsdom cannot measure in component tests.
  useEffect(() => {
    const handleResize = () => useCameraStore.getState().setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // A native, non-passive listener: React's synthetic onWheel is attached
  // passively, so calling preventDefault() there is silently ignored (and
  // logs a console warning) instead of stopping the page from scrolling.
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomFactor = Math.exp(-event.deltaY * 0.001);
      useCameraStore.getState().zoomAt(event.clientX, zoomFactor);
    };
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.current.size === 1) {
      lastPanX.current = event.clientX;
      pinchStartDistance.current = null;
    } else if (activePointers.current.size === 2) {
      const [a, b] = [...activePointers.current.values()];
      if (a && b) {
        pinchStartDistance.current = distanceBetween(a, b);
      }
      lastPanX.current = null;
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(event.pointerId)) {
      return;
    }
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.current.size === 1 && lastPanX.current !== null) {
      const deltaScreenX = event.clientX - lastPanX.current;
      lastPanX.current = event.clientX;
      useCameraStore.getState().pan(deltaScreenX);
      return;
    }

    if (activePointers.current.size === 2 && pinchStartDistance.current !== null) {
      const [a, b] = [...activePointers.current.values()];
      if (!a || !b) {
        return;
      }
      const distance = distanceBetween(a, b);
      if (pinchStartDistance.current > 0) {
        const zoomFactor = distance / pinchStartDistance.current;
        const midpointX = (a.x + b.x) / 2;
        useCameraStore.getState().zoomAt(midpointX, zoomFactor);
      }
      pinchStartDistance.current = distance;
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    activePointers.current.delete(event.pointerId);

    // A three-finger gesture dropping to two pointers does not resume
    // pinching until both fingers lift and press again - three-finger
    // recovery is outside Stage 0's scope, and this stays a safe no-op.
    if (activePointers.current.size === 1) {
      const [remaining] = [...activePointers.current.values()];
      lastPanX.current = remaining ? remaining.x : null;
      pinchStartDistance.current = null;
    } else {
      lastPanX.current = null;
      pinchStartDistance.current = null;
    }
  };

  const minVisibleWorld = screenToWorld(0, camera, viewportWidth);
  const maxVisibleWorld = screenToWorld(viewportWidth, camera, viewportWidth);
  const ticks = computeNiceTicks(minVisibleWorld, maxVisibleWorld);
  const fulcrumScreenX = worldToScreen(0, camera, viewportWidth);

  return (
    <div
      ref={viewportRef}
      data-testid="world-viewport"
      className="relative h-full w-full touch-none overflow-hidden bg-white cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div data-testid="world-axis" className="absolute top-1/2 left-0 h-px w-full bg-black" />

      <div
        data-testid="world-fulcrum"
        className="absolute top-1/2 h-0 w-0 border-x-[6px] border-b-[9px] border-x-transparent border-b-black"
        style={{ left: fulcrumScreenX, transform: "translate(-50%, 1px)" }}
      />

      {ticks.map((value) => (
        <div
          key={value}
          data-testid="world-tick"
          className="absolute top-1/2 flex -translate-x-1/2 flex-col items-center pt-3"
          style={{ left: worldToScreen(value, camera, viewportWidth) }}
        >
          <div className="h-2 w-px bg-neutral-400" />
          <span className="mt-1 text-xs text-neutral-600">{value}</span>
        </div>
      ))}
    </div>
  );
}
