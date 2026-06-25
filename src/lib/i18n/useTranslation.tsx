'use client';

import { useCallback, useMemo, ReactNode } from 'react';
import { useLanguageStore } from '@/store/language-store';
import { translations, t as _t, type Locale } from './translations';

/**
 * Get a translated string by key with {param} interpolation.
 */
export function useTranslation() {
  const locale = useLanguageStore((s) => s.locale);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      return _t(key, params, locale);
    },
    [locale]
  );

  return { t, locale };
}

/**
 * Render a translated string that may contain inline markup tokens:
 *   {strong}text{/strong}  → <strong>text</strong>
 *   {kbd}text{/kbd}        → <kbd>text</kbd>
 *   {code}text{/code}      → <code>text</code>
 *   {br}                    → <br />
 *
 * Returns an array of ReactNode suitable for embedding in JSX.
 */
export function useRenderTranslation() {
  const locale = useLanguageStore((s) => s.locale);

  const rt = useCallback(
    (key: string, params?: Record<string, string>): ReactNode[] => {
      const text = _t(key, params, locale);
      return renderInlineMarkup(text);
    },
    [locale]
  );

  return { rt, locale };
}

/**
 * Parse inline markup tokens in a translated string and return ReactNode[].
 */
function renderInlineMarkup(text: string): ReactNode[] {
  // Pattern matches: {strong}...{/strong}, {kbd}...{/kbd}, {code}...{/code}, {br}
  const tokenRegex = /\{(strong|kbd|code)\}(.*?)\{\/\1\}|\{br\}/g;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[0] === '{br}') {
      nodes.push(<br key={`br-${keyIdx++}`} />);
    } else {
      const tag = match[1]; // strong, kbd, or code
      const content = match[2];
      switch (tag) {
        case 'strong':
          nodes.push(<strong key={`s-${keyIdx++}`}>{content}</strong>);
          break;
        case 'kbd':
          nodes.push(
            <kbd
              key={`k-${keyIdx++}`}
              className="px-1.5 py-0.5 text-[11px] font-mono bg-muted border border-border rounded"
            >
              {content}
            </kbd>
          );
          break;
        case 'code':
          nodes.push(
            <code
              key={`c-${keyIdx++}`}
              className="px-1 py-0.5 text-[11px] font-mono bg-muted border border-border rounded"
            >
              {content}
            </code>
          );
          break;
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last match
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/**
 * Get all available locales for the language switcher.
 */
export const AVAILABLE_LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
];
