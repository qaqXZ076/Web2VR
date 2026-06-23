// VR preset configurations for different video types

export type StereoLayout = 'sbs' | 'tb' | 'mono';
export type ProjectionType = 'sphere360' | 'hemisphere180' | 'cylinder';
export type FOVPreset = '90' | '110' | '120' | '150' | '180' | 'custom';

export interface VRPreset {
  id: string;
  name: string;
  description: string;
  layout: StereoLayout;
  projection: ProjectionType;
  fov: number;
  icon: string;
}

export const VR_PRESETS: VRPreset[] = [
  {
    id: 'vr180-sbs',
    name: 'VR180 (Side-by-Side)',
    description: 'Standard VR180 video with left/right eye views side by side',
    layout: 'sbs',
    projection: 'hemisphere180',
    fov: 180,
    icon: '🥽',
  },
  {
    id: 'vr180-tb',
    name: 'VR180 (Top-Bottom)',
    description: 'VR180 video with left/right eye views stacked top/bottom',
    layout: 'tb',
    projection: 'hemisphere180',
    fov: 180,
    icon: '👓',
  },
  {
    id: 'vr360-sbs',
    name: 'VR360 (Side-by-Side)',
    description: 'Full 360° video with side-by-side stereo',
    layout: 'sbs',
    projection: 'sphere360',
    fov: 180,
    icon: '🌍',
  },
  {
    id: 'vr360-tb',
    name: 'VR360 (Top-Bottom)',
    description: 'Full 360° video with top-bottom stereo',
    layout: 'tb',
    projection: 'sphere360',
    fov: 180,
    icon: '🌐',
  },
  {
    id: 'cylinder-sbs',
    name: 'Cinema (Side-by-Side)',
    description: 'Cylindrical projection like a curved movie screen, side-by-side stereo',
    layout: 'sbs',
    projection: 'cylinder',
    fov: 120,
    icon: '🎬',
  },
  {
    id: 'cylinder-mono',
    name: 'Flat Cinema (Mono)',
    description: 'Cylindrical projection for standard mono video, like a curved screen',
    layout: 'mono',
    projection: 'cylinder',
    fov: 90,
    icon: '🎥',
  },
];

export const PROJECTION_LABELS: Record<ProjectionType, string> = {
  sphere360: '360° Sphere',
  hemisphere180: '180° Hemisphere',
  cylinder: 'Cylinder (Cinema)',
};

export const LAYOUT_LABELS: Record<StereoLayout, string> = {
  sbs: 'Side-by-Side (Left | Right)',
  tb: 'Top-Bottom (Top / Bottom)',
  mono: 'Mono (Single View)',
};

export const FOV_OPTIONS: { value: number; label: string }[] = [
  { value: 90, label: '90°' },
  { value: 110, label: '110°' },
  { value: 120, label: '120°' },
  { value: 150, label: '150°' },
  { value: 180, label: '180°' },
];
