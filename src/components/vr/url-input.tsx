'use client';

import { useState, useCallback } from 'react';
import { useVRStore } from '@/store/vr-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Link, Play, TestTube, Glasses, MonitorPlay, Info, Monitor } from 'lucide-react';

export function URLInput() {
  const { pageUrl, setPageUrl, setIsPageLoading, setMode, setVideoSource } = useVRStore();
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

    setVideoSource({ src: url, width: 0, height: 0, isDirectUrl: true });
    setMode('vr');
  }, [inputValue, setVideoSource, setMode]);

  const handleTestPattern = useCallback(() => {
    setVideoSource({ src: 'test-pattern', width: 3840, height: 1920, isDirectUrl: true });
    setMode('vr');
  }, [setVideoSource, setMode]);

  const handleDirectCapture = useCallback(() => {
    setVideoSource(null);
    setMode('vr');
  }, [setVideoSource, setMode]);

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
          Convert web-based VR180/360 side-by-side videos into WebXR format for SteamVR viewing.
          Load a webpage, select the video area, then capture it for VR.
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
            <div className="flex gap-3">
              <Button type="submit" className="flex-1 h-11">
                <Globe className="w-4 h-4 mr-2" />
                Load Webpage
              </Button>
              <Button type="button" variant="outline" className="flex-1 h-11" onClick={handleDirectVideo}>
                <Play className="w-4 h-4 mr-2" />
                Direct Video URL
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Screen Capture - Primary Method */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            Screen Capture Mode (Recommended)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-3">
            The most reliable way to view VR videos from any website. Open the video in your
            browser, then capture the screen directly — no proxy issues, works with any site.
          </p>
          <Button className="w-full h-10" onClick={handleDirectCapture}>
            <Monitor className="w-4 h-4 mr-2" />
            Go to VR Player &amp; Capture Screen
          </Button>
        </CardContent>
      </Card>

      {/* Test Pattern */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-3">
            Load a stereo test pattern to preview the VR player and experiment with different
            projection settings.
          </p>
          <Button variant="outline" className="w-full h-10" onClick={handleTestPattern}>
            <TestTube className="w-4 h-4 mr-2" />
            Load Test Pattern &amp; Enter VR Mode
          </Button>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Step 1</p>
          <p className="text-sm font-medium">Open Page</p>
          <p className="text-xs text-muted-foreground mt-1">Load webpage or open video</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <MonitorPlay className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Step 2</p>
          <p className="text-sm font-medium">Select Area</p>
          <p className="text-xs text-muted-foreground mt-1">Select region or capture screen</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Glasses className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Step 3</p>
          <p className="text-sm font-medium">Enter VR</p>
          <p className="text-xs text-muted-foreground mt-1">Configure &amp; start VR session</p>
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">Screen Capture:</span> Most reliable method — works with any website including Bilibili, YouTube, etc.</p>
              <p><span className="font-medium text-foreground">Webpage Proxy:</span> Loads the page through a proxy. Some sites may block this.</p>
              <p><span className="font-medium text-foreground">Direct URL:</span> For direct video file links (e.g. .mp4). May not work for streaming sites.</p>
              <p><span className="font-medium text-foreground">VR Mode:</span> Requires Chrome/Edge with WebXR and a VR headset via SteamVR.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
