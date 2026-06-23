'use client';

import { useState, useCallback } from 'react';
import { useVRStore } from '@/store/vr-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Link, Play, Loader2, TestTube, Glasses, MonitorPlay, Info } from 'lucide-react';

export function URLInput() {
  const { pageUrl, setPageUrl, setIsPageLoading, setMode, setVideoSource } =
    useVRStore();
  const [inputValue, setInputValue] = useState(pageUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      let url = inputValue.trim();
      if (!url) {
        setError('Please enter a URL');
        return;
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
        setInputValue(url);
      }

      try {
        new URL(url);
      } catch {
        setError('Invalid URL format');
        return;
      }

      setPageUrl(url);
      setIsPageLoading(true);
      setIsLoading(true);
      setMode('preview');
    },
    [inputValue, setPageUrl, setIsPageLoading, setMode]
  );

  const handleDirectVideo = useCallback(() => {
    let url = inputValue.trim();
    if (!url) {
      setError('Please enter a video URL');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      setInputValue(url);
    }

    try {
      new URL(url);
    } catch {
      setError('Invalid URL format');
      return;
    }

    setVideoSource({
      src: url,
      width: 0,
      height: 0,
      isDirectUrl: true,
    });
    setMode('vr');
  }, [inputValue, setVideoSource, setMode]);

  const handleTestPattern = useCallback(() => {
    setVideoSource({
      src: 'test-pattern',
      width: 3840,
      height: 1920,
      isDirectUrl: true,
    });
    setMode('vr');
  }, [setVideoSource, setMode]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Hero section */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Glasses className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          WebXR VR Video Player
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Convert web-based VR180/360 side-by-side videos into WebXR format for
          SteamVR viewing. Enter a webpage URL or direct video link to get
          started.
        </p>
      </div>

      {/* URL Input Card */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError(null);
                }}
                placeholder="Enter webpage URL or direct video link..."
                className="pl-10 h-12 text-base"
                type="url"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading Page...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Load Webpage
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={handleDirectVideo}
              >
                <Play className="w-4 h-4 mr-2" />
                Direct Video URL
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Start: Test Pattern */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-3">
            Don&apos;t have a VR video URL handy? Load a test pattern to try the
            VR player and experiment with different projection settings.
          </p>
          <Button
            variant="outline"
            className="w-full h-10"
            onClick={handleTestPattern}
          >
            <TestTube className="w-4 h-4 mr-2" />
            Load Test Pattern & Enter VR Mode
          </Button>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Step 1
          </p>
          <p className="text-sm font-medium">Enter URL</p>
          <p className="text-xs text-muted-foreground mt-1">
            Webpage or direct video link
          </p>
        </div>
        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <MonitorPlay className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Step 2
          </p>
          <p className="text-sm font-medium">Select Video</p>
          <p className="text-xs text-muted-foreground mt-1">
            Pick video or region on page
          </p>
        </div>
        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Glasses className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Step 3
          </p>
          <p className="text-sm font-medium">Enter VR</p>
          <p className="text-xs text-muted-foreground mt-1">
            Configure & start VR session
          </p>
        </div>
      </div>

      {/* Compatibility info */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium text-foreground">VR Mode:</span>{' '}
                Requires WebXR-compatible browser (Chrome/Edge) with a VR
                headset connected via SteamVR.
              </p>
              <p>
                <span className="font-medium text-foreground">Fullscreen:</span>{' '}
                Works in any browser — use Screen Capture or direct video URLs.
              </p>
              <p>
                <span className="font-medium text-foreground">CORS:</span>{' '}
                Webpage URLs are loaded through a proxy. Direct video URLs may
                work better for cross-origin content.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
