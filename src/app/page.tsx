'use client';

import { useEffect } from 'react';
import { useVRStore } from '@/store/vr-store';
import { useLanguageStore } from '@/store/language-store';
import { useTranslation, AVAILABLE_LOCALES } from '@/lib/i18n/useTranslation';
import { LandingPage } from '@/components/vr/landing-page';
import { VRSettings } from '@/components/vr/vr-settings';
import { VRPlayer } from '@/components/vr/vr-player';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Monitor, Glasses, Languages } from 'lucide-react';

export default function Home() {
  const { mode } = useVRStore();
  const { t, locale } = useTranslation();
  const { setLocale } = useLanguageStore();

  // Sync <html lang> attribute with current locale
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

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
                {t('app.title')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Step indicator - only shows in player mode */}
            {mode === 'player' && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Monitor className="w-3 h-3 mr-1" /> {t('header.capture')}
                </Badge>
                <div className="w-4 h-px bg-border" />
                <Badge variant="outline" className="text-xs">
                  <Glasses className="w-3 h-3 mr-1" /> {t('header.vr')}
                </Badge>
              </div>
            )}

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5">
                  <Languages className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">
                    {AVAILABLE_LOCALES.find((l) => l.value === locale)?.label}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {AVAILABLE_LOCALES.map((l) => (
                  <DropdownMenuItem
                    key={l.value}
                    onClick={() => setLocale(l.value)}
                    className={locale === l.value ? 'bg-accent' : ''}
                  >
                    <span className="mr-2">{l.flag}</span>
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-7xl mx-auto w-full px-4 py-6">
        {mode === 'landing' && (
          <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <LandingPage />
          </div>
        )}

        {mode === 'player' && (
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
            <p>{t('footer.left')}</p>
            <p>{t('footer.right')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
