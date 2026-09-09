import {
  cameraToUrlParams,
  computeFocusCamera,
  computeNiceTicks,
  declutterLabels,
  filterByVisibleRange,
  type GridCellAssignment,
  type LabelCandidate,
  logScale,
  minZoomYForItems,
  nextGridZoom,
  sampleGrid,
  screenToWorld,
  screenToWorldY,
  type VerticalCamera,
  verticalCameraToUrlParams,
  worldPositionToCellIndex,
  worldToScreen,
  worldToScreenY,
} from "@teeter/shared";
import { useEffect, useRef, useState } from "react";
import { type Item, mockItems } from "../../data/mockItems";
import { useAuthStore } from "../auth/authStore";
import { isItemVotable } from "../auth/voteState";
import { useCameraStore } from "./cameraStore";
import { ItemCard } from "./ItemCard";
import { ItemDot } from "./ItemDot";

interface Point {
  x: number;
  y: number;
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatVoterTickLabel(decade: number): string {
  return (10 ** decade).toLocaleString();
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

// How far a single pointer must move before a gesture counts as a drag
// rather than a click/tap. Below this, pointer capture is never taken - see
// handlePointerMove's comment for why that matters for clicking an item.
const DRAG_THRESHOLD_PX = 4;

// Product spec section 2: ~40x40 screen pixels per grid cell, at any zoom.
const GRID_CELL_SIZE_PX = 40;

// A cell holding this many items or more is treated as "maximally crowded"
// for sizing and darkening purposes - beyond it, a dot simply stays at its
// largest, darkest state rather than continuing to grow without bound.
const MAX_CELL_DENSITY_FOR_STYLING = 50;
const DOT_MIN_SIZE_PX = 8;
const DOT_MAX_SIZE_PX = 22;
const DOT_MIN_OPACITY = 0.45;

// A rough estimate of a label's on-screen box, used only to decide whether
// two labels would collide (labelDeclutter.ts) - not exact text
// measurement, the same fixed-estimate approach ItemCard already uses for
// its own flip-above/below decision.
const LABEL_CHAR_WIDTH_PX = 5.5;
const LABEL_TEXT_PADDING_PX = 6;
const LABEL_HEIGHT_PX = 14;

interface GridItem extends GridCellAssignment {
  item: Item;
  screenX: number;
  screenY: number;
}

// Product spec Q3b: most-voted represents the cell; ties broken by oldest,
// simply for a fully deterministic tiebreaker (any consistent rule would
// serve the same stability goal - this happens to be the one chosen).
function compareGridItems(a: GridItem, b: GridItem): number {
  return a.item.voterCount !== b.item.voterCount
    ? b.item.voterCount - a.item.voterCount
    : a.item.order - b.item.order;
}

interface WorldViewportProps {
  // Overridable so tests can render a small, known set of items instead of
  // the real ~500-item mock data set - the mock data's own exact positions
  // are an implementation detail this component should not be coupled to.
  items?: Item[];
}

export function WorldViewport({ items = mockItems }: WorldViewportProps) {
  const camera = useCameraStore((state) => state.camera);
  const cameraY = useCameraStore((state) => state.cameraY);
  const viewportWidth = useCameraStore((state) => state.viewportWidth);
  const viewportHeight = useCameraStore((state) => state.viewportHeight);
  const isLoggedIn = useAuthStore((state) => state.username !== null);
  // Just the id, not the whole GridItem: that object's screenX/screenY would
  // go stale if the camera moves while hovering (e.g. zooming with the wheel
  // without moving the mouse) - looking it up fresh from `cells` every
  // render keeps the card's position always current.
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const worldContentRef = useRef<HTMLDivElement>(null);
  const activePointers = useRef(new Map<number, Point>());
  const panGestureStart = useRef<Point | null>(null);
  const pinchStartDistance = useRef<number | null>(null);
  // The zoom the grid last used - deliberately separate from the camera's
  // own zoom, so nextGridZoom can hold it still against noise. See
  // nextGridZoom's doc comment for why. One per axis, since X and Y now
  // zoom independently (batch 6b).
  const gridZoomRef = useRef(camera.zoom);
  const gridZoomYRef = useRef(cameraY.zoomY);

  // The viewport is assumed to fill the browser window (see App.tsx), so
  // window dimensions double as viewport dimensions - this sidesteps
  // getBoundingClientRect, which jsdom cannot measure in component tests.
  useEffect(() => {
    const handleResize = () => {
      useCameraStore.getState().setViewportWidth(window.innerWidth);
      useCameraStore.getState().setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const axisTopPx = (AXIS_TOP_PERCENT / 100) * viewportHeight;
  // The floor vertical zoom can never go below - see minZoomYForItems.
  const minZoomY = minZoomYForItems(items, viewportHeight);

  // Pan bounds (batch 6b): panning or zooming out can reveal empty space
  // beyond the data, but never more than half a screen of it on either
  // side - a "there's nothing more to see this way" guardrail for both
  // axes. Half a screen's worth of world-units depends on the current zoom,
  // so this is recomputed every render, not a fixed constant.
  const scores = items.map((item) => item.score);
  const minScore = scores.length > 0 ? Math.min(...scores) : Number.NEGATIVE_INFINITY;
  const maxScore = scores.length > 0 ? Math.max(...scores) : Number.POSITIVE_INFINITY;
  const halfScreenWorldX = viewportWidth / 2 / camera.zoom;
  const minCenterX = minScore - halfScreenWorldX;
  const maxCenterX = maxScore + halfScreenWorldX;

  const maxVoterCount = Math.max(1, ...items.map((item) => item.voterCount));
  const maxWorldY = Math.log10(maxVoterCount);
  const halfScreenWorldY = viewportHeight / 2 / cameraY.zoomY;
  const minCenterY = 0 - halfScreenWorldY;
  const maxCenterY = maxWorldY + halfScreenWorldY;

  // Read by the wheel listener below, which is registered once (not on every
  // render) so it isn't re-attached on every zoom tick - see its own comment.
  const latestRef = useRef({ axisTopPx, minZoomY, minCenterX, maxCenterX, minCenterY, maxCenterY });
  latestRef.current = { axisTopPx, minZoomY, minCenterX, maxCenterX, minCenterY, maxCenterY };

  // A native, non-passive listener: React's synthetic onWheel is attached
  // passively, so calling preventDefault() there is silently ignored (and
  // logs a console warning) instead of stopping the page from scrolling.
  // Registered once (empty deps) and reads latestRef for anything that can
  // change between renders, rather than re-registering on every one of
  // those changes (which would include every zoom tick).
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
      const latest = latestRef.current;
      useCameraStore
        .getState()
        .zoomAt(event.clientX, zoomFactor, latest.minCenterX, latest.maxCenterX);
      useCameraStore
        .getState()
        .zoomAtY(
          event.clientY,
          latest.axisTopPx,
          zoomFactor,
          latest.minZoomY,
          latest.minCenterY,
          latest.maxCenterY,
        );
    };
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, []);

  // Keeps the address bar in sync with the camera (product spec, section 3:
  // the camera position is a shareable link). replaceState, not pushState -
  // panning around should not fill the browser's back button with history.
  useEffect(() => {
    const params = cameraToUrlParams(camera);
    const verticalParams = verticalCameraToUrlParams(cameraY);
    for (const [key, value] of verticalParams) {
      params.set(key, value);
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [camera, cameraY]);

  // Ends a pan gesture, if one is in progress: commits the total drag
  // distance to the camera store in one call per axis, then clears the live
  // preview transform. Safe to call unconditionally - a no-op when there was
  // no pan to end (mid-pinch, or nothing happening at all).
  const endPanIfActive = (finalClientX: number, finalClientY: number) => {
    if (panGestureStart.current !== null) {
      const finalDeltaX = finalClientX - panGestureStart.current.x;
      const finalDeltaY = finalClientY - panGestureStart.current.y;
      if (finalDeltaX !== 0) {
        useCameraStore.getState().pan(finalDeltaX, minCenterX, maxCenterX);
      }
      if (finalDeltaY !== 0) {
        useCameraStore.getState().panY(finalDeltaY, minCenterY, maxCenterY);
      }
      panGestureStart.current = null;
    }
    if (worldContentRef.current) {
      worldContentRef.current.style.transform = "";
    }
  };

  // What panCamera/panCameraY would actually do with `delta`, once their own
  // pan-bound clamp is applied - used to make the live drag preview stop at
  // the same boundary in real time, instead of rubber-banding back to it
  // only once the gesture commits.
  const clampedPanDelta = (
    currentCenter: number,
    zoom: number,
    delta: number,
    minCenter: number,
    maxCenter: number,
  ): number => {
    const rawCenter = currentCenter - delta / zoom;
    const clampedCenter = Math.min(maxCenter, Math.max(minCenter, rawCenter));
    return (currentCenter - clampedCenter) * zoom;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.current.size === 1) {
      // Pointer capture is deliberately NOT taken here - only once real drag
      // movement is confirmed, in handlePointerMove. Capturing immediately
      // would retarget the click event a plain tap ends with to this div
      // instead of whichever item dot was actually clicked, silently
      // breaking "click an item to focus it" for every click, moved or not.
      panGestureStart.current = { x: event.clientX, y: event.clientY };
      pinchStartDistance.current = null;
    } else if (activePointers.current.size === 2) {
      const [a, b] = [...activePointers.current.values()];
      if (a && b) {
        endPanIfActive(a.x, a.y);
        pinchStartDistance.current = distanceBetween(a, b);
        // A pinch always involves both pointers moving, so there is no
        // click to protect here - capturing immediately is safe.
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(event.pointerId)) {
      return;
    }
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.current.size === 1 && panGestureStart.current !== null) {
      const rawDeltaX = event.clientX - panGestureStart.current.x;
      const rawDeltaY = event.clientY - panGestureStart.current.y;
      // Once the pointer has genuinely moved, this is a drag rather than a
      // tap - safe to start capturing it now (harmless to call again on
      // every subsequent move of the same drag). Checked as a 2D distance
      // so a purely vertical drag counts too, not just a horizontal one.
      if (distanceBetween({ x: rawDeltaX, y: rawDeltaY }, { x: 0, y: 0 }) >= DRAG_THRESHOLD_PX) {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }
      // Clamped the same way the eventual commit will be, so the preview
      // stops at the pan boundary in real time instead of rubber-banding
      // back once the gesture ends.
      const liveDeltaX = clampedPanDelta(
        camera.center,
        camera.zoom,
        rawDeltaX,
        minCenterX,
        maxCenterX,
      );
      const liveDeltaY = clampedPanDelta(
        cameraY.centerY,
        cameraY.zoomY,
        rawDeltaY,
        minCenterY,
        maxCenterY,
      );
      // Only a CSS transform is touched here - no store update, no React
      // re-render - so panning stays smooth regardless of how many pointer
      // events the browser fires per second (trackpads fire a lot of them).
      if (worldContentRef.current) {
        worldContentRef.current.style.transform = `translate(${liveDeltaX}px, ${liveDeltaY}px)`;
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
        const midpointY = (a.y + b.y) / 2;
        useCameraStore.getState().zoomAt(midpointX, zoomFactor, minCenterX, maxCenterX);
        useCameraStore
          .getState()
          .zoomAtY(midpointY, axisTopPx, zoomFactor, minZoomY, minCenterY, maxCenterY);
      }
      pinchStartDistance.current = distance;
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    activePointers.current.delete(event.pointerId);
    endPanIfActive(event.clientX, event.clientY);
    // A three-finger gesture dropping to two pointers does not resume
    // pinching until both fingers lift and press again - three-finger
    // recovery is outside Stage 0's scope, and this stays a safe no-op.
    pinchStartDistance.current = null;

    if (activePointers.current.size === 1) {
      const [remaining] = [...activePointers.current.values()];
      panGestureStart.current = remaining ? { x: remaining.x, y: remaining.y } : null;
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

  // Voter-count ticks are powers of ten (product spec: "each step up means
  // ten times as many voters") rather than computeNiceTicks' linear "nice
  // numbers" - one tick per decade currently in view, plus the same
  // pan-buffer margin the X ticks use.
  const visibleMinWorldY = screenToWorldY(viewportHeight, cameraY, axisTopPx);
  const visibleMaxWorldY = screenToWorldY(0, cameraY, axisTopPx);
  const bufferWorldHeight = (visibleMaxWorldY - visibleMinWorldY) * PAN_BUFFER_FACTOR;
  const yTickMinDecade = Math.max(0, Math.floor(visibleMinWorldY - bufferWorldHeight));
  const yTickMaxDecade = Math.max(yTickMinDecade, Math.ceil(visibleMaxWorldY + bufferWorldHeight));
  const yTicks: number[] = [];
  for (let decade = yTickMinDecade; decade <= yTickMaxDecade; decade++) {
    yTicks.push(decade);
  }

  const visibleItems = filterByVisibleRange(
    items,
    visibleMinWorld - bufferWorldWidth,
    visibleMaxWorld + bufferWorldWidth,
  );

  // Only moves once the real camera zoom has drifted meaningfully away from
  // this - see nextGridZoom's doc comment for why that stops zoom noise from
  // flipping a crowded cell's membership back and forth. One per axis, now
  // that Y has its own independent zoom.
  gridZoomRef.current = nextGridZoom(gridZoomRef.current, camera.zoom);
  const gridZoom = gridZoomRef.current;
  gridZoomYRef.current = nextGridZoom(gridZoomYRef.current, cameraY.zoomY);
  const gridZoomY = gridZoomYRef.current;

  const gridItems: GridItem[] = visibleItems.map((item) => {
    // logScale's old domainMin of 1 meant 0 and 1 voter mapped to the same
    // screen position - the axis line itself. Kept here for the same reason
    // it was kept before: Stage 0's mock data doesn't enforce "a score means
    // at least one vote" either (see mockItems.ts), and real votes make a
    // 0-voter item with a nonzero score impossible by construction.
    const worldY = Math.log10(Math.max(item.voterCount, 1));
    return {
      item,
      screenX: worldToScreen(item.score, camera, viewportWidth),
      screenY: worldToScreenY(worldY, cameraY, axisTopPx),
      // Both axes are now anchored in world space (zoom-derived cell size,
      // no pan term at all), so panning either one cannot reshuffle a
      // cell's contents - the same property batch 3 established for X.
      cellCol: worldPositionToCellIndex(item.score, gridZoom, GRID_CELL_SIZE_PX),
      cellRow: worldPositionToCellIndex(worldY, gridZoomY, GRID_CELL_SIZE_PX),
    };
  });
  const cells = sampleGrid(gridItems, compareGridItems);
  const hoveredCell = cells.find((cell) => cell.representative.item.id === hoveredItemId);

  const cellRenderData = cells.map(({ representative, count }) => ({
    representative,
    count,
    sizePx: logScale(count, 1, MAX_CELL_DENSITY_FOR_STYLING, DOT_MIN_SIZE_PX, DOT_MAX_SIZE_PX),
    opacity: logScale(count, 1, MAX_CELL_DENSITY_FOR_STYLING, DOT_MIN_OPACITY, 1),
  }));

  // Every cell is a label candidate now, not just a lone item's - a crowded
  // cell shows its representative's name too ("Title +N"), so a group that
  // can never be split by zoom (an exact score-and-voter-count tie, however
  // rare) still isn't permanently silent. See labelDeclutter.ts for the
  // collision rule that decides which of these actually get drawn.
  const labelText = (representative: GridItem, count: number): string =>
    count > 1 ? `${representative.item.title} +${count - 1}` : representative.item.title;

  const labelCandidates: LabelCandidate[] = cellRenderData.map(
    ({ representative, count, sizePx }) => ({
      id: representative.item.id,
      screenX: representative.screenX,
      screenY: representative.screenY,
      dotSizePx: sizePx,
      // A more-established item keeps its label when two would collide.
      priority: representative.item.voterCount,
      labelWidthPx:
        labelText(representative, count).length * LABEL_CHAR_WIDTH_PX + LABEL_TEXT_PADDING_PX,
      labelHeightPx: LABEL_HEIGHT_PX,
    }),
  );
  const shownLabelIds = declutterLabels(labelCandidates, labelCandidates);

  const handleDotSelect = (item: Item) => {
    const targetCamera = computeFocusCamera(item, items, viewportWidth);
    const targetCameraY: VerticalCamera = {
      centerY: Math.log10(Math.max(item.voterCount, 1)),
      // Focusing recentres vertically but keeps the current vertical zoom -
      // the product spec's "20 items either side" rule for X has no obvious
      // Y equivalent, so this doesn't invent one.
      zoomY: cameraY.zoomY,
    };
    useCameraStore.getState().animateTo(targetCamera, targetCameraY);
  };

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
        {ticks.map((value) => (
          <div
            key={`grid-x-${value}`}
            data-testid="world-grid-line-x"
            className="absolute w-px bg-neutral-200"
            style={{
              left: worldToScreen(value, camera, viewportWidth),
              top: -viewportHeight * PAN_BUFFER_FACTOR,
              height: viewportHeight * (1 + 2 * PAN_BUFFER_FACTOR),
            }}
          />
        ))}

        {yTicks.map((decade) => (
          <div
            key={`grid-y-${decade}`}
            data-testid="world-grid-line-y"
            className="absolute h-px bg-neutral-200"
            style={{
              top: worldToScreenY(decade, cameraY, axisTopPx),
              left: -viewportWidth * PAN_BUFFER_FACTOR,
              width: viewportWidth * (1 + 2 * PAN_BUFFER_FACTOR),
            }}
          />
        ))}

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
            top: axisTopPx,
          }}
        />

        <div
          data-testid="world-fulcrum"
          className="absolute h-0 w-0 border-x-[6px] border-b-[9px] border-x-transparent border-b-black"
          style={{
            left: fulcrumScreenX,
            top: axisTopPx,
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
              top: axisTopPx,
            }}
          >
            <div className="h-2 w-px bg-neutral-400" />
            <span className="mt-1 font-semibold text-[10px] text-neutral-700">{value}</span>
          </div>
        ))}

        {yTicks.map((decade) => (
          <div
            key={`tick-y-${decade}`}
            data-testid="world-tick-y"
            className="absolute flex -translate-y-1/2 items-center gap-1"
            style={{ top: worldToScreenY(decade, cameraY, axisTopPx), left: 4 }}
          >
            <div className="h-px w-2 bg-neutral-400" />
            <span className="font-semibold text-[10px] text-neutral-700">
              {formatVoterTickLabel(decade)}
            </span>
          </div>
        ))}

        {cellRenderData.map(({ representative, count, sizePx, opacity }) => (
          <ItemDot
            key={`${representative.cellCol}:${representative.cellRow}`}
            screenX={representative.screenX}
            screenY={representative.screenY}
            title={labelText(representative, count)}
            showLabel={shownLabelIds.has(representative.item.id)}
            sizePx={sizePx}
            opacity={opacity}
            // hasVoted is always false for now - there is no voting yet
            // (batch 7). The rule itself (R10/R11) is already correct: it
            // just has nothing but "not voted" to apply it to so far.
            isVotable={isItemVotable(isLoggedIn, false)}
            onHoverStart={() => setHoveredItemId(representative.item.id)}
            onHoverEnd={() =>
              setHoveredItemId((current) => (current === representative.item.id ? null : current))
            }
            onSelect={() => handleDotSelect(representative.item)}
          />
        ))}

        {hoveredCell && (
          <ItemCard
            item={hoveredCell.representative.item}
            screenX={hoveredCell.representative.screenX}
            screenY={hoveredCell.representative.screenY}
          />
        )}
      </div>
    </div>
  );
}
