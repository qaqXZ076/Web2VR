'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useVRStore } from '@/store/vr-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Maximize2,
  MousePointer2,
  ExternalLink,
  Monitor,
  Square,
  RotateCcw,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';

interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function PageViewer() {
  const { pageUrl, setIsPageLoading, setMode } = useVRStore();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
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

  // Start region selection
  const handleStartSelection = useCallback(() => {
    setIsSelecting(true);
    setSelectionRect(null);
    setConfirmedSelection(null);
  }, []);

  const handleCancelSelection = useCallback(() => {
    setIsSelecting(false);
    setSelectionRect(null);
    setConfirmedSelection(null);
  }, []);

  // Mouse handlers for region selection
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting) return;
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      setSelectionRect({
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
      if (!isSelecting || !selectionRect) return;
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      setSelectionRect((prev) =>
        prev ? { ...prev, endX: x, endY: y } : null
      );
    },
    [isSelecting, selectionRect]
  );

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !selectionRect) return;
    // Auto-confirm the selection if it's large enough
    const w = Math.abs(selectionRect.endX - selectionRect.startX);
    const h = Math.abs(selectionRect.endY - selectionRect.startY);
    if (w > 20 && h > 20) {
      setConfirmedSelection({
        x: Math.min(selectionRect.startX, selectionRect.endX),
        y: Math.min(selectionRect.startY, selectionRect.endY),
        width: w,
        height: h,
      });
    }
  }, [isSelecting, selectionRect]);

  // Use the whole page (fullscreen) for VR
  const handleUseFullscreen = useCallback(() => {
    setConfirmedSelection(null);
    setIsSelecting(false);
    // Go to VR mode with screen capture - no region cropping
    setMode('vr');
  }, [setMode]);

  // Use the selected region for VR
  const handleUseSelection = useCallback(() => {
    if (!confirmedSelection || !overlayRef.current) return;
    const containerRect = overlayRef.current.getBoundingClientRect();
    // Store selection as percentages of the container size
    const region = {
      x: confirmedSelection.x / containerRect.width,
      y: confirmedSelection.y / containerRect.height,
      width: confirmedSelection.width / containerRect.width,
      height: confirmedSelection.height / containerRect.height,
    };
    // Store the region info and go to VR mode
    setMode('vr');
    // The region info will be used during screen capture
    (window as unknown as Record<string, unknown>).__vrSelectionRegion = region;
  }, [confirmedSelection, setMode]);

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

  // Compute selection box style
  const selectionStyle = selectionRect
    ? {
        left: `${Math.min(selectionRect.startX, selectionRect.endX)}px`,
        top: `${Math.min(selectionRect.startY, selectionRect.endY)}px`,
        width: `${Math.abs(selectionRect.endX - selectionRect.startX)}px`,
        height: `${Math.abs(selectionRect.endY - selectionRect.startY)}px`,
      }
    : null;

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
                This website may block proxy access. You can open it in a new tab, play
                the video, then use &quot;Screen Capture&quot; in VR mode to capture it.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {isSelecting ? (
          <>
            <span className="text-sm text-muted-foreground">
              Draw a rectangle on the page to select the video area
            </span>
            <div className="flex-1" />
            {confirmedSelection && (
              <Button size="sm" onClick={handleUseSelection}>
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
              Use Full Page
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
            ref={iframeRef}
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
            {/* Drawing selection */}
            {selectionStyle && !confirmedSelection && (
              <div
                className="absolute border-2 border-dashed border-primary bg-primary/10 z-10"
                style={selectionStyle}
              >
                <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded whitespace-nowrap">
                  {Math.round(Math.abs(selectionRect!.endX - selectionRect!.startX))} ×{' '}
                  {Math.round(Math.abs(selectionRect!.endY - selectionRect!.startY))} px
                </div>
              </div>
            )}

            {/* Confirmed selection */}
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
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-3 pb-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">How to use:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Interact with the page — find and play the video you want to view in VR</li>
              <li>Use <strong>Select Region</strong> to draw a box around the video area, or <strong>Use Full Page</strong> for the whole page</li>
              <li>Click <strong>Enter VR (Screen Capture)</strong> — this will capture your screen and display it in VR</li>
            </ol>
            <p className="mt-1">
              💡 If the page doesn&apos;t load, open it in a new tab, then use Screen Capture in VR mode.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
