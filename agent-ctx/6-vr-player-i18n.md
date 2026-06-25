---
Task ID: 6
Agent: vr-player-i18n
Task: Integrate i18n into vr-player.tsx

Work Log:
- Read vr-player.tsx (1306 lines) to identify all hardcoded English strings
- Read i18n infrastructure: translations.ts, useTranslation.tsx
- Added `useTranslation` and `useRenderTranslation` imports and hook calls
- Replaced 40+ hardcoded English strings with translation keys across:
  - Top bar: Back, captureModeLabel, Crop, VR Active, layout/projection labels
  - Error section: Screen Capture, Test Pattern buttons
  - Captured preview section: capturedPreview, drawRectangle, applyCrop, cancel, resetRegion, selectRegion, recapture, cropHint (using rt() for inline markup)
  - VR Canvas overlays: initializing, noVideoSource, noVideoSourceDesc, dragHint
  - Controls: playPause, muteUnmute, toggleCrop, disableCrop, selectRegionCrop, demo, loadTestPattern, capture, captureTooltip, fullscreen, enterFullscreen, enterVR, enterVRTooltip, exitVR, exitVRTooltip
  - VR not available section: vrNotAvailable, vrNotAvailableDesc, setupGuide, setupGuide.step1-4
  - Error messages in code: error.screenCaptureCancelled, error.enterVRFailed (with interpolation)
  - aria-labels: toggleCrop, loadTestPattern, capture, enterFullscreen
- Added `t` to useCallback dependency arrays for handleScreenCapture and handleEnterVR
- Used `rt()` from useRenderTranslation only for cropHint (has {strong} markup)
- Kept isPlaying ? 'Pause' : 'Play' and isMuted ? 'Unmute' : 'Mute' aria-labels unchanged per spec
- Did NOT modify Three.js/WebXR logic, mesh building, or session management code

Stage Summary:
- vr-player.tsx fully internationalized
- All UI strings use translation keys
- Lint passes with no errors
- Dev server compiles successfully
