'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useVRStore } from '@/store/vr-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Maximize2,
  MousePointer2,
  MonitorPlay,
  Loader2,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface DetectedVideo {
  index: number;
  src: string;
  width: number;
  height: number;
  isPlaying: boolean;
}

export function PageViewer() {
  const {
    pageUrl,
    isPageLoading,
    setIsPageLoading,
    setMode,
    setVideoSource,
    setSelectionMode,
  } = useVRStore();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [detectedVideos, setDetectedVideos] = useState<DetectedVideo[]>([]);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(
    null
  );
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Get the proxy URL
  const proxyUrl = pageUrl
    ? `/api/proxy?url=${encodeURIComponent(pageUrl)}`
    : '';

  // Listen for messages from the proxied iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'proxy-video-detect') {
        setDetectedVideos(event.data.videos || []);
      }
      if (event.data?.type === 'proxy-page-loaded') {
        setIframeLoaded(true);
        setIsPageLoading(false);
      }
      if (event.data?.type === 'proxy-video-clicked') {
        setSelectedVideoIndex(event.data.index);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setIsPageLoading]);

  // Request video detection from iframe
  const requestVideoDetection = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'proxy-request-videos' },
        '*'
      );
    }
  }, []);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    setIsPageLoading(false);
    // Request video detection after a short delay
    setTimeout(requestVideoDetection, 1000);
    setTimeout(requestVideoDetection, 3000);
  }, [setIsPageLoading, requestVideoDetection]);

  // Select a detected video
  const handleSelectVideo = useCallback(
    (index: number) => {
      setSelectedVideoIndex(index);
      const video = detectedVideos[index];
      if (video?.src) {
        // Try to use the video source directly
        let videoSrc = video.src;
        // If the src is a relative URL, make it absolute
        if (videoSrc && !videoSrc.startsWith('http') && !videoSrc.startsWith('blob:')) {
          try {
            videoSrc = new URL(videoSrc, pageUrl).href;
          } catch {
            // keep as-is
          }
        }
        setVideoSource({
          src: videoSrc,
          width: video.width,
          height: video.height,
          isDirectUrl: false,
        });
      }
    },
    [detectedVideos, pageUrl, setVideoSource]
  );

  // Use fullscreen video
  const handleFullscreenVideo = useCallback(() => {
    if (selectedVideoIndex !== null && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'proxy-fullscreen-video', index: selectedVideoIndex },
        '*'
      );
    }
    // Use the selected video source for VR
    setSelectionMode('fullscreen');
    const video = detectedVideos[selectedVideoIndex || 0];
    if (video?.src) {
      let videoSrc = video.src;
      if (!videoSrc.startsWith('http') && !videoSrc.startsWith('blob:')) {
        try {
          videoSrc = new URL(videoSrc, pageUrl).href;
        } catch {
          // keep as-is
        }
      }
      setVideoSource({
        src: videoSrc,
        width: video.width,
        height: video.height,
        isDirectUrl: false,
      });
      setMode('vr');
    }
  }, [selectedVideoIndex, detectedVideos, pageUrl, setVideoSource, setSelectionMode, setMode]);

  // Region selection handlers
  const handleStartSelection = useCallback(() => {
    setIsSelecting(true);
    setSelectionBox(null);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting) return;
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      setSelectionBox({
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        endX: e.clientX - rect.left,
        endY: e.clientY - rect.top,
      });
    },
    [isSelecting]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting || !selectionBox) return;
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      setSelectionBox((prev) =>
        prev
          ? {
              ...prev,
              endX: e.clientX - rect.left,
              endY: e.clientY - rect.top,
            }
          : null
      );
    },
    [isSelecting, selectionBox]
  );

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !selectionBox) return;
    setIsSelecting(false);

    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.min(selectionBox.startX, selectionBox.endX) / rect.width;
    const y = Math.min(selectionBox.startY, selectionBox.endY) / rect.height;
    const width =
      Math.abs(selectionBox.endX - selectionBox.startX) / rect.width;
    const height =
      Math.abs(selectionBox.endY - selectionBox.startY) / rect.height;

    // Only accept if selection is large enough
    if (width > 0.05 && height > 0.05) {
      setSelectionMode('region');
      // For region selection, we'll use screen capture since we can't directly crop iframe video
      // The region info is stored for reference
      setMode('vr');
    }
  }, [isSelecting, selectionBox, setSelectionMode, setMode]);

  // Use direct video URL if detected
  const handleUseVideoDirectly = useCallback(() => {
    const video = detectedVideos[selectedVideoIndex || 0];
    if (video?.src) {
      let videoSrc = video.src;
      if (!videoSrc.startsWith('http') && !videoSrc.startsWith('blob:')) {
        try {
          videoSrc = new URL(videoSrc, pageUrl).href;
        } catch {
          // keep as-is
        }
      }
      setVideoSource({
        src: videoSrc,
        width: video.width,
        height: video.height,
        isDirectUrl: false,
      });
      setSelectionMode('fullscreen');
      setMode('vr');
    }
  }, [detectedVideos, selectedVideoIndex, pageUrl, setVideoSource, setSelectionMode, setMode]);

  // Go back to input
  const handleGoBack = useCallback(() => {
    setMode('input');
    setDetectedVideos([]);
    setSelectedVideoIndex(null);
    setIframeLoaded(false);
  }, [setMode]);

  // Open original page in new tab
  const handleOpenOriginal = useCallback(() => {
    window.open(pageUrl, '_blank');
  }, [pageUrl]);

  // Compute selection box style
  const selectionStyle = selectionBox
    ? {
        left: `${Math.min(selectionBox.startX, selectionBox.endX)}px`,
        top: `${Math.min(selectionBox.startY, selectionBox.endY)}px`,
        width: `${Math.abs(selectionBox.endX - selectionBox.startX)}px`,
        height: `${Math.abs(selectionBox.endY - selectionBox.startY)}px`,
      }
    : null;

  return (
    <div className="w-full space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground truncate max-w-[300px]">
            {pageUrl}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={requestVideoDetection}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Rescan
          </Button>
          <Button variant="ghost" size="sm" onClick={handleOpenOriginal}>
            <ExternalLink className="w-4 h-4 mr-1" />
            Open Original
          </Button>
        </div>
      </div>

      {/* Video detection results */}
      {detectedVideos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MonitorPlay className="w-4 h-4" />
              Detected Videos
              <Badge variant="secondary">{detectedVideos.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 flex-wrap">
              <Select
                value={selectedVideoIndex?.toString()}
                onValueChange={(v) => handleSelectVideo(parseInt(v))}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select a video..." />
                </SelectTrigger>
                <SelectContent>
                  {detectedVideos.map((v, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      Video {i + 1} ({v.width}×{v.height})
                      {v.isPlaying ? ' ● Playing' : ' ○ Paused'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedVideoIndex !== null && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUseVideoDirectly}>
                    <Maximize2 className="w-3 h-3 mr-1" />
                    Use This Video
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleFullscreenVideo}
                  >
                    <Maximize2 className="w-3 h-3 mr-1" />
                    Fullscreen & Enter VR
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Iframe with overlay */}
      <div className="relative border rounded-lg overflow-hidden bg-black">
        {isPageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-20">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading webpage...
              </p>
            </div>
          </div>
        )}

        <div className="relative" style={{ height: '70vh' }}>
          <iframe
            ref={iframeRef}
            src={proxyUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            allow="autoplay; fullscreen; vr"
            onLoad={handleIframeLoad}
            title="Webpage Preview"
          />

          {/* Selection overlay */}
          <div
            ref={overlayRef}
            className={`absolute inset-0 ${
              isSelecting
                ? 'cursor-crosshair'
                : 'pointer-events-none'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {selectionStyle && (
              <div
                className="absolute border-2 border-primary bg-primary/10 z-10"
                style={selectionStyle}
              >
                <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                  Region Selection
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={isSelecting ? 'default' : 'outline'}
            size="sm"
            onClick={handleStartSelection}
            disabled={!iframeLoaded}
          >
            <MousePointer2 className="w-4 h-4 mr-1" />
            {isSelecting ? 'Drawing Selection...' : 'Select Region'}
          </Button>
        </div>

        <div className="flex gap-2">
          {detectedVideos.length === 0 && iframeLoaded && (
            <p className="text-sm text-muted-foreground self-center">
              No videos detected. Use &quot;Select Region&quot; to crop a video
              area, or try &quot;Rescan&quot;.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
