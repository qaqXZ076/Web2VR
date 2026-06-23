import { create } from 'zustand';
import type { StereoLayout, ProjectionType } from '@/lib/vr/vr-presets';

export type AppMode = 'input' | 'preview' | 'vr';

export interface SelectionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VideoInfo {
  src: string;
  width: number;
  height: number;
  isDirectUrl: boolean;
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

  // Video source
  videoSource: VideoInfo | null;
  setVideoSource: (source: VideoInfo | null) => void;
  selectionMode: 'none' | 'region' | 'fullscreen';
  setSelectionMode: (mode: 'none' | 'region' | 'fullscreen') => void;
  selectionRegion: SelectionRegion | null;
  setSelectionRegion: (region: SelectionRegion | null) => void;

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
  videoSource: null,
  selectionMode: 'none' as const,
  selectionRegion: null,
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
  setVideoSource: (source) => set({ videoSource: source }),
  setSelectionMode: (mode) => set({ selectionMode: mode }),
  setSelectionRegion: (region) => set({ selectionRegion: region }),
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
