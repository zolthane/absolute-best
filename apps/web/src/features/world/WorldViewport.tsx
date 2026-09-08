import {
  computeNiceTicks,
  filterByVisibleRange,
  logScale,
  screenToWorld,
  worldToScreen,
} from "@teeter/shared";
import { useEffect, useRef, useState } from "react";
import { type Item, mockItems } from "../../data/mockItems";
import { useCameraStore } from "./cameraStore";
import { ItemDot } from "./ItemDot";

interface Point {
  x: number;
  y: number;
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Batch 1 has no items yet. Positioning the axis low leaves headroom above
// it for the vote-count (Y) axis due in batch 2, which grows upward with no
// ceiling - most items will end up above the line, not below it. Revisit
// once real data shows how tall that distribution actually gets.
const AXIS_TOP_PERCENT = 80;

// Denser than a first guess would suggest, tuned after seeing it on screen.
// Will likely need retuning once real items compete for the same space.
const TICK_TARGET_COUNT = 12;

// Ticks (and the axis line itself) are rendered for a much wider range than
// is actually visible - roughly 2 extra screens each side - so that a live
// pan preview (see the pointer handlers below) never drags a visible gap
// into view before the gesture commits and a fresh set is computed.
const PAN_BUFFER_FACTOR = 2;

// How many voters the single most-voted item on screen would need before
// its dot reaches the very top of its headroom. Chosen per render from the
// actual data instead, so this is only the floor for an otherwise-empty map.
const MIN_VOTER_DOMAIN_MAX = 10;

interface WorldViewportProps {
  // Overridable so tests can render a small, known set of items instead of
  // the real ~200-item mock data set - the mock data's own exact positions
  // are an implementation detail this component should not be coupled to.
  items?: Item[];
}

export function WorldViewport({ items = mockItems }: WorldViewportProps) {
  const camera = useCameraStore((state) => state.camera);
  const viewportWidth = useCameraStore((state) => state.viewportWidth);
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);

  const viewportRef = useRef<HTMLDivElement>(null);
  const worldContentRef = useRef<HTMLDivElement>(null);
  const activePointers = useRef(new Map<number, Point>());
  const panGestureStartX = useRef<number | null>(null);
  const pinchStartDistance = useRef<number | null>(null);

