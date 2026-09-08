import {
  type Camera,
  panCamera,
  screenToWorld,
  worldToScreen,
  zoomCameraAtPoint,
} from "@teeter/shared";
import { create } from "zustand";

// The Stage 0 default: no real data exists yet, so the camera opens on a
// fixed range wide enough to feel like a world rather than a single point.
// The product spec's real "fit to the data" camera arrives in batch 4.
const DEFAULT_VISIBLE_WORLD_WIDTH = 220;

function initialCamera(viewportWidth: number): Camera {
  return { center: 0, zoom: viewportWidth / DEFAULT_VISIBLE_WORLD_WIDTH };
}

interface CameraState {
  camera: Camera;
  viewportWidth: number;
  setViewportWidth: (width: number) => void;
  pan: (deltaScreenX: number) => void;
  zoomAt: (pointerScreenX: number, zoomFactor: number) => void;
}

export const useCameraStore = create<CameraState>((set, get) => ({
  camera: initialCamera(window.innerWidth),
  viewportWidth: window.innerWidth,

  setViewportWidth: (width) => {
    // Only the very first real measurement sets the initial zoom - later
    // resizes must not silently reset wherever the user has panned/zoomed to.
    const { viewportWidth } = get();
    set((state) => ({
      viewportWidth: width,
      camera: viewportWidth === 0 ? initialCamera(width) : state.camera,
    }));
  },

  pan: (deltaScreenX) => set((state) => ({ camera: panCamera(state.camera, deltaScreenX) })),

  zoomAt: (pointerScreenX, zoomFactor) =>
    set((state) => ({
      camera: zoomCameraAtPoint(state.camera, state.viewportWidth, pointerScreenX, zoomFactor),
    })),
}));

export function worldToScreenX(worldX: number): number {
  const { camera, viewportWidth } = useCameraStore.getState();
  return worldToScreen(worldX, camera, viewportWidth);
}

export function screenToWorldX(screenX: number): number {
  const { camera, viewportWidth } = useCameraStore.getState();
  return screenToWorld(screenX, camera, viewportWidth);
}
