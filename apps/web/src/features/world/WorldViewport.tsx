import {
  cameraToUrlParams,
  computeFocusCamera,
  declutterLabels,
  filterByVisibleRange,
  findPassedItem,
  type GridCellAssignment,
  type LabelCandidate,
  logScale,
  minZoomYForItems,
  nextGridZoom,
  niceStep,
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
import { effectiveItem, useVoteStore } from "../vote/voteStore";
import { currentViewportSize, useCameraStore } from "./cameraStore";
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

// Item dots are positioned as if the ground (1 voter) sat this far down the
// screen, leaving headroom above for the vote-count (Y) axis, which grows
// upward with no ceiling - most items end up above this line, not below it.
// Independent of where the ground LINE is actually drawn (batch 6b pinned
// that to the literal bottom edge instead - see the ruler comment below);
// this is purely the coordinate system items are placed in.
const AXIS_TOP_PERCENT = 80;

// Batch 6b: ticks sit at fixed screen positions - like a ruler laid over the
// map - rather than at their own value's world position, so they no longer
// visibly slide away as you pan; only the number printed at each one
// changes, recomputed from whatever value now falls there. This is the
// rough on-screen spacing aimed for between adjacent ticks; the actual
// spacing is whatever a "nice" step (niceStep) comes closest to it.
const RULER_TICK_SPACING_TARGET_PX = 96;

// A tick this close to the top/bottom/left/right edge of the viewport is
// skipped rather than drawn - its centred label would otherwise be clipped
// in half by the viewport's own edge, as reported for the topmost Y tick.
const TICK_EDGE_MARGIN_PX = 12;

// Item dots are still rendered for a wider range than is actually visible -
// roughly 2 extra screens each side - so that a live pan preview (see the
// pointer handlers below) never drags a visible gap into view before the
// gesture commits and a fresh set is computed. The ruler ticks/gridlines no
// longer need this: they're fixed to the screen, not the world.
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

// The one dot on the map that can actually be grabbed to vote gets a floor
// on its size, bigger than even the largest density-based DOT_MAX_SIZE_PX -
// easier to hit with a mouse, and especially with a finger.
const FOCUSED_VOTABLE_DOT_MIN_PX = 28;

// A rough estimate of a label's on-screen box, used only to decide whether
// two labels would collide (labelDeclutter.ts) - not exact text
// measurement, the same fixed-estimate approach ItemCard already uses for
// its own flip-above/below decision.
const LABEL_CHAR_WIDTH_PX = 5.5;
const LABEL_TEXT_PADDING_PX = 6;
const LABEL_HEIGHT_PX = 14;

// Rule R4: a vote is always the full -10..10 range, centred on the item.
const MAX_VOTE_MAGNITUDE = 10;

// Screen pixels of drag per point of vote delta - deliberately independent
// of camera.zoom (the map's own pan/zoom), which used to drive this: reached
// +-10 only by dragging the full width of the screen at a typical zoomed-out
// level, and on a narrow phone screen, the far end of that range could fall
// outside the screen entirely. A fixed sensitivity keeps the whole gesture
// within a comfortable, thumb-reachable distance regardless of zoom level or
// screen size - the full +-10 range now takes at most 12*10 = 120px either
// side of the start point (the focused item's dot, which focusing always
// centres - see handleDotSelect), comfortably inside even a narrow phone
// screen held upright (reported: 200px reached past the edge on one).
const VOTE_DRAG_PX_PER_POINT = 12;

// On casting a vote, the vertical camera zooms out (if it needs to) so both
// the item's old and new position - it moves up by one step of voterCount,
// which the log scale can turn into a large jump for a low-voter item - stay
// within this fraction of the viewport's height. Reported as the item simply
// disappearing off-screen after voting, at a zoom level that made sense for
// its position before the vote but not after.
const VOTE_ZOOM_OUT_FRACTION = 0.5;

// Added to a crowded cell's (count > 1) label priority, per extra item past
// the first - large enough to always beat the highest realistic voterCount,
// so an exact score-and-voter-count tie (which can never be split by any
// zoom - see grid.ts) reliably wins its label over any single lone item
// nearby, rather than losing to whichever one happens to have more voters.
// Without this, the tie clusters that are all but guaranteed to occur among
// low-voter-count items (a single vote has only 21 possible scores) almost
// always lost the label-collision fight, since their voterCount was the
// lowest in the whole dataset.
const CROWDED_CELL_LABEL_PRIORITY_BONUS = 1_000_000;

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
  const votes = useVoteStore((state) => state.votes);
  const settlingScores = useVoteStore((state) => state.settlingScores);
  // Just the id, not the whole GridItem: that object's screenX/screenY would
  // go stale if the camera moves while hovering (e.g. zooming with the wheel
  // without moving the mouse) - looking it up fresh from `cells` every
  // render keeps the card's position always current.
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  // Product spec section 3: the chosen item stays highlighted and shows its
  // name/score - a separate, more persistent concept from hover. Only the
  // focused item's dot can ever be grabbed to vote (section 4).
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  // The in-progress drag (batch 7): present only while a pointer that
  // started on the focused, votable dot is actually being dragged.
  const [voteDrag, setVoteDrag] = useState<{ itemId: string; delta: number } | null>(null);
  // What's left once that pointer is released, before Submit is pressed
  // (rule R9: releasing does not vote). Cleared on Submit or on refocusing
  // a different item - re-dragging the same one starts fresh (rule R4).
  const [pendingVote, setPendingVote] = useState<{ itemId: string; delta: number } | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const worldContentRef = useRef<HTMLDivElement>(null);
  const activePointers = useRef(new Map<number, Point>());
  const panGestureStart = useRef<Point | null>(null);
  const pinchStartDistance = useRef<number | null>(null);
  // Which pointer, if any, is currently dragging the focused item to vote -
  // kept separate from activePointers so the vote gesture and the pan/pinch
  // gesture never fight over the same bookkeeping.
  const votingPointerId = useRef<number | null>(null);
  const voteDragStartClientX = useRef<number | null>(null);
  // Whether the current single-pointer gesture has moved past the drag
  // threshold - used to tell a genuine tap on empty space (which should
  // un-focus) apart from a pan that happened to end over empty space (which
  // should not). Reset at the start of every new single-pointer gesture.
  const backgroundWasDraggedRef = useRef(false);
  // The zoom the grid last used - deliberately separate from the camera's
  // own zoom, so nextGridZoom can hold it still against noise. See
  // nextGridZoom's doc comment for why. One per axis, since X and Y now
  // zoom independently (batch 6b).
  const gridZoomRef = useRef(camera.zoom);
  const gridZoomYRef = useRef(cameraY.zoomY);

  // The viewport is assumed to fill the browser window (see App.tsx), so
  // window dimensions double as viewport dimensions - this sidesteps
  // getBoundingClientRect, which jsdom cannot measure in component tests.
  // currentViewportSize (not window.innerWidth/innerHeight directly) and the
  // extra visualViewport/orientationchange listeners exist for the same
  // reason: a plain "resize" listener with window.innerWidth/innerHeight can
  // report a stale size for a moment right after rotating on mobile -
  // reported as the item card sometimes not showing, or the page getting
  // stuck scrolled to a focused button.
  useEffect(() => {
    const handleResize = () => {
      const { width, height } = currentViewportSize();
      useCameraStore.getState().setViewportWidth(width);
      useCameraStore.getState().setViewportHeight(height);
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  // The item as it should actually be positioned/displayed: unchanged
  // unless a vote landed on it, in which case its score/voter count reflect
  // that (mid-settle-animation or final) rather than the raw generated
  // value. Computed once and used everywhere below instead of `items`
  // directly, so a cast vote is reflected consistently in positioning,
  // grid membership, and the card - not special-cased in each place.
  const effectiveItems = items.map((item) => effectiveItem(item, votes, settlingScores));

  const axisTopPx = (AXIS_TOP_PERCENT / 100) * viewportHeight;
  // The floor vertical zoom can never go below - see minZoomYForItems.
  const minZoomY = minZoomYForItems(effectiveItems, viewportHeight);

  // Pan bounds (batch 6b): panning or zooming out can reveal empty space
  // beyond the data, but never more than half a screen of it on either
  // side - a "there's nothing more to see this way" guardrail for both
  // axes. Half a screen's worth of world-units depends on the current zoom,
  // so this is recomputed every render, not a fixed constant.
  const scores = effectiveItems.map((item) => item.score);
  const minScore = scores.length > 0 ? Math.min(...scores) : Number.NEGATIVE_INFINITY;
  const maxScore = scores.length > 0 ? Math.max(...scores) : Number.POSITIVE_INFINITY;
  const halfScreenWorldX = viewportWidth / 2 / camera.zoom;
  const minCenterX = minScore - halfScreenWorldX;
  const maxCenterX = maxScore + halfScreenWorldX;

  const maxVoterCount = Math.max(1, ...effectiveItems.map((item) => item.voterCount));
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
    const targetItemId = (event.target as HTMLElement).dataset.itemId;
    if (
      activePointers.current.size === 0 &&
      votingPointerId.current === null &&
      targetItemId !== undefined &&
      targetItemId === focusedItemId &&
      isItemVotable(isLoggedIn, votes[targetItemId] !== undefined)
    ) {
      // Grabbing the focused, votable item itself - a vote drag, not a pan.
      // Pointer capture is deliberately deferred to handlePointerMove, for
      // the same reason panning defers it below: capturing immediately
      // would retarget the click a plain tap ends with away from the dot.
      votingPointerId.current = event.pointerId;
      voteDragStartClientX.current = event.clientX;
      return;
    }

    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.current.size === 1) {
      // Pointer capture is deliberately NOT taken here - only once real drag
      // movement is confirmed, in handlePointerMove. Capturing immediately
      // would retarget the click event a plain tap ends with to this div
      // instead of whichever item dot was actually clicked, silently
      // breaking "click an item to focus it" for every click, moved or not.
      panGestureStart.current = { x: event.clientX, y: event.clientY };
      pinchStartDistance.current = null;
      backgroundWasDraggedRef.current = false;
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
    if (event.pointerId === votingPointerId.current) {
      if (focusedItemId === null || voteDragStartClientX.current === null) {
        return;
      }
      const rawDeltaPx = event.clientX - voteDragStartClientX.current;
      // Same "has this genuinely moved yet" guard panning uses - a plain
      // tap on the already-focused dot should not pop up a "+0" preview.
      if (voteDrag !== null || Math.abs(rawDeltaPx) >= DRAG_THRESHOLD_PX) {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        const rawDeltaScore = rawDeltaPx / VOTE_DRAG_PX_PER_POINT;
        const clampedDelta = Math.max(
          -MAX_VOTE_MAGNITUDE,
          Math.min(MAX_VOTE_MAGNITUDE, Math.round(rawDeltaScore)),
        );
        setVoteDrag({ itemId: focusedItemId, delta: clampedDelta });
      }
      return;
    }

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
        backgroundWasDraggedRef.current = true;
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
    if (event.pointerId === votingPointerId.current) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      // Releasing does not vote (rule R9) - the drag becomes a pending
      // preview with a Submit button, unless it never crossed the drag
      // threshold at all (voteDrag stayed null - just a tap).
      if (voteDrag !== null) {
        setPendingVote(voteDrag);
      }
      setVoteDrag(null);
      votingPointerId.current = null;
      voteDragStartClientX.current = null;
      return;
    }

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
  const fulcrumScreenX = worldToScreen(0, camera, viewportWidth);

  // Fixed screen columns (batch 6b's ruler - see its comment above), one
  // roughly every RULER_TICK_SPACING_TARGET_PX. worldStepX is rounded up to
  // a "nice" value so labels read as 20, 50, 100 rather than 19, 51, 103,
  // floored to 1 since a score is always a whole number (rule R2).
  const worldStepX = Math.max(1, niceStep(RULER_TICK_SPACING_TARGET_PX / camera.zoom));
  const pixelSpacingX = worldStepX * camera.zoom;
  const columnsX: number[] = [];
  for (let x = 0; x <= viewportWidth; x += pixelSpacingX) {
    // Skips a column too close to the left/right edge - its centred label
    // would otherwise be clipped in half by the viewport's own edge.
    if (x >= TICK_EDGE_MARGIN_PX && x <= viewportWidth - TICK_EDGE_MARGIN_PX) {
      columnsX.push(x);
    }
  }

  // Same idea for Y, but the step stays a whole number of decades (product
  // spec: "each step up means ten times as many voters") rather than an
  // arbitrary nice number, so labels stay powers of ten.
  const decadeStepY = Math.max(1, niceStep(RULER_TICK_SPACING_TARGET_PX / cameraY.zoomY));
  const pixelSpacingY = decadeStepY * cameraY.zoomY;
  const rowsY: number[] = [];
  for (let y = 0; y <= viewportHeight; y += pixelSpacingY) {
    // Same edge guard as X, top and bottom - reported as the top-most voter
    // count label being cut in half against the top of the screen.
    if (y >= TICK_EDGE_MARGIN_PX && y <= viewportHeight - TICK_EDGE_MARGIN_PX) {
      rowsY.push(y);
    }
  }

  const visibleItems = filterByVisibleRange(
    effectiveItems,
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

  // Normally the cell's own representative (compareGridItems' pick) is what
  // gets drawn - but if the item the user has actually focused is merely
  // one of this cell's other members (picked from the "sharing this spot"
  // list - see the alternates block below), that one is shown/interactive
  // instead. This is what makes an otherwise-unreachable tied member
  // (an exact score-and-voter-count match, invisible to any zoom) something
  // you can actually select, vote on, and see a dot move for.
  const cellRenderData = cells.map((cell) => {
    const representative =
      cell.members.find((member) => member.item.id === focusedItemId) ?? cell.representative;
    return {
      representative,
      members: cell.members,
      count: cell.count,
      sizePx: logScale(
        cell.count,
        1,
        MAX_CELL_DENSITY_FOR_STYLING,
        DOT_MIN_SIZE_PX,
        DOT_MAX_SIZE_PX,
      ),
      opacity: logScale(cell.count, 1, MAX_CELL_DENSITY_FOR_STYLING, DOT_MIN_OPACITY, 1),
    };
  });

  // The focused item's card stays visible even when it isn't hovered
  // (product spec section 3: it "shows its name and current score") -
  // hovering something else still takes priority.
  // While a vote is being dragged or is pending Submit, its card must stay
  // put regardless of what the pointer happens to be hovering - the dot
  // itself deliberately doesn't move during a drag (see the drag handler's
  // comment), so the cursor is often no longer over it, and can easily end
  // up over a different item's dot instead. Without this, the Submit button
  // would silently vanish (replaced by whatever's incidentally hovered)
  // depending on exactly where the pointer was released.
  const votingItemId = voteDrag?.itemId ?? pendingVote?.itemId ?? null;
  const cardTargetId = votingItemId ?? hoveredItemId ?? focusedItemId;
  const cardCell = cellRenderData.find((data) => data.representative.item.id === cardTargetId);

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
      // A more-established item keeps its label when two would collide -
      // except a crowded (tied) cell, which always wins instead: see
      // CROWDED_CELL_LABEL_PRIORITY_BONUS's comment for why.
      priority:
        representative.item.voterCount +
        (count > 1 ? count * CROWDED_CELL_LABEL_PRIORITY_BONUS : 0),
      labelWidthPx:
        labelText(representative, count).length * LABEL_CHAR_WIDTH_PX + LABEL_TEXT_PADDING_PX,
      labelHeightPx: LABEL_HEIGHT_PX,
    }),
  );
  const shownLabelIds = declutterLabels(labelCandidates, labelCandidates);

  const handleDotSelect = (item: Item) => {
    // Switching focus abandons any unsubmitted vote preview (nothing was
    // cast - rule R9) - but re-clicking the item already focused must not
    // wipe out a pending vote it's still showing.
    if (item.id !== focusedItemId) {
      setVoteDrag(null);
      setPendingVote(null);
    }
    setFocusedItemId(item.id);

    const targetCamera = computeFocusCamera(item, effectiveItems, viewportWidth);
    const targetCameraY: VerticalCamera = {
      centerY: Math.log10(Math.max(item.voterCount, 1)),
      // Focusing recentres vertically but keeps the current vertical zoom -
      // the product spec's "20 items either side" rule for X has no obvious
      // Y equivalent, so this doesn't invent one.
      zoomY: cameraY.zoomY,
    };
    useCameraStore.getState().animateTo(targetCamera, targetCameraY);
  };

  // Switches focus to a different member of the currently-shown crowded
  // cell, picked from the card's "sharing this spot" list - see
  // cellRenderData's comment for how that then becomes the shown/interactive
  // dot in this cell instead.
  const handleSelectAlternate = (itemId: string) => {
    const item = effectiveItems.find((candidate) => candidate.id === itemId);
    if (item) {
      handleDotSelect(item);
    }
  };

  // Clicking empty space un-focuses whatever was focused - checked by
  // identity rather than e.g. stopping propagation on the dot, so a click
  // that bubbles up from a dot (or its label) is correctly told apart from
  // one that landed directly on the background. Bound to world-content (see
  // its ref below), not the outer viewport div: world-content is an
  // `inset-0` layer stacked on top of everything else in the viewport, so it
  // - not the outer div - is the real click target for every point of empty
  // space; the outer div's onClick was correctly-written but never fired.
  // Also requires the gesture not to have been a drag: a pan that happens to
  // end over empty space is not a click on it (backgroundWasDraggedRef).
  const handleBackgroundClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || backgroundWasDraggedRef.current) {
      return;
    }
    setFocusedItemId(null);
    setVoteDrag(null);
    setPendingVote(null);
  };

  const cardVote = (() => {
    if (!cardCell) {
      return undefined;
    }
    const itemId = cardCell.representative.item.id;
    const votingItem = effectiveItems.find((candidate) => candidate.id === itemId);
    const passedItemTitle = (delta: number): string | undefined =>
      votingItem ? findPassedItem(votingItem, delta, effectiveItems)?.title : undefined;

    if (voteDrag && voteDrag.itemId === itemId) {
      return {
        delta: voteDrag.delta,
        isPending: false,
        onSubmit: () => {},
        passedItemTitle: passedItemTitle(voteDrag.delta),
      };
    }
    if (pendingVote && pendingVote.itemId === itemId) {
      const delta = pendingVote.delta;
      return {
        delta,
        isPending: true,
        passedItemTitle: passedItemTitle(delta),
        onSubmit: () => {
          const item = effectiveItems.find((candidate) => candidate.id === itemId);
          if (item) {
            // Casting a vote moves the item up by one step of voterCount -
            // on the log-scaled Y axis, that can be a large jump for a
            // low-voter item (voterCount 1 to 2 doubles it) - so the camera
            // zooms out first, just enough that neither its old nor new
            // position falls outside the viewport, instead of leaving it to
            // simply vanish off-screen once the vote lands.
            // No minZoomY floor here on purpose - that floor is sized to fit
            // the *whole* dataset, which is usually a far lower zoom than
            // wherever the user is currently looking at one item up close;
            // applying it here could zoom IN instead of out. This only ever
            // zooms out, and only as far as actually needed.
            const worldYBefore = Math.log10(Math.max(item.voterCount, 1));
            const worldYAfter = Math.log10(Math.max(item.voterCount + 1, 1));
            const spread = Math.abs(worldYAfter - worldYBefore);
            const targetZoomY =
              spread > 0
                ? Math.min(cameraY.zoomY, (viewportHeight * VOTE_ZOOM_OUT_FRACTION) / spread)
                : cameraY.zoomY;
            useCameraStore.getState().animateTo(camera, {
              centerY: (worldYBefore + worldYAfter) / 2,
              zoomY: targetZoomY,
            });
            useVoteStore.getState().castVote(itemId, item.score, item.voterCount, delta);
          }
          setPendingVote(null);
        },
      };
    }
    return undefined;
  })();

  const cardAlternates = cardCell
    ? cardCell.members
        .filter((member) => member.item.id !== cardCell.representative.item.id)
        .map((member) => ({ id: member.item.id, title: member.item.title }))
    : [];

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
      {/* The ruler: fixed screen positions, unaffected by worldContentRef's
          live-drag transform, so panning never drags these away - only the
          numbers they show change, on the next render. */}
      {columnsX.map((x) => (
        <div
          key={`grid-x-${x}`}
          data-testid="world-grid-line-x"
          className="absolute top-0 w-px bg-neutral-200"
          style={{ left: x, height: viewportHeight }}
        />
      ))}

      {rowsY.map((y) => (
        <div
          key={`grid-y-${y}`}
          data-testid="world-grid-line-y"
          className="absolute left-0 h-px bg-neutral-200"
          style={{ top: y, width: viewportWidth }}
        />
      ))}

      <div data-testid="world-axis" className="absolute inset-x-0 bottom-0 h-0.5 bg-black" />

      <div
        data-testid="world-fulcrum"
        className="absolute bottom-0 h-0 w-0 border-x-[6px] border-b-[9px] border-x-transparent border-b-black"
        style={{ left: fulcrumScreenX, transform: "translate(-50%, 3px)" }}
      />

      {columnsX.map((x) => {
        const value = worldStepX * Math.round(screenToWorld(x, camera, viewportWidth) / worldStepX);
        return (
          <div
            key={`tick-x-${x}`}
            data-testid="world-tick"
            className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center pb-1"
            style={{ left: x }}
          >
            <span className="mb-1 font-bold text-neutral-700 text-xs">{value}</span>
            <div className="h-2 w-px bg-neutral-400" />
          </div>
        );
      })}

      {rowsY.map((y) => {
        const decade =
          decadeStepY * Math.round(screenToWorldY(y, cameraY, axisTopPx) / decadeStepY);
        return (
          <div
            key={`tick-y-${y}`}
            data-testid="world-tick-y"
            className="absolute left-0 flex -translate-y-1/2 items-center gap-1"
            style={{ top: y, left: 4 }}
          >
            <div className="h-px w-2 bg-neutral-400" />
            <span className="font-bold text-neutral-700 text-xs">
              {formatVoterTickLabel(decade)}
            </span>
          </div>
        );
      })}

      {/* biome-ignore lint/a11y/noStaticElementInteractions: same as the outer viewport div - see its comment. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: un-focusing by clicking empty space; S6 covers keyboard access. */}
      <div
        ref={worldContentRef}
        data-testid="world-content"
        className="absolute inset-0"
        onClick={handleBackgroundClick}
      >
        {cellRenderData.map(({ representative, count, sizePx, opacity }) => {
          const isVotable = isItemVotable(isLoggedIn, votes[representative.item.id] !== undefined);
          const isFocused = representative.item.id === focusedItemId;
          return (
            <ItemDot
              key={`${representative.cellCol}:${representative.cellRow}`}
              itemId={representative.item.id}
              screenX={representative.screenX}
              screenY={representative.screenY}
              title={labelText(representative, count)}
              showLabel={shownLabelIds.has(representative.item.id)}
              // Bigger and easier to grab while it's the one thing on the
              // whole map that's actually draggable - reported as "sometimes
              // hard to click on and drag".
              sizePx={
                isFocused && isVotable ? Math.max(sizePx, FOCUSED_VOTABLE_DOT_MIN_PX) : sizePx
              }
              opacity={opacity}
              isVotable={isVotable}
              isFocused={isFocused}
              onHoverStart={() => setHoveredItemId(representative.item.id)}
              onHoverEnd={() =>
                setHoveredItemId((current) => (current === representative.item.id ? null : current))
              }
              onSelect={() => handleDotSelect(representative.item)}
            />
          );
        })}

        {cardCell && (
          <ItemCard
            item={cardCell.representative.item}
            screenX={cardCell.representative.screenX}
            screenY={cardCell.representative.screenY}
            vote={cardVote}
            alternates={cardAlternates}
            onSelectAlternate={handleSelectAlternate}
          />
        )}
      </div>
    </div>
  );
}
