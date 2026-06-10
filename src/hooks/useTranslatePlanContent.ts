// Hook for translating plan content dynamically using Google Translate
import { useCallback, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { translateWithGoogle, batchTranslate } from '@/lib/google-translate';

/**
 * Hook to translate text based on current locale
 * Handles caching automatically
 */
export function useTranslatePlanContent() {
  const locale = useLocale();
  const [translatingItems, setTranslatingItems] = useState<Set<string>>(new Set());

  /**
   * Translate a single text item
   */
  const translate = useCallback(
    async (text: string | undefined): Promise<string | undefined> => {
      if (!text) return text;

      // Don't translate if already in English
      if (locale === 'en') return text;

      // Add to translating set to avoid duplicate requests
      if (translatingItems.has(text)) {
        // Still translating, return original
        return text;
      }

      setTranslatingItems((prev) => new Set([...prev, text]));

      try {
        const translated = await translateWithGoogle(text, locale);
        setTranslatingItems((prev) => {
          const next = new Set(prev);
          next.delete(text);
          return next;
        });
        return translated;
      } catch (error) {
        console.error('Translation hook error:', error);
        return text;
      }
    },
    [locale, translatingItems]
  );

  /**
   * Translate multiple items at once
   */
  const translateMultiple = useCallback(
    async (texts: (string | undefined)[]): Promise<(string | undefined)[]> => {
      if (locale === 'en') return texts;

      const validTexts = texts.filter((t) => t && typeof t === 'string') as string[];
      if (!validTexts.length) return texts;

      try {
        const translated = await batchTranslate(validTexts, locale);
        const translationMap = new Map(validTexts.map((t, i) => [t, translated[i]]));

        return texts.map((t) => (t ? translationMap.get(t) || t : t));
      } catch (error) {
        console.error('Batch translation error:', error);
        return texts;
      }
    },
    [locale]
  );

  return { translate, translateMultiple, locale };
}
