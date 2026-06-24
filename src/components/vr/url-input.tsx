'use client';

import { useState, useCallback } from 'react';
import { useVRStore } from '@/store/vr-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Link, Glasses, TestTube, Monitor, Info, MousePointer2 } from 'lucide-react';

export function URLInput() {
  const { pageUrl, setPageUrl, setIsPageLoading, setMode, setSelectionRegion, setUseFullscreen } = useVRStore();
  const [inputValue, setInputValue] = useState(pageUrl);
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
      setSelectionRegion(null);
      setUseFullscreen(false);
      setMode('preview');
    },
    [inputValue, setPageUrl, setIsPageLoading, setMode, setSelectionRegion, setUseFullscreen]
  );

  const handleDirectCapture = useCallback(() => {
    setSelectionRegion(null);
    setUseFullscreen(true);
    setMode('vr');
  }, [setSelectionRegion, setUseFullscreen, setMode]);

  const handleTestPattern = useCallback(() => {
    setSelectionRegion(null);
    setUseFullscreen(false);
    setMode('vr');
    // Store a flag so VR player knows to use test pattern
    (window as unknown as Record<string, unknown>).__vrTestPattern = true;
  }, [setSelectionRegion, setUseFullscreen, setMode]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Glasses className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">WebXR VR Video Player</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Load any webpage with a VR video, draw a rectangle around the video area,
          then view it in VR with SteamVR.
        </p>
      </div>

      {/* Main URL Input */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setError(null); }}
                placeholder="Enter webpage URL (e.g. bilibili.com/video/...)"
                className="pl-10 h-12 text-base"
                type="url"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full h-11">
              <Globe className="w-4 h-4 mr-2" />
              Load Webpage &amp; Select Video Area
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" />
              Screen Capture
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-3">
              Most reliable — works with any site. Open the video in your
              browser, then capture the screen directly.
            </p>
            <Button size="sm" className="w-full h-9" onClick={handleDirectCapture}>
              <Monitor className="w-3.5 h-3.5 mr-1.5" />
              Go to VR Player
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Test Pattern
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-3">
              Load a stereo test pattern to preview the VR player and
              experiment with projection settings.
            </p>
            <Button size="sm" variant="outline" className="w-full h-9" onClick={handleTestPattern}>
              <TestTube className="w-3.5 h-3.5 mr-1.5" />
              Load Test Pattern
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Step 1</p>
              <p className="text-sm font-medium">Open Page</p>
              <p className="text-[10px] text-muted-foreground mt-1">Load the webpage with the video</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <MousePointer2 className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Step 2</p>
              <p className="text-sm font-medium">Select Area</p>
              <p className="text-[10px] text-muted-foreground mt-1">Draw a box around the video</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Glasses className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Step 3</p>
              <p className="text-sm font-medium">Enter VR</p>
              <p className="text-[10px] text-muted-foreground mt-1">Capture screen &amp; view in VR</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">Proxy Loading:</span> Loads the page through a proxy. Some sites (Bilibili, YouTube) may block this — use Screen Capture instead.</p>
              <p><span className="font-medium text-foreground">Screen Capture:</span> Most reliable method — works with any website. Open the video first, then capture the screen.</p>
              <p><span className="font-medium text-foreground">VR Mode:</span> Requires Chrome/Edge with WebXR support and a VR headset connected via SteamVR.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
