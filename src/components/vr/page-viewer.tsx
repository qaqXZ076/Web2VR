'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useVRStore } from '@/store/vr-store';
import type { SelectionRegion } from '@/store/vr-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Maximize2,
  MousePointer2,
  ExternalLink,
  Monitor,
  Square,
  Check,
  X,
  RotateCcw,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface DrawingRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function PageViewer() {
  const {
    pageUrl,
    setIsPageLoading,
    setMode,
    setSelectionRegion,
    setUseFullscreen,
  } = useVRStore();

  const overlayRef = useRef<HTMLDivElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [drawingRect, setDrawingRect] = useState<DrawingRect | null>(null);
  const [confirmedSelection, setConfirmedSelection] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const proxyUrl = pageUrl ? `/api/proxy?url=${encodeURIComponent(pageUrl)}` : '';

  // Listen for page load from proxy
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'proxy-page-loaded') {
        setIframeLoaded(true);
        setIsPageLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setIsPageLoading]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    setIframeError(false);
    setIsPageLoading(false);
  }, [setIsPageLoading]);

  const handleIframeError = useCallback(() => {
    setIframeError(true);
    setIsPageLoading(false);
  }, [setIsPageLoading]);

  // Start region selection mode
  const handleStartSelection = useCallback(() => {
    setIsSelecting(true);
    setDrawingRect(null);
    setConfirmedSelection(null);
  }, []);

  const handleCancelSelection = useCallback(() => {
    setIsSelecting(false);
    setDrawingRect(null);
    setConfirmedSelection(null);
  }, []);

  // Mouse handlers for drawing the selection rectangle
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting) return;
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDrawingRect({
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        endX: e.clientX - rect.left,
        endY: e.clientY - rect.top,
      });
      setConfirmedSelection(null);
    },
    [isSelecting]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting || !drawingRect) return;
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      setDrawingRect((prev) =>
        prev ? { ...prev, endX: x, endY: y } : null
      );
    },
    [isSelecting, drawingRect]
  );

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !drawingRect) return;
    const w = Math.abs(drawingRect.endX - drawingRect.startX);
    const h = Math.abs(drawingRect.endY - drawingRect.startY);
    if (w > 20 && h > 20) {
      setConfirmedSelection({
        x: Math.min(drawingRect.startX, drawingRect.endX),
        y: Math.min(drawingRect.startY, drawingRect.endY),
        width: w,
        height: h,
      });
    }
  }, [isSelecting, drawingRect]);

  // Confirm the selected region and go to VR mode
  const handleConfirmSelection = useCallback(() => {
    if (!confirmedSelection || !overlayRef.current) return;
    const containerRect = overlayRef.current.getBoundingClientRect();
    // Store selection as fractions (0-1) of the container size
    const region: SelectionRegion = {
      x: confirmedSelection.x / containerRect.width,
      y: confirmedSelection.y / containerRect.height,
      width: confirmedSelection.width / containerRect.width,
      height: confirmedSelection.height / containerRect.height,
    };
    setSelectionRegion(region);
    setUseFullscreen(false);
    setMode('vr');
  }, [confirmedSelection, setSelectionRegion, setUseFullscreen, setMode]);

  // Use the full page (no cropping)
  const handleUseFullscreen = useCallback(() => {
    setSelectionRegion(null);
    setUseFullscreen(true);
    setMode('vr');
  }, [setSelectionRegion, setUseFullscreen, setMode]);

  // Go back
  const handleGoBack = useCallback(() => {
    setMode('input');
    setIframeLoaded(false);
    setIframeError(false);
  }, [setMode]);

  // Open original page in new tab
  const handleOpenOriginal = useCallback(() => {
    window.open(pageUrl, '_blank');
  }, [pageUrl]);

  // Reload the iframe
  const handleReload = useCallback(() => {
    setIframeLoaded(false);
    setIframeError(false);
    setIsPageLoading(true);
    // Force iframe reload by changing src
    const iframe = overlayRef.current?.parentElement?.querySelector('iframe');
    if (iframe) {
      const src = iframe.src;
      iframe.src = '';
      setTimeout(() => { iframe.src = src; }, 100);
    }
  }, [setIsPageLoading]);

  // Compute selection box style for the drawing rectangle
  const drawingStyle = drawingRect
    ? {
        left: `${Math.min(drawingRect.startX, drawingRect.endX)}px`,
        top: `${Math.min(drawingRect.startY, drawingRect.endY)}px`,
        width: `${Math.abs(drawingRect.endX - drawingRect.startX)}px`,
        height: `${Math.abs(drawingRect.endY - drawingRect.startY)}px`,
      }
    : null;

  // Compute style for the confirmed selection
  const confirmedStyle = confirmedSelection
    ? {
        left: `${confirmedSelection.x}px`,
        top: `${confirmedSelection.y}px`,
        width: `${confirmedSelection.width}px`,
        height: `${confirmedSelection.height}px`,
      }
    : null;

  return (
    <div className="w-full space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
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
          <Button variant="ghost" size="sm" onClick={handleReload}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reload
          </Button>
          <Button variant="ghost" size="sm" onClick={handleOpenOriginal}>
            <ExternalLink className="w-4 h-4 mr-1" />
            Open in New Tab
          </Button>
        </div>
      </div>

      {/* Proxy error hint */}
      {iframeError && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">Page failed to load through proxy</p>
              <p className="text-muted-foreground">
                This website may block proxy access. You can:
              </p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-0.5">
                <li>Open it in a new tab, play the video fullscreen</li>
                <li>Come back and click <strong>&quot;Enter VR (Screen Capture)&quot;</strong> below</li>
                <li>Select the browser tab with the video when prompted</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-3 pb-3 flex items-center gap-3">
          <MousePointer2 className="w-5 h-5 text-primary shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Select the video area on the page</p>
            <p className="text-xs text-muted-foreground">
              Click <strong>&quot;Select Region&quot;</strong> below, then draw a rectangle around the video.
              Or use <strong>&quot;Full Page&quot;</strong> to capture everything.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Selection controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {isSelecting ? (
          <>
            <span className="text-sm text-muted-foreground">
              Click and drag on the page to select the video area
            </span>
            <div className="flex-1" />
            {confirmedSelection && (
              <Button size="sm" onClick={handleConfirmSelection}>
                <Check className="w-4 h-4 mr-1" />
                Use Selected Region
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleCancelSelection}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={handleStartSelection} disabled={!iframeLoaded}>
              <MousePointer2 className="w-4 h-4 mr-1" />
              Select Region
            </Button>
            <Button size="sm" variant="outline" onClick={handleUseFullscreen}>
              <Maximize2 className="w-4 h-4 mr-1" />
              Full Page
            </Button>
            <div className="flex-1" />
            <Button size="sm" onClick={handleUseFullscreen}>
              <Monitor className="w-4 h-4 mr-1" />
              Enter VR (Screen Capture)
            </Button>
          </>
        )}
      </div>

      {/* Iframe with overlay */}
      <div className="relative border rounded-lg overflow-hidden bg-black">
        <div className="relative" style={{ height: '68vh' }}>
          <iframe
            src={proxyUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            allow="autoplay; fullscreen; vr; encrypted-media"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Webpage Preview"
          />

          {/* Selection overlay */}
          <div
            ref={overlayRef}
            className={`absolute inset-0 ${
              isSelecting ? 'cursor-crosshair' : 'pointer-events-none'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Drawing selection (while dragging) */}
            {drawingStyle && !confirmedSelection && (
              <div
                className="absolute border-2 border-dashed border-primary bg-primary/10 z-10"
                style={drawingStyle}
              >
                <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded whitespace-nowrap">
                  {Math.round(Math.abs(drawingRect!.endX - drawingRect!.startX))} ×{' '}
                  {Math.round(Math.abs(drawingRect!.endY - drawingRect!.startY))} px
                </div>
              </div>
            )}

            {/* Confirmed selection with dark overlay */}
            {confirmedStyle && confirmedSelection && (
              <div className="absolute inset-0 z-10">
                {/* Dark overlay outside selection */}
                <div className="absolute inset-0 bg-black/50" />
                {/* Clear the selected region */}
                <div
                  className="absolute border-2 border-primary bg-transparent"
                  style={confirmedStyle}
                >
                  <div className="absolute -top-7 left-0 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded whitespace-nowrap flex items-center gap-1">
                    <Square className="w-3 h-3" />
                    Selected: {Math.round(confirmedSelection.width)} × {Math.round(confirmedSelection.height)} px
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Loading overlay */}
          {!iframeLoaded && !iframeError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
              <div className="text-center space-y-2">
                <RotateCcw className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading page...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-3 pb-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">How to select the video area:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Interact with the page — find and play the VR video</li>
                  <li>Click <strong>Select Region</strong> and draw a rectangle around the video</li>
                  <li>Click <strong>Use Selected Region</strong> to confirm, then capture the screen in VR mode</li>
                </ol>
                <p className="mt-1.5">
                  If the page doesn&apos;t load (blocked by the site), open it in a new tab instead and use
                  &quot;Enter VR (Screen Capture)&quot; to capture it directly.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
