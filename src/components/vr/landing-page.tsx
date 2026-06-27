'use client';

import { useCallback } from 'react';
import { useVRStore } from '@/store/vr-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Glasses, Monitor, TestTube, ArrowRight } from 'lucide-react';
import { useTranslation, useRenderTranslation } from '@/lib/i18n/useTranslation';

export function LandingPage() {
  const { setMode } = useVRStore();
  const { t } = useTranslation();
  const { rt } = useRenderTranslation();

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

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Glasses className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{t('landing.title')}</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          {t('landing.subtitle')}
        </p>
      </div>

      {/* How It Works */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{t('landing.howItWorks')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-background border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Monitor className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-bold mb-1">{t('landing.step1Title')}</p>
              <p className="text-xs text-muted-foreground">
                {t('landing.step1Desc')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Glasses className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-bold mb-1">{t('landing.step2Title')}</p>
              <p className="text-xs text-muted-foreground">
                {t('landing.step2Desc')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-bold mb-1">{t('landing.step3Title')}</p>
              <p className="text-xs text-muted-foreground">
                {t('landing.step3Desc')}
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
              {t('landing.capture.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-3">
              {t('landing.capture.desc')}
            </p>
            <Button className="w-full h-10" onClick={handleStartCapture}>
              <Monitor className="w-4 h-4 mr-2" />
              {t('landing.capture.btn')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              {t('landing.testPattern.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-3">
              {t('landing.testPattern.desc')}
            </p>
            <Button variant="outline" className="w-full h-10" onClick={handleStartDemo}>
              <TestTube className="w-4 h-4 mr-2" />
              {t('landing.testPattern.btn')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t('landing.quickStart.title')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary min-w-[16px]">1.</span>
              <span>{t('landing.quickStart.step1')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary min-w-[16px]">2.</span>
              <span>{rt('landing.quickStart.step2')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary min-w-[16px]">3.</span>
              <span>{t('landing.quickStart.step3')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary min-w-[16px]">4.</span>
              <span>{rt('landing.quickStart.step4')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary min-w-[16px]">5.</span>
              <span>{rt('landing.quickStart.step5')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
