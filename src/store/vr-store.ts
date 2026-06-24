import { create } from 'zustand';
import type { StereoLayout, ProjectionType } from '@/lib/vr/vr-presets';

export type AppMode = 'landing' | 'player';

/** Crop region as fractions (0-1) of the captured video dimensions */
export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VRState {
  // App mode
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Crop region selected by user on the captured screen (fractional 0-1)
  cropRegion: CropRegion | null;
  setCropRegion: (region: CropRegion | null) => void;

  // Whether crop is enabled
  cropEnabled: boolean;
  setCropEnabled: (enabled: boolean) => void;

  // VR settings
  layout: StereoLayout;
  setLayout: (layout: StereoLayout) => void;
  projection: ProjectionType;
  setProjection: (projection: ProjectionType) => void;
  fov: number;
  setFov: (fov: number) => void;

  // VR session
  isVRSupported: boolean;
  setIsVRSupported: (supported: boolean) => void;
  isInVR: boolean;
  setIsInVR: (inVR: boolean) => void;

  // Apply a preset
  applyPreset: (preset: { layout: StereoLayout; projection: ProjectionType; fov: number }) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  mode: 'landing' as AppMode,
  cropRegion: null as CropRegion | null,
  cropEnabled: false,
  layout: 'sbs' as StereoLayout,
  projection: 'hemisphere180' as ProjectionType,
  fov: 180,
  isVRSupported: false,
  isInVR: false,
};

export const useVRStore = create<VRState>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),
  setCropRegion: (region) => set({ cropRegion: region }),
  setCropEnabled: (enabled) => set({ cropEnabled: enabled }),
  setLayout: (layout) => set({ layout }),
  setProjection: (projection) => set({ projection }),
  setFov: (fov) => set({ fov }),
  setIsVRSupported: (supported) => set({ isVRSupported: supported }),
  setIsInVR: (inVR) => set({ isInVR: inVR }),

  applyPreset: (preset) =>
    set({
      layout: preset.layout,
      projection: preset.projection,
      fov: preset.fov,
    }),

  reset: () => set(initialState),
}));
