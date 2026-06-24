import { create } from 'zustand';
import type { StereoLayout, ProjectionType } from '@/lib/vr/vr-presets';

export type AppMode = 'input' | 'preview' | 'vr';

/** Region selected by the user on the page (as fractions 0-1 of container size) */
export interface SelectionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VRState {
  // App mode
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // URL input
  pageUrl: string;
  setPageUrl: (url: string) => void;
  isPageLoading: boolean;
  setIsPageLoading: (loading: boolean) => void;

  // Region selected by user on the loaded page (fractional 0-1)
  selectionRegion: SelectionRegion | null;
  setSelectionRegion: (region: SelectionRegion | null) => void;

  // Whether user chose "full page" instead of selecting a region
  useFullscreen: boolean;
  setUseFullscreen: (use: boolean) => void;

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
  mode: 'input' as AppMode,
  pageUrl: '',
  isPageLoading: false,
  selectionRegion: null as SelectionRegion | null,
  useFullscreen: false,
  layout: 'sbs' as StereoLayout,
  projection: 'hemisphere180' as ProjectionType,
  fov: 180,
  isVRSupported: false,
  isInVR: false,
};

export const useVRStore = create<VRState>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),
  setPageUrl: (url) => set({ pageUrl: url }),
  setIsPageLoading: (loading) => set({ isPageLoading: loading }),
  setSelectionRegion: (region) => set({ selectionRegion: region }),
  setUseFullscreen: (use) => set({ useFullscreen: use }),
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
