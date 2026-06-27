'use client';

import { useVRStore } from '@/store/vr-store';
import {
  VR_PRESETS,
  PROJECTION_LABELS,
  LAYOUT_LABELS,
  FOV_OPTIONS,
  type StereoLayout,
  type ProjectionType,
} from '@/lib/vr/vr-presets';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings2, Tv, Eye, Move3D, Gauge } from 'lucide-react';

export function VRSettings() {
  const {
    layout,
    setLayout,
    projection,
    setProjection,
    fov,
    setFov,
    applyPreset,
  } = useVRStore();

  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Presets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tv className="w-4 h-4" />
            {t('settings.presets')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-2">
            {VR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-colors hover:bg-accent ${
                  layout === preset.layout &&
                  projection === preset.projection &&
                  fov === preset.fov
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="text-lg">{preset.icon}</span>
                  <span className="text-xs font-medium leading-tight">
                    {t(`preset.${preset.id}.name`)}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {t(`preset.${preset.id}.desc`)}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            {t('settings.manualSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-5">
          {/* Stereo Layout */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {t('settings.stereoLayout')}
            </Label>
            <Select
              value={layout}
              onValueChange={(v) => setLayout(v as StereoLayout)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(LAYOUT_LABELS).map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`layout.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Projection Type */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Move3D className="w-3.5 h-3.5" />
              {t('settings.projectionType')}
            </Label>
            <Select
              value={projection}
              onValueChange={(v) => setProjection(v as ProjectionType)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(PROJECTION_LABELS).map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`projection.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Field of View */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              {t('settings.fov')}
              <Badge variant="outline" className="ml-auto text-[10px]">
                {fov}°
              </Badge>
            </Label>
            <Slider
              value={[fov]}
              onValueChange={([v]) => setFov(v)}
              min={60}
              max={180}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between">
              {FOV_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFov(opt.value)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    fov === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">
              {t('settings.currentConfig')}
            </p>
            <p>
              {t('settings.layoutLabel')}{' '}
              <span className="text-foreground">{t(`layout.${layout}`)}</span>
            </p>
            <p>
              {t('settings.projectionLabel')}{' '}
              <span className="text-foreground">
                {t(`projection.${projection}`)}
              </span>
            </p>
            <p>
              {t('settings.fovLabel')} <span className="text-foreground">{fov}°</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
