'use client';

import { useCallback } from 'react';
import { useVRStore } from '@/store/vr-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Glasses, Monitor, TestTube, ArrowRight, Info } from 'lucide-react';

export function LandingPage() {
  const { setMode } = useVRStore();

  const handleStartCapture = useCallback(() => {
    setMode('player');
    // Signal to VR player that we want to start screen capture immediately
    (window as unknown as Record<string, unknown>).__vrAutoCapture = true;
  }, [setMode]);

  const handleStartDemo = useCallback(() => {
    setMode('player');
    // Signal to VR player that we want test pattern
    (window as unknown as Record<string, unknown>).__vrTestPattern = true;
  }, [setMode]);

  const handleJustPlay = useCallback(() => {
    setMode('player');
  }, [setMode]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Glasses className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">WebXR VR Video Player</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Watch VR180/360 side-by-side videos from any website in your VR headset via SteamVR
        </p>
      </div>

      {/* How It Works */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-background border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Monitor className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-bold mb-1">1. Open Video</p>
              <p className="text-xs text-muted-foreground">
                Open your VR video in another browser tab (Bilibili, YouTube, etc.)
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Glasses className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-bold mb-1">2. Capture &amp; Select</p>
              <p className="text-xs text-muted-foreground">
                Capture that tab, then draw a box around the video area
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-bold mb-1">3. View in VR</p>
              <p className="text-xs text-muted-foreground">
                The selected area is mapped to a VR sphere/cylinder for immersive viewing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" />
              Screen Capture
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-3">
              Open a VR video in another browser tab, then capture that tab.
              Works with any website — no proxy issues.
            </p>
            <Button className="w-full h-10" onClick={handleStartCapture}>
              <Monitor className="w-4 h-4 mr-2" />
              Start Screen Capture
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Test Pattern
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-3">
              Load a built-in stereo test pattern to preview the VR player
              and experiment with projection settings.
            </p>
            <Button variant="outline" className="w-full h-10" onClick={handleStartDemo}>
              <TestTube className="w-4 h-4 mr-2" />
              Load Test Pattern
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary min-w-[16px]">1.</span>
              <span>Open a VR video in your browser (e.g. bilibili.com VR180 video, play it fullscreen or in theater mode)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary min-w-[16px]">2.</span>
              <span>Come to this app and click <strong className="text-foreground">Start Screen Capture</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary min-w-[16px]">3.</span>
              <span>Select the browser tab with the video when prompted</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary min-w-[16px]">4.</span>
              <span>Use <strong className="text-foreground">Select Region</strong> to draw a box around the VR video area in the preview</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary min-w-[16px]">5.</span>
              <span>Choose the right <strong className="text-foreground">VR preset</strong> (VR180 SBS, VR360 TB, etc.) and click <strong className="text-foreground">Enter VR</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">VR Mode:</span> Requires Chrome/Edge with WebXR support, a VR headset, and SteamVR running on your PC</p>
              <p><span className="font-medium text-foreground">Screen Capture:</span> Uses your browser&apos;s built-in screen sharing — no server-side proxy, works with any website</p>
              <p><span className="font-medium text-foreground">No Proxy:</span> This app captures your screen directly — it never loads websites through a server, avoiding CORS/412 errors entirely</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