  // The viewport is assumed to fill the browser window (see App.tsx), so
  // window dimensions double as viewport dimensions - this sidesteps
  // getBoundingClientRect, which jsdom cannot measure in component tests.
  useEffect(() => {
    const handleResize = () => {
      useCameraStore.getState().setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
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
      // A trackpad pinch gesture is delivered as a wheel event with ctrlKey
      // set by the browser; its deltaY values are much smaller per event
      // than a mouse wheel notch, so it needs a stronger multiplier to feel
      // like continuous zooming rather than a series of tiny, sluggish steps.
      const sensitivity = event.ctrlKey ? 0.02 : 0.004;
      const zoomFactor = Math.exp(-event.deltaY * sensitivity);
      useCameraStore.getState().zoomAt(event.clientX, zoomFactor);
    };
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, []);

  // Ends a single-pointer pan gesture, if one is in progress: commits the
  // total drag distance to the camera store in one call, then clears the
  // live preview transform. Safe to call unconditionally - a no-op when
  // there was no pan to end (mid-pinch, or nothing happening at all).
  const endPanIfActive = (finalClientX: number) => {
    if (panGestureStartX.current !== null) {
      const finalDelta = finalClientX - panGestureStartX.current;
      if (finalDelta !== 0) {
        useCameraStore.getState().pan(finalDelta);
      }
      panGestureStartX.current = null;
    }
    if (worldContentRef.current) {
      worldContentRef.current.style.transform = "";
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.current.size === 1) {
      panGestureStartX.current = event.clientX;
      pinchStartDistance.current = null;
    } else if (activePointers.current.size === 2) {
      const [a, b] = [...activePointers.current.values()];
      if (a && b) {
        endPanIfActive(a.x);
        pinchStartDistance.current = distanceBetween(a, b);
      }
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(event.pointerId)) {
      return;
    }
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.current.size === 1 && panGestureStartX.current !== null) {
      // Only a CSS transform is touched here - no store update, no React
      // re-render - so panning stays smooth regardless of how many pointer
      // events the browser fires per second (trackpads fire a lot of them).
      const liveDeltaX = event.clientX - panGestureStartX.current;
      if (worldContentRef.current) {
        worldContentRef.current.style.transform = `translateX(${liveDeltaX}px)`;
      }
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
    endPanIfActive(event.clientX);
    // A three-finger gesture dropping to two pointers does not resume
    // pinching until both fingers lift and press again - three-finger
    // recovery is outside Stage 0's scope, and this stays a safe no-op.
    pinchStartDistance.current = null;

    if (activePointers.current.size === 1) {
      const [remaining] = [...activePointers.current.values()];
      panGestureStartX.current = remaining ? remaining.x : null;
    }
  };

  const visibleMinWorld = screenToWorld(0, camera, viewportWidth);
  const visibleMaxWorld = screenToWorld(viewportWidth, camera, viewportWidth);
  const visibleWorldWidth = visibleMaxWorld - visibleMinWorld;
  const bufferWorldWidth = visibleWorldWidth * PAN_BUFFER_FACTOR;
  const ticks = computeNiceTicks(
    visibleMinWorld - bufferWorldWidth,
    visibleMaxWorld + bufferWorldWidth,
    TICK_TARGET_COUNT * (1 + 2 * PAN_BUFFER_FACTOR),
    // A score is always a whole number (product spec, rule R2) - a label
    // like "48.5" would not correspond to anything that could actually exist.
    1,
  );
  const fulcrumScreenX = worldToScreen(0, camera, viewportWidth);

  const visibleItems = filterByVisibleRange(
    items,
    visibleMinWorld - bufferWorldWidth,
    visibleMaxWorld + bufferWorldWidth,
  );

  const axisTopPx = (AXIS_TOP_PERCENT / 100) * viewportHeight;
  // 90% of the headroom above the line, leaving a small margin so the
  // single most-voted item never touches the very top edge of the screen.
  const maxDotHeightAboveAxis = axisTopPx * 0.9;
  const maxVoterCount = Math.max(MIN_VOTER_DOMAIN_MAX, ...items.map((item) => item.voterCount));

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: keyboard access to the map is tracked as Stage 1 work (docs/05-supporting-features.md, decision S6), not built yet.
    <div
      ref={viewportRef}
      data-testid="world-viewport"
      className="relative h-full w-full touch-none select-none overflow-hidden bg-white cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDragStart={(event) => event.preventDefault()}
    >
      <div ref={worldContentRef} data-testid="world-content" className="absolute inset-0">
        <div
          data-testid="world-axis"
          className="absolute h-0.5 bg-black"
          style={{
            // Deliberately wider than the viewport, by the same buffer as
            // the ticks: a bar exactly viewport-wide, translated during a
            // drag, would pull its trailing edge away from the screen edge
            // and leave a visible gap - this has no such edge to reveal.
            left: -viewportWidth * PAN_BUFFER_FACTOR,
            width: viewportWidth * (1 + 2 * PAN_BUFFER_FACTOR),
            top: `${AXIS_TOP_PERCENT}%`,
          }}
        />

        <div
          data-testid="world-fulcrum"
          className="absolute h-0 w-0 border-x-[6px] border-b-[9px] border-x-transparent border-b-black"
          style={{
            left: fulcrumScreenX,
            top: `${AXIS_TOP_PERCENT}%`,
            transform: "translate(-50%, 3px)",
          }}
        />

        {ticks.map((value) => (
          <div
            key={value}
            data-testid="world-tick"
            className="absolute flex -translate-x-1/2 flex-col items-center pt-4"
            style={{
              left: worldToScreen(value, camera, viewportWidth),
              top: `${AXIS_TOP_PERCENT}%`,
            }}
          >
            <div className="h-2 w-px bg-neutral-400" />
            <span className="mt-1 font-semibold text-[10px] text-neutral-700">{value}</span>
          </div>
        ))}

        {visibleItems.map((item) => (
          <ItemDot
            key={item.id}
            screenX={worldToScreen(item.score, camera, viewportWidth)}
            screenY={
              axisTopPx - logScale(item.voterCount, 1, maxVoterCount, 0, maxDotHeightAboveAxis)
            }
          />
        ))}
      </div>
    </div>
  );
}
