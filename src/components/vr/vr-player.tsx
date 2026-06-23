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
} from 'lucide-react';

import * as THREE from 'three';

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
  const [useScreenCapture, setUseScreenCapture] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);

  // Camera rotation state for mouse drag
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const cameraRotation = useRef({ lon: 0, lat: 0 });

  // Initialize Three.js scene
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!canvasRef.current) return;

      // Check WebXR support
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

      // Create renderer
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

      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111111);
      sceneRef.current = scene;

      // Create camera with layers for stereo
      const camera = new THREE.PerspectiveCamera(
        75,
        canvasRef.current.clientWidth / canvasRef.current.clientHeight,
        0.1,
        2000
      );
      camera.position.set(0, 0, 0);
      // Enable both layers so we see both eyes in non-VR preview
      camera.layers.enable(1);
      camera.layers.enable(2);
      cameraRef.current = camera;

      // Handle WebXR session start/end for stereo layers
      renderer.xr.addEventListener('sessionstart', () => {
        const xrCamera = renderer.xr.getCamera();
        if (xrCamera && xrCamera.cameras.length === 2) {
          // Left eye camera: see layer 0 (default) + layer 1
          xrCamera.cameras[0].layers.enable(1);
          xrCamera.cameras[0].layers.disable(2);
          // Right eye camera: see layer 0 (default) + layer 2
          xrCamera.cameras[1].layers.enable(2);
          xrCamera.cameras[1].layers.disable(1);
        }
        // Main camera: disable layer 2 for left eye view, enable layer 1
        // This ensures the non-VR fallback shows at least the left eye
        camera.layers.disable(2);
      });

      renderer.xr.addEventListener('sessionend', () => {
        // Re-enable both layers for preview
        camera.layers.enable(1);
        camera.layers.enable(2);
      });

      if (mounted) setIsInitializing(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [setIsVRSupported]);

  // Build/rebuild VR meshes when settings change or video loads
  const buildScene = useCallback(
    (videoElement: HTMLVideoElement | HTMLCanvasElement) => {
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

      // Create video texture
      let texture: THREE.Texture;
      if (videoElement instanceof HTMLCanvasElement) {
        texture = new THREE.CanvasTexture(videoElement);
      } else {
        texture = new THREE.VideoTexture(videoElement);
      }
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.colorSpace = THREE.SRGBColorSpace;

      // Build geometry based on projection type and layout
      const meshes = createVRMeshes(texture, layout, projection, fov);

      meshes.forEach((mesh) => scene.add(mesh));
      meshesRef.current = meshes;

      // Update camera layers for stereo preview
      const camera = cameraRef.current;
      if (camera) {
        camera.layers.enable(1);
        camera.layers.enable(2);
      }
    },
    [layout, projection, fov]
  );

  // Generate a test pattern canvas for demo mode
  const generateTestPattern = useCallback((): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 3840;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;

    // Create a stereo test pattern (side-by-side)
    const halfWidth = canvas.width / 2;

    for (let eye = 0; eye < 2; eye++) {
      const offsetX = eye * halfWidth;
      const label = eye === 0 ? 'LEFT EYE' : 'RIGHT EYE';
      const hue = eye === 0 ? 200 : 0; // Blue for left, red for right

      // Background gradient
      const gradient = ctx.createRadialGradient(
        offsetX + halfWidth / 2,
        canvas.height / 2,
        50,
        offsetX + halfWidth / 2,
        canvas.height / 2,
        halfWidth / 2
      );
      gradient.addColorStop(0, `hsl(${hue}, 30%, 40%)`);
      gradient.addColorStop(1, `hsl(${hue}, 50%, 10%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(offsetX, 0, halfWidth, canvas.height);

      // Grid lines
      ctx.strokeStyle = `hsla(${hue}, 60%, 60%, 0.3)`;
      ctx.lineWidth = 1;
      for (let x = 0; x < halfWidth; x += 120) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x, 0);
        ctx.lineTo(offsetX + x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 120) {
        ctx.beginPath();
        ctx.moveTo(offsetX, y);
        ctx.lineTo(offsetX + halfWidth, y);
        ctx.stroke();
      }

      // Center cross
      ctx.strokeStyle = `hsla(${hue}, 80%, 80%, 0.8)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(offsetX + halfWidth / 2 - 60, canvas.height / 2);
      ctx.lineTo(offsetX + halfWidth / 2 + 60, canvas.height / 2);
      ctx.moveTo(offsetX + halfWidth / 2, canvas.height / 2 - 60);
      ctx.lineTo(offsetX + halfWidth / 2, canvas.height / 2 + 60);
      ctx.stroke();

      // Circle
      ctx.beginPath();
      ctx.arc(
        offsetX + halfWidth / 2,
        canvas.height / 2,
        200,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // Label
      ctx.fillStyle = `hsl(${hue}, 80%, 90%)`;
      ctx.font = 'bold 64px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, offsetX + halfWidth / 2, 100);

      // Angle markers
      ctx.font = '32px monospace';
      ctx.fillStyle = `hsla(${hue}, 60%, 70%, 0.8)`;
      const angles = [-90, -60, -30, 0, 30, 60, 90];
      angles.forEach((angle) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        const x = offsetX + halfWidth / 2 + Math.cos(rad) * 400;
        const y = canvas.height / 2 + Math.sin(rad) * 400;
        ctx.fillText(`${angle}°`, x, y);
      });

      // Corner markers
      const cornerSize = 40;
      ctx.strokeStyle = `hsla(${hue}, 80%, 80%, 0.6)`;
      ctx.lineWidth = 2;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(offsetX + 20, 20 + cornerSize);
      ctx.lineTo(offsetX + 20, 20);
      ctx.lineTo(offsetX + 20 + cornerSize, 20);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(offsetX + halfWidth - 20 - cornerSize, 20);
      ctx.lineTo(offsetX + halfWidth - 20, 20);
      ctx.lineTo(offsetX + halfWidth - 20, 20 + cornerSize);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(offsetX + 20, canvas.height - 20 - cornerSize);
      ctx.lineTo(offsetX + 20, canvas.height - 20);
      ctx.lineTo(offsetX + 20 + cornerSize, canvas.height - 20);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(
        offsetX + halfWidth - 20 - cornerSize,
        canvas.height - 20
      );
      ctx.lineTo(offsetX + halfWidth - 20, canvas.height - 20);
      ctx.lineTo(
        offsetX + halfWidth - 20,
        canvas.height - 20 - cornerSize
      );
      ctx.stroke();
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
        return;
      }

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.playsInline = true;
      video.loop = true;
      video.muted = isMuted;

      // Try to load the video through proxy if it's not a direct URL
      let videoSrc = videoSource.src;
      if (!videoSource.isDirectUrl && !videoSrc.startsWith('blob:')) {
        videoSrc = `/api/proxy?url=${encodeURIComponent(videoSrc)}`;
      }

      video.src = videoSrc;
      videoRef.current = video;
      setHasVideo(true);

      try {
        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => reject(new Error('Failed to load video'));
          video.load();
          setTimeout(
            () => reject(new Error('Video load timeout (20s)')),
            20000
          );
        });

        if (!mounted) return;

        await video.play();
        if (mounted) {
          setIsPlaying(true);
          setVideoError(null);
        }

        // Build the VR scene
        buildScene(video);
      } catch (err) {
        if (mounted) {
          setVideoError(
            `Failed to load video: ${err instanceof Error ? err.message : 'Unknown error'}. Try using "Screen Capture" or "Test Pattern" mode instead.`
          );
        }
      }
    }

    loadVideo();

    return () => {
      mounted = false;
    };
  }, [videoSource, buildScene, isMuted]);

  // Rebuild meshes when VR settings change (but don't reload video)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    buildScene(video);
  }, [layout, projection, fov, buildScene]);

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
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
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

  // Handle demo/test pattern
  const handleTestPattern = useCallback(() => {
    const testCanvas = generateTestPattern();
    buildScene(testCanvas);
    setHasVideo(true);
    setIsPlaying(true);
    setVideoError(null);
    setUseScreenCapture(false);
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
        // Re-enable both layers for preview
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

  // Enter fullscreen (non-VR fallback)
  const handleEnterFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    }
  }, []);

  // Screen capture mode
  const handleScreenCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 3840 },
          height: { ideal: 2160 },
        },
        audio: false,
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;

      await video.play();

      videoRef.current = video;
      setHasVideo(true);
      setUseScreenCapture(true);

      buildScene(video);
      setIsPlaying(true);
      setVideoError(null);

      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.onended = () => {
        setUseScreenCapture(false);
        setIsPlaying(false);
      };
    } catch (err) {
      console.error('Screen capture failed:', err);
      setVideoError('Screen capture was cancelled or failed. Please try again.');
    }
  }, [buildScene]);

  // Play/Pause
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Mute/Unmute
  const handleMuteToggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  // Go back
  const handleGoBack = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.src = '';
      video.srcObject = null;
      videoRef.current = null;
      setHasVideo(false);
    }
    const renderer = rendererRef.current;
    if (renderer) {
      renderer.dispose();
      rendererRef.current = null;
    }
    setMode('input');
  }, [setMode]);

  // Mouse/touch drag for camera rotation in preview mode
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

    const target = new THREE.Vector3(
      500 * Math.sin(phi) * Math.cos(theta),
      500 * Math.cos(phi),
      500 * Math.sin(phi) * Math.sin(theta)
    );

    camera.lookAt(target);
    prevMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'f':
          handleEnterFullscreen();
          break;
        case 'm':
          handleMuteToggle();
          break;
        case 'Escape':
          if (isInVR) {
            vrSessionRef.current?.end();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleEnterFullscreen, handleMuteToggle, isInVR]);

  return (
    <TooltipProvider>
      <div className="w-full space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <Badge variant="outline" className="text-xs">
              {useScreenCapture
                ? 'Screen Capture'
                : videoSource?.isDirectUrl
                  ? 'Direct URL'
                  : 'Webpage Video'}
            </Badge>
            {isInVR && (
              <Badge className="bg-green-600 text-white text-xs">
                <Glasses className="w-3 h-3 mr-1" />
                VR Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="w-3 h-3" />
            <span>
              {layout === 'sbs'
                ? 'SBS'
                : layout === 'tb'
                  ? 'TB'
                  : 'Mono'}{' '}
              ·{' '}
              {projection === 'sphere360'
                ? '360°'
                : projection === 'hemisphere180'
                  ? '180°'
                  : 'Cyl'}{' '}
              · {fov}°
            </span>
          </div>
        </div>

        {/* Error message */}
        {videoError && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-4 pb-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm text-destructive">{videoError}</p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleScreenCapture}
                  >
                    <Monitor className="w-3 h-3 mr-1" />
                    Screen Capture
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestPattern}
                  >
                    <TestTube className="w-3 h-3 mr-1" />
                    Test Pattern
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

          {/* Loading overlay */}
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center space-y-2">
                <RotateCcw className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Initializing VR player...
                </p>
              </div>
            </div>
          )}

          {/* No video placeholder */}
          {!hasVideo && !isInitializing && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center space-y-3">
                <Glasses className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  No video loaded
                </p>
                <Button size="sm" onClick={handleTestPattern}>
                  <TestTube className="w-3 h-3 mr-1" />
                  Load Test Pattern
                </Button>
              </div>
            </div>
          )}

          {/* Interaction hint */}
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePlayPause}
                  disabled={!hasVideo}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Play / Pause</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMuteToggle}
                  disabled={!hasVideo}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mute / Unmute</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestPattern}
                  aria-label="Load test pattern"
                >
                  <TestTube className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Demo</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Load test pattern for VR preview</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleScreenCapture}
                  aria-label="Screen capture"
                >
                  <Monitor className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Capture</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Capture screen/window for VR</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEnterFullscreen}
                  aria-label="Enter fullscreen"
                >
                  <Maximize className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Fullscreen</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Enter fullscreen mode</TooltipContent>
            </Tooltip>
            {isVRSupported && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" onClick={handleEnterVR}>
                    <Glasses className="w-4 h-4 mr-1" />
                    Enter VR
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Enter immersive VR mode (requires headset)
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* VR not supported warning */}
        {!isVRSupported && !isInitializing && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium">WebXR Not Available</p>
                  <p className="text-muted-foreground">
                    WebXR is not supported in this browser. To use VR mode with
                    SteamVR, open this page in a WebXR-compatible browser
                    (Chrome/Edge with WebXR support) while your VR headset is
                    connected and SteamVR is running. You can still use
                    fullscreen mode and screen capture for testing.
                  </p>
                  <div className="mt-2 p-2 rounded bg-muted text-xs space-y-1">
                    <p className="font-medium">Setup Guide:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                      <li>Install SteamVR on your PC</li>
                      <li>Connect your VR headset</li>
                      <li>Open this page in Chrome/Edge</li>
                      <li>Click &quot;Enter VR&quot; to start</li>
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

// ====== Helper: Create VR Meshes ======

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
        return new THREE.CylinderGeometry(
          radius,
          radius,
          radius * 0.5625,
          64,
          1,
          true,
          -fovRad / 2 + Math.PI / 2,
          fovRad
        );
      }
      default:
        return new THREE.SphereGeometry(500, 80, 40, 0, phiLength);
    }
  }

  function modifyUVs(
    geometry: THREE.BufferGeometry,
    region: { x: number; y: number; w: number; h: number }
  ): THREE.BufferGeometry {
    const uvAttr = geometry.getAttribute('uv');
    if (!uvAttr) return geometry;

    const uvArray = uvAttr.array as Float32Array;
    for (let i = 0; i < uvArray.length; i += 2) {
      const u = uvArray[i];
      const v = uvArray[i + 1];
      uvArray[i] = region.x + u * region.w;
      uvArray[i + 1] = region.y + v * region.h;
    }

    uvAttr.needsUpdate = true;
    return geometry;
  }

  const phiLength =
    projection === 'sphere360'
      ? 2 * Math.PI
      : projection === 'hemisphere180'
        ? Math.PI
        : (fov * Math.PI) / 180;

  switch (layout) {
    case 'sbs': {
      const leftGeom = createGeometry(phiLength);
      modifyUVs(leftGeom, { x: 0, y: 0, w: 0.5, h: 1 });
      const leftMesh = new THREE.Mesh(
        leftGeom,
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
      );
      leftMesh.layers.set(1);
      meshes.push(leftMesh);

      const rightGeom = createGeometry(phiLength);
      modifyUVs(rightGeom, { x: 0.5, y: 0, w: 0.5, h: 1 });
      const rightMesh = new THREE.Mesh(
        rightGeom,
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
      );
      rightMesh.layers.set(2);
      meshes.push(rightMesh);
      break;
    }

    case 'tb': {
      const leftGeom = createGeometry(phiLength);
      modifyUVs(leftGeom, { x: 0, y: 0.5, w: 1, h: 0.5 });
      const leftMesh = new THREE.Mesh(
        leftGeom,
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
      );
      leftMesh.layers.set(1);
      meshes.push(leftMesh);

      const rightGeom = createGeometry(phiLength);
      modifyUVs(rightGeom, { x: 0, y: 0, w: 1, h: 0.5 });
      const rightMesh = new THREE.Mesh(
        rightGeom,
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
      );
      rightMesh.layers.set(2);
      meshes.push(rightMesh);
      break;
    }

    case 'mono': {
      const geom = createGeometry(phiLength);
      const mesh = new THREE.Mesh(
        geom,
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
      );
      mesh.layers.enable(1);
      mesh.layers.enable(2);
      meshes.push(mesh);
      break;
    }
  }

  return meshes;
}
