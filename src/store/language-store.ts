import { create } from 'zustand';
import type { Locale } from '@/lib/i18n/translations';

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: 'zh',
  setLocale: (locale) => set({ locale }),
}));
