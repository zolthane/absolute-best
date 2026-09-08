import {
  type Camera,
  cameraFromUrlParams,
  fitCameraToItems,
  fitVerticalCameraToItems,
  interpolateCamera,
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
  pan: (deltaScreenX: number) => void;
  panY: (deltaScreenY: number) => void;
  zoomAt: (pointerScreenX: number, zoomFactor: number) => void;
  zoomAtY: (
    pointerScreenY: number,
    anchorScreenY: number,
    zoomFactor: number,
    minZoomY: number,
  ) => void;
  animateTo: (target: Camera) => void;
}

export const useCameraStore = create<CameraState>((set, get) => ({
  camera: initialCamera(window.innerWidth),
  cameraY: initialVerticalCamera(window.innerHeight),
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,

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

  pan: (deltaScreenX) => set((state) => ({ camera: panCamera(state.camera, deltaScreenX) })),
  panY: (deltaScreenY) => set((state) => ({ cameraY: panCameraY(state.cameraY, deltaScreenY) })),

  zoomAt: (pointerScreenX, zoomFactor) =>
    set((state) => ({
      camera: zoomCameraAtPoint(state.camera, state.viewportWidth, pointerScreenX, zoomFactor),
    })),

  zoomAtY: (pointerScreenY, anchorScreenY, zoomFactor, minZoomY) =>
    set((state) => ({
      cameraY: zoomCameraAtPointY(
        state.cameraY,
        anchorScreenY,
        pointerScreenY,
        zoomFactor,
        minZoomY,
      ),
    })),

  animateTo: (target) => {
    const start = get().camera;
    const startTime = performance.now();

    function step(now: number) {
      const t = (now - startTime) / FOCUS_ANIMATION_MS;
      set({ camera: interpolateCamera(start, target, t) });
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
