'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useVRStore } from '@/store/vr-store';
import type { StereoLayout, ProjectionType } from '@/lib/vr/vr-presets';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Glasses,
  Maximize,
  Pause,
  Play,
  Volume2,
  VolumeX,
  RotateCcw,
  AlertTriangle,
  Monitor,
  TestTube,
  Info,
  Crop,
} from 'lucide-react';

import * as THREE from 'three';

interface SelectionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function VRPlayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number>(0);
  const vrSessionRef = useRef<XRSession | null>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  // Canvas for cropping the screen capture to selected region
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    videoSource,
    layout,
    projection,
    fov,
    setMode,
    setIsVRSupported,
    isVRSupported,
    setIsInVR,
    isInVR,
  } = useVRStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);
  const [captureMode, setCaptureMode] = useState<'none' | 'screen' | 'video' | 'test'>('none');

  // Check if there's a selection region from the page viewer
  const transferredRegion = typeof window !== 'undefined'
    ? (window as unknown as Record<string, unknown>).__vrSelectionRegion as SelectionRegion | undefined
    : undefined;
  const [cropEnabled, setCropEnabled] = useState(!!transferredRegion);
  const [cropRegion, setCropRegion] = useState<SelectionRegion | null>(transferredRegion ?? null);

  // Camera rotation state for mouse drag
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const cameraRotation = useRef({ lon: 0, lat: 0 });

  // Clean up transferred region from window after reading it
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__vrSelectionRegion) {
      delete (window as unknown as Record<string, unknown>).__vrSelectionRegion;
    }
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!canvasRef.current) return;

      if (navigator.xr) {
        try {
          const supported = await navigator.xr.isSessionSupported('immersive-vr');
          if (mounted) setIsVRSupported(supported);
        } catch {
          if (mounted) setIsVRSupported(false);
        }
      } else {
        if (mounted) setIsVRSupported(false);
      }

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: false,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      renderer.xr.enabled = true;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111111);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        75,
        canvasRef.current.clientWidth / canvasRef.current.clientHeight,
        0.1,
        2000
      );
      camera.position.set(0, 0, 0);
      camera.layers.enable(1);
      camera.layers.enable(2);
      cameraRef.current = camera;

      // Handle WebXR stereo layers
      renderer.xr.addEventListener('sessionstart', () => {
        const xrCamera = renderer.xr.getCamera();
        if (xrCamera && xrCamera.cameras.length === 2) {
          xrCamera.cameras[0].layers.enable(1);
          xrCamera.cameras[0].layers.disable(2);
          xrCamera.cameras[1].layers.enable(2);
          xrCamera.cameras[1].layers.disable(1);
        }
        camera.layers.disable(2);
      });

      renderer.xr.addEventListener('sessionend', () => {
        camera.layers.enable(1);
        camera.layers.enable(2);
      });

      if (mounted) setIsInitializing(false);
    }

    init();
    return () => { mounted = false; };
  }, [setIsVRSupported]);

  // Build/rebuild VR meshes
  const buildScene = useCallback(
    (source: HTMLVideoElement | HTMLCanvasElement) => {
      const scene = sceneRef.current;
      if (!scene) return;

      // Clear previous meshes
      meshesRef.current.forEach((mesh) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      meshesRef.current = [];

      let texture: THREE.Texture;
      if (source instanceof HTMLCanvasElement) {
        texture = new THREE.CanvasTexture(source);
      } else {
        texture = new THREE.VideoTexture(source);
      }
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.colorSpace = THREE.SRGBColorSpace;

      const meshes = createVRMeshes(texture, layout, projection, fov);
      meshes.forEach((mesh) => scene.add(mesh));
      meshesRef.current = meshes;

      const camera = cameraRef.current;
      if (camera) {
        camera.layers.enable(1);
        camera.layers.enable(2);
      }
    },
    [layout, projection, fov]
  );

  // Create a crop canvas that continuously crops the video to the selected region
  const startCropCanvas = useCallback(
    (video: HTMLVideoElement, region: SelectionRegion) => {
      const cropCanvas = document.createElement('canvas');
      cropCanvasRef.current = cropCanvas;

      // Set crop canvas size to match the cropped region
      const updateSize = () => {
        const vw = video.videoWidth || 1920;
        const vh = video.videoHeight || 1080;
        cropCanvas.width = Math.round(vw * region.width);
        cropCanvas.height = Math.round(vh * region.height);
      };
      updateSize();

      const ctx = cropCanvas.getContext('2d')!;

      // Continuously render the cropped region
      let running = true;
      const renderFrame = () => {
        if (!running) return;
        const vw = video.videoWidth || 1920;
        const vh = video.videoHeight || 1080;
        const sx = Math.round(vw * region.x);
        const sy = Math.round(vh * region.y);
        const sw = Math.round(vw * region.width);
        const sh = Math.round(vh * region.height);

        if (sw > 0 && sh > 0) {
          cropCanvas.width = sw;
          cropCanvas.height = sh;
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
        }
        requestAnimationFrame(renderFrame);
      };
      renderFrame();

      // Return cleanup function
      return () => { running = false; };
    },
    []
  );

  const cropCleanupRef = useRef<(() => void) | null>(null);

  // Generate test pattern
  const generateTestPattern = useCallback((): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 3840;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;
    const halfWidth = canvas.width / 2;

    for (let eye = 0; eye < 2; eye++) {
      const offsetX = eye * halfWidth;
      const label = eye === 0 ? 'LEFT EYE' : 'RIGHT EYE';
      const hue = eye === 0 ? 200 : 0;

      const gradient = ctx.createRadialGradient(
        offsetX + halfWidth / 2, canvas.height / 2, 50,
        offsetX + halfWidth / 2, canvas.height / 2, halfWidth / 2
      );
      gradient.addColorStop(0, `hsl(${hue}, 30%, 40%)`);
      gradient.addColorStop(1, `hsl(${hue}, 50%, 10%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(offsetX, 0, halfWidth, canvas.height);

      ctx.strokeStyle = `hsla(${hue}, 60%, 60%, 0.3)`;
      ctx.lineWidth = 1;
      for (let x = 0; x < halfWidth; x += 120) {
        ctx.beginPath(); ctx.moveTo(offsetX + x, 0); ctx.lineTo(offsetX + x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 120) {
        ctx.beginPath(); ctx.moveTo(offsetX, y); ctx.lineTo(offsetX + halfWidth, y); ctx.stroke();
      }

      ctx.strokeStyle = `hsla(${hue}, 80%, 80%, 0.8)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(offsetX + halfWidth / 2 - 60, canvas.height / 2);
      ctx.lineTo(offsetX + halfWidth / 2 + 60, canvas.height / 2);
      ctx.moveTo(offsetX + halfWidth / 2, canvas.height / 2 - 60);
      ctx.lineTo(offsetX + halfWidth / 2, canvas.height / 2 + 60);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(offsetX + halfWidth / 2, canvas.height / 2, 200, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `hsl(${hue}, 80%, 90%)`;
      ctx.font = 'bold 64px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, offsetX + halfWidth / 2, 100);

      ctx.font = '32px monospace';
      ctx.fillStyle = `hsla(${hue}, 60%, 70%, 0.8)`;
      [-90, -60, -30, 0, 30, 60, 90].forEach((angle) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        ctx.fillText(`${angle}°`,
          offsetX + halfWidth / 2 + Math.cos(rad) * 400,
          canvas.height / 2 + Math.sin(rad) * 400
        );
      });
    }
    return canvas;
  }, []);

  // Load video when source changes
  useEffect(() => {
    if (!videoSource?.src) return;

    let mounted = true;

    async function loadVideo() {
      // Handle test pattern mode
      if (videoSource.src === 'test-pattern') {
        const testCanvas = generateTestPattern();
        buildScene(testCanvas);
        setHasVideo(true);
        setIsPlaying(true);
        setVideoError(null);
        setCaptureMode('test');
        return;
      }

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.playsInline = true;
      video.loop = true;
      video.muted = isMuted;

      let videoSrc = videoSource.src;
      if (!videoSource.isDirectUrl && !videoSrc.startsWith('blob:')) {
        videoSrc = `/api/proxy?url=${encodeURIComponent(videoSrc)}`;
      }

      video.src = videoSrc;
      videoRef.current = video;
      setHasVideo(true);
      setCaptureMode('video');

      try {
        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => reject(new Error('Failed to load video'));
          video.load();
          setTimeout(() => reject(new Error('Video load timeout (20s)')), 20000);
        });

        if (!mounted) return;
        await video.play();
        if (mounted) {
          setIsPlaying(true);
          setVideoError(null);
          buildScene(video);
        }
      } catch {
        if (mounted) {
          setVideoError(
            'Failed to load video directly. Use "Screen Capture" to capture the video from the webpage instead.'
          );
        }
      }
    }

    loadVideo();
    return () => { mounted = false; };
  }, [videoSource, buildScene, isMuted]);

  // Rebuild meshes when VR settings change
  useEffect(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    // If crop is enabled, use the crop canvas
    if (cropEnabled && cropRegion && cropCanvasRef.current) {
      buildScene(cropCanvasRef.current);
    } else {
      buildScene(video);
    }
  }, [layout, projection, fov, buildScene, cropEnabled, cropRegion]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    animate();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      const container = containerRef.current;
      if (renderer && camera && container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Screen capture mode
  const handleScreenCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 3840 }, height: { ideal: 2160 } },
        audio: false,
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      await video.play();

      videoRef.current = video;
      setHasVideo(true);
      setCaptureMode('screen');
      setVideoError(null);

      // If there's a crop region, start the crop canvas
      if (cropEnabled && cropRegion) {
        const cleanup = startCropCanvas(video, cropRegion);
        cropCleanupRef.current = cleanup;
        // Wait a frame for the crop canvas to start rendering
        await new Promise((r) => requestAnimationFrame(r));
        buildScene(cropCanvasRef.current!);
      } else {
        buildScene(video);
      }

      setIsPlaying(true);

      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.onended = () => {
        setCaptureMode('none');
        setIsPlaying(false);
        setHasVideo(false);
        if (cropCleanupRef.current) {
          cropCleanupRef.current();
          cropCleanupRef.current = null;
        }
      };
    } catch {
      setVideoError('Screen capture was cancelled or failed. Please try again.');
    }
  }, [buildScene, startCropCanvas, cropEnabled, cropRegion]);

  // Handle test pattern
  const handleTestPattern = useCallback(() => {
    const testCanvas = generateTestPattern();
    buildScene(testCanvas);
    setHasVideo(true);
    setIsPlaying(true);
    setVideoError(null);
    setCaptureMode('test');
    setCropEnabled(false);
  }, [buildScene, generateTestPattern]);

  // Enter VR
  const handleEnterVR = useCallback(async () => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !navigator.xr || !camera) return;

    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor'],
      });
      vrSessionRef.current = session;

      session.addEventListener('end', () => {
        vrSessionRef.current = null;
        setIsInVR(false);
        setShowPreview(true);
        if (camera) {
          camera.layers.enable(1);
          camera.layers.enable(2);
        }
      });

      await renderer.xr.setSession(session);
      setIsInVR(true);
      setShowPreview(false);
    } catch (err) {
      console.error('Failed to start VR session:', err);
      setVideoError(
        `Failed to enter VR: ${err instanceof Error ? err.message : 'Unknown error'}. Make sure your VR headset is connected and SteamVR is running.`
      );
    }
  }, [setIsInVR]);

  // Fullscreen
  const handleEnterFullscreen = useCallback(() => {
    containerRef.current?.requestFullscreen();
  }, []);

  // Play/Pause
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); setIsPlaying(true); }
    else { video.pause(); setIsPlaying(false); }
  }, []);

  // Mute/Unmute
  const handleMuteToggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  // Toggle crop
  const handleToggleCrop = useCallback(() => {
    if (cropEnabled) {
      setCropEnabled(false);
      setCropRegion(null);
      if (cropCleanupRef.current) {
        cropCleanupRef.current();
        cropCleanupRef.current = null;
      }
      // Rebuild without crop
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        buildScene(video);
      }
    } else {
      // Prompt user to select a region via screen capture
      setCropEnabled(true);
    }
  }, [cropEnabled, buildScene]);

  // Go back
  const handleGoBack = useCallback(() => {
    const video = videoRef.current;
    if (video) { video.pause(); video.src = ''; video.srcObject = null; videoRef.current = null; }
    if (cropCleanupRef.current) { cropCleanupRef.current(); cropCleanupRef.current = null; }
    const renderer = rendererRef.current;
    if (renderer) { renderer.dispose(); rendererRef.current = null; }
    setHasVideo(false);
    setMode('input');
  }, [setMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ': e.preventDefault(); handlePlayPause(); break;
        case 'f': handleEnterFullscreen(); break;
        case 'm': handleMuteToggle(); break;
        case 'Escape': if (isInVR) vrSessionRef.current?.end(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleEnterFullscreen, handleMuteToggle, isInVR]);

  // Mouse drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    prevMouse.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const camera = cameraRef.current;
    if (!camera) return;
    const dx = e.clientX - prevMouse.current.x;
    const dy = e.clientY - prevMouse.current.y;
    cameraRotation.current.lon -= dx * 0.3;
    cameraRotation.current.lat += dy * 0.3;
    cameraRotation.current.lat = Math.max(-85, Math.min(85, cameraRotation.current.lat));
    const phi = ((90 - cameraRotation.current.lat) * Math.PI) / 180;
    const theta = (cameraRotation.current.lon * Math.PI) / 180;
    camera.lookAt(new THREE.Vector3(
      500 * Math.sin(phi) * Math.cos(theta),
      500 * Math.cos(phi),
      500 * Math.sin(phi) * Math.sin(theta)
    ));
    prevMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(() => { isDragging.current = false; }, []);

  const captureModeLabel =
    captureMode === 'screen' ? 'Screen Capture' :
    captureMode === 'video' ? 'Direct Video' :
    captureMode === 'test' ? 'Test Pattern' : 'No Source';

  return (
    <TooltipProvider>
      <div className="w-full space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <Badge variant="outline" className="text-xs">{captureModeLabel}</Badge>
            {cropEnabled && (
              <Badge variant="outline" className="text-xs">
                <Crop className="w-3 h-3 mr-1" /> Crop On
              </Badge>
            )}
            {isInVR && (
              <Badge className="bg-green-600 text-white text-xs">
                <Glasses className="w-3 h-3 mr-1" /> VR Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="w-3 h-3" />
            <span>
              {layout === 'sbs' ? 'SBS' : layout === 'tb' ? 'TB' : 'Mono'} ·{' '}
              {projection === 'sphere360' ? '360°' : projection === 'hemisphere180' ? '180°' : 'Cyl'} · {fov}°
            </span>
          </div>
        </div>

        {/* Error */}
        {videoError && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-4 pb-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm text-destructive">{videoError}</p>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={handleScreenCapture}>
                    <Monitor className="w-3 h-3 mr-1" /> Screen Capture
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleTestPattern}>
                    <TestTube className="w-3 h-3 mr-1" /> Test Pattern
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VR Canvas */}
        <div
          ref={containerRef}
          className="relative rounded-lg overflow-hidden bg-black border"
          style={{ height: showPreview ? '65vh' : '100vh' }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />

          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center space-y-2">
                <RotateCcw className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Initializing VR player...</p>
              </div>
            </div>
          )}

          {!hasVideo && !isInitializing && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center space-y-3">
                <Monitor className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Ready to capture</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Click &quot;Screen Capture&quot; below to capture a browser tab or window playing your VR video.
                  The captured content will be displayed in VR.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={handleScreenCapture}>
                    <Monitor className="w-4 h-4 mr-1" /> Screen Capture
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleTestPattern}>
                    <TestTube className="w-4 h-4 mr-1" /> Test Pattern
                  </Button>
                </div>
              </div>
            </div>
          )}

          {hasVideo && showPreview && !isInitializing && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <p className="text-xs text-white/60 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                Drag to look around · Space: Play/Pause · F: Fullscreen · M: Mute
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={handlePlayPause} disabled={!hasVideo} aria-label={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Play / Pause</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={handleMuteToggle} disabled={!hasVideo} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mute / Unmute</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant={cropEnabled ? 'default' : 'outline'} onClick={handleToggleCrop} aria-label="Toggle crop">
                  <Crop className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{cropEnabled ? 'Disable crop (show full frame)' : 'Enable crop (use selected region)'}</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={handleTestPattern} aria-label="Load test pattern">
                  <TestTube className="w-4 h-4" /><span className="hidden sm:inline ml-1">Demo</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Load test pattern for VR preview</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={handleScreenCapture} aria-label="Screen capture">
                  <Monitor className="w-4 h-4 mr-1" /> Capture
                </Button>
              </TooltipTrigger>
              <TooltipContent>Capture screen/window for VR (primary method)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={handleEnterFullscreen} aria-label="Enter fullscreen">
                  <Maximize className="w-4 h-4" /><span className="hidden sm:inline ml-1">Fullscreen</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Enter fullscreen mode</TooltipContent>
            </Tooltip>
            {isVRSupported && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" onClick={handleEnterVR}>
                    <Glasses className="w-4 h-4 mr-1" /> Enter VR
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Enter immersive VR mode (requires headset)</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* VR not supported */}
        {!isVRSupported && !isInitializing && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium">WebXR Not Available</p>
                  <p className="text-muted-foreground">
                    WebXR is not supported in this browser. To use VR with SteamVR, open this
                    page in Chrome/Edge with a VR headset connected. You can still use fullscreen
                    and screen capture.
                  </p>
                  <div className="mt-2 p-2 rounded bg-muted text-xs space-y-1">
                    <p className="font-medium">Setup Guide:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                      <li>Install SteamVR on your PC</li>
                      <li>Connect your VR headset</li>
                      <li>Open this page in Chrome/Edge</li>
                      <li>Click &quot;Capture&quot; then &quot;Enter VR&quot;</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

// ====== Create VR Meshes ======

function createVRMeshes(
  texture: THREE.Texture,
  layout: StereoLayout,
  projection: ProjectionType,
  fov: number
): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];

  function createGeometry(phiLength: number): THREE.BufferGeometry {
    switch (projection) {
      case 'sphere360':
        return new THREE.SphereGeometry(500, 80, 40, 0, phiLength);
      case 'hemisphere180':
        return new THREE.SphereGeometry(500, 80, 40, 0, phiLength);
      case 'cylinder': {
        const fovRad = (fov * Math.PI) / 180;
        const radius = 500;
        return new THREE.CylinderGeometry(radius, radius, radius * 0.5625, 64, 1, true, -fovRad / 2 + Math.PI / 2, fovRad);
      }
      default:
        return new THREE.SphereGeometry(500, 80, 40, 0, phiLength);
    }
  }

  function modifyUVs(geometry: THREE.BufferGeometry, region: { x: number; y: number; w: number; h: number }): THREE.BufferGeometry {
    const uvAttr = geometry.getAttribute('uv');
    if (!uvAttr) return geometry;
    const uvArray = uvAttr.array as Float32Array;
    for (let i = 0; i < uvArray.length; i += 2) {
      uvArray[i] = region.x + uvArray[i] * region.w;
      uvArray[i + 1] = region.y + uvArray[i + 1] * region.h;
    }
    uvAttr.needsUpdate = true;
    return geometry;
  }

  const phiLength =
    projection === 'sphere360' ? 2 * Math.PI :
    projection === 'hemisphere180' ? Math.PI :
    (fov * Math.PI) / 180;

  switch (layout) {
    case 'sbs': {
      const leftGeom = createGeometry(phiLength);
      modifyUVs(leftGeom, { x: 0, y: 0, w: 0.5, h: 1 });
      const leftMesh = new THREE.Mesh(leftGeom, new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }));
      leftMesh.layers.set(1);
      meshes.push(leftMesh);

      const rightGeom = createGeometry(phiLength);
      modifyUVs(rightGeom, { x: 0.5, y: 0, w: 0.5, h: 1 });
      const rightMesh = new THREE.Mesh(rightGeom, new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }));
      rightMesh.layers.set(2);
      meshes.push(rightMesh);
      break;
    }
    case 'tb': {
      const leftGeom = createGeometry(phiLength);
      modifyUVs(leftGeom, { x: 0, y: 0.5, w: 1, h: 0.5 });
      const leftMesh = new THREE.Mesh(leftGeom, new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }));
      leftMesh.layers.set(1);
      meshes.push(leftMesh);

      const rightGeom = createGeometry(phiLength);
      modifyUVs(rightGeom, { x: 0, y: 0, w: 1, h: 0.5 });
      const rightMesh = new THREE.Mesh(rightGeom, new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }));
      rightMesh.layers.set(2);
      meshes.push(rightMesh);
      break;
    }
    case 'mono': {
      const geom = createGeometry(phiLength);
      const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }));
      mesh.layers.enable(1);
      mesh.layers.enable(2);
      meshes.push(mesh);
      break;
    }
  }
  return meshes;
}
