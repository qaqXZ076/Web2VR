'use client';

import { useVRStore } from '@/store/vr-store';
import { URLInput } from '@/components/vr/url-input';
import { PageViewer } from '@/components/vr/page-viewer';
import { VRSettings } from '@/components/vr/vr-settings';
import { VRPlayer } from '@/components/vr/vr-player';
import { Badge } from '@/components/ui/badge';
import { Globe, Eye, Glasses } from 'lucide-react';

export default function Home() {
  const { mode } = useVRStore();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Glasses className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight">
                WebXR VR Player
              </h1>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <Badge
              variant={mode === 'input' ? 'default' : 'outline'}
              className="text-xs"
            >
              <Globe className="w-3 h-3 mr-1" />1. URL
            </Badge>
            <div className="w-4 h-px bg-border" />
            <Badge
              variant={mode === 'preview' ? 'default' : 'outline'}
              className="text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />2. Select
            </Badge>
            <div className="w-4 h-px bg-border" />
            <Badge
              variant={mode === 'vr' ? 'default' : 'outline'}
              className="text-xs"
            >
              <Glasses className="w-3 h-3 mr-1" />3. VR
            </Badge>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-7xl mx-auto w-full px-4 py-6">
        {mode === 'input' && (
          <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <URLInput />
          </div>
        )}

        {mode === 'preview' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <PageViewer />
            <VRSettings />
          </div>
        )}

        {mode === 'vr' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <VRPlayer />
            <VRSettings />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>WebXR VR Video Player — Convert web VR videos for SteamVR</p>
            <p>Requires WebXR-compatible browser &amp; VR headset</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
