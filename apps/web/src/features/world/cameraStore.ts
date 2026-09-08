import {
  type Camera,
  fitCameraToItems,
  panCamera,
  screenToWorld,
  worldToScreen,
  zoomCameraAtPoint,
} from "@teeter/shared";
import { create } from "zustand";
import { mockItems } from "../../data/mockItems";

// The entry view (product spec, batch 4): arriving shows the whole world,
// fitted to the actual data. Stage 0 has no server to load items from, so
// the mock set stands in for it - this is the one place the camera store
// needs to know about real items rather than just the shape of a camera.
function initialCamera(viewportWidth: number): Camera {
  return fitCameraToItems(mockItems, viewportWidth);
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
