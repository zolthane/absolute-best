import {
  type Camera,
  cameraFromUrlParams,
  fitCameraToItems,
  fitVerticalCameraToItems,
  interpolateCamera,
  interpolateVerticalCamera,
  minZoomYForItems,
  panCamera,
  panCameraY,
  screenToWorld,
  type VerticalCamera,
  verticalCameraFromUrlParams,
  worldToScreen,
  zoomCameraAtPoint,
  zoomCameraAtPointY,
} from "@teeter/shared";
import { create } from "zustand";
import { mockItems } from "../../data/mockItems";

// How long a "glide to this item" camera move takes (product spec, section
// 3: focusing animates smoothly, it does not jump).
const FOCUS_ANIMATION_MS = 500;

/**
 * The actually-visible viewport size. Prefers the VisualViewport API, which
 * tracks the real visible area live as a mobile browser's address bar or
 * keyboard shows/hides or the device rotates; window.innerWidth/innerHeight
 * can lag behind or report a stale value through that transition (most
 * visible right after rotating to landscape), which then fed every screen
 * position calculation - reported as the item card sometimes not showing,
 * or the page getting stuck scrolled to a focused button's position.
 * VisualViewport isn't implemented in jsdom (or older browsers), hence the
 * fallback.
 */
export function currentViewportSize(): { width: number; height: number } {
  const visual = window.visualViewport;
  return {
    width: visual?.width ?? window.innerWidth,
    height: visual?.height ?? window.innerHeight,
  };
}

// The entry view (product spec, batch 4): arriving shows the whole world,
// fitted to the actual data - unless the address bar already names a camera
// position (a shared link, product spec section 3), in which case that view
// wins. Stage 0 has no server to load items from, so the mock set stands in
// for it - this is the one place the camera store needs to know about real
// items rather than just the shape of a camera.
function initialCamera(viewportWidth: number): Camera {
  const fromUrl = cameraFromUrlParams(new URLSearchParams(window.location.search));
  return fromUrl ?? fitCameraToItems(mockItems, viewportWidth);
}

// The Y equivalent of initialCamera (batch 6b) - see verticalEntryView.ts
// for why its entry view isn't simply "fit everything to one screen".
function initialVerticalCamera(viewportHeight: number): VerticalCamera {
  const minZoomY = minZoomYForItems(mockItems, viewportHeight);
  const fromUrl = verticalCameraFromUrlParams(
    new URLSearchParams(window.location.search),
    minZoomY,
  );
  return fromUrl ?? fitVerticalCameraToItems(mockItems, viewportHeight);
}

interface CameraState {
  camera: Camera;
  cameraY: VerticalCamera;
  viewportWidth: number;
  viewportHeight: number;
  setViewportWidth: (width: number) => void;
  setViewportHeight: (height: number) => void;
  // minCenter/maxCenter (and their Y equivalents) are supplied by the caller
  // each time - WorldViewport computes them fresh from the live data and
  // viewport, since the store itself doesn't know about items (see
  // initialCamera/initialVerticalCamera, the one deliberate exception).
  pan: (deltaScreenX: number, minCenter?: number, maxCenter?: number) => void;
  panY: (deltaScreenY: number, minCenterY?: number, maxCenterY?: number) => void;
  zoomAt: (
    pointerScreenX: number,
    zoomFactor: number,
    minCenter?: number,
    maxCenter?: number,
  ) => void;
  zoomAtY: (
    pointerScreenY: number,
    anchorScreenY: number,
    zoomFactor: number,
    minZoomY: number,
    minCenterY?: number,
    maxCenterY?: number,
  ) => void;
  animateTo: (targetCamera: Camera, targetCameraY: VerticalCamera) => void;
}

const initialViewportSize = currentViewportSize();

export const useCameraStore = create<CameraState>((set, get) => ({
  camera: initialCamera(initialViewportSize.width),
  cameraY: initialVerticalCamera(initialViewportSize.height),
  viewportWidth: initialViewportSize.width,
  viewportHeight: initialViewportSize.height,

  setViewportWidth: (width) => {
    // Only the very first real measurement sets the initial zoom - later
    // resizes must not silently reset wherever the user has panned/zoomed to.
    const { viewportWidth } = get();
    set((state) => ({
      viewportWidth: width,
      camera: viewportWidth === 0 ? initialCamera(width) : state.camera,
    }));
  },

  setViewportHeight: (height) => {
    const { viewportHeight } = get();
    set((state) => ({
      viewportHeight: height,
      cameraY: viewportHeight === 0 ? initialVerticalCamera(height) : state.cameraY,
    }));
  },

  pan: (deltaScreenX, minCenter, maxCenter) =>
    set((state) => ({ camera: panCamera(state.camera, deltaScreenX, minCenter, maxCenter) })),
  panY: (deltaScreenY, minCenterY, maxCenterY) =>
    set((state) => ({
      cameraY: panCameraY(state.cameraY, deltaScreenY, minCenterY, maxCenterY),
    })),

  zoomAt: (pointerScreenX, zoomFactor, minCenter, maxCenter) =>
    set((state) => ({
      camera: zoomCameraAtPoint(
        state.camera,
        state.viewportWidth,
        pointerScreenX,
        zoomFactor,
        minCenter,
        maxCenter,
      ),
    })),

  zoomAtY: (pointerScreenY, anchorScreenY, zoomFactor, minZoomY, minCenterY, maxCenterY) =>
    set((state) => ({
      cameraY: zoomCameraAtPointY(
        state.cameraY,
        anchorScreenY,
        pointerScreenY,
        zoomFactor,
        minZoomY,
        minCenterY,
        maxCenterY,
      ),
    })),

  animateTo: (targetCamera, targetCameraY) => {
    const startCamera = get().camera;
    const startCameraY = get().cameraY;
    const startTime = performance.now();

    function step(now: number) {
      const t = (now - startTime) / FOCUS_ANIMATION_MS;
      set({
        camera: interpolateCamera(startCamera, targetCamera, t),
        cameraY: interpolateVerticalCamera(startCameraY, targetCameraY, t),
      });
      if (t < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  },
}));

export function worldToScreenX(worldX: number): number {
  const { camera, viewportWidth } = useCameraStore.getState();
  return worldToScreen(worldX, camera, viewportWidth);
}

export function screenToWorldX(screenX: number): number {
  const { camera, viewportWidth } = useCameraStore.getState();
  return screenToWorld(screenX, camera, viewportWidth);
}
