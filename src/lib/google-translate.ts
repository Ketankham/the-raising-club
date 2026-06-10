// Client-side Google Translate integration with caching
// Uses Google Translate API to dynamically translate content
// Results are cached in localStorage for performance

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY;
const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';
const CACHE_PREFIX = 'gtranslate_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  translation: string;
  timestamp: number;
}

/**
 * Translate text using Google Translate API with caching
 * @param text - Text to translate
 * @param targetLanguage - Target language code (e.g., 'es' for Spanish)
 * @returns Translated text, or original if translation fails
 */
export async function translateWithGoogle(
  text: string,
  targetLanguage: string = 'es'
): Promise<string> {
  // Return original if not translating to Spanish or text is empty
  if (targetLanguage !== 'es' || !text || text.length === 0) {
    return text;
  }

  // Check cache first
  const cached = getCachedTranslation(text, targetLanguage);
  if (cached) {
    return cached;
  }

  try {
    // Call Google Translate API
    const response = await fetch(GOOGLE_TRANSLATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        key: GOOGLE_API_KEY,
      }),
    });

    if (!response.ok) {
      console.warn('Google Translate API error:', response.statusText);
      return text;
    }

    const data = await response.json();
    const translation = data.data?.translations?.[0]?.translatedText;

    if (translation) {
      // Cache the result
      cacheTranslation(text, translation, targetLanguage);
      return translation;
    }

    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

/**
 * Batch translate multiple texts
 * Useful for translating multiple plan features at once
 */
export async function batchTranslate(
  texts: string[],
  targetLanguage: string = 'es'
): Promise<string[]> {
  if (!texts.length) return texts;

  // Return original if not translating to Spanish
  if (targetLanguage !== 'es') {
    return texts;
  }

  // Check if API key is available
  if (!GOOGLE_API_KEY) {
    console.warn('[Google Translate] No API key configured');
    return texts;
  }

  try {
    console.log(`[Google Translate] Translating ${texts.length} items to ${targetLanguage}`);

    const response = await fetch(GOOGLE_TRANSLATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: texts,
        target: targetLanguage,
        key: GOOGLE_API_KEY,
      }),
    });

    if (!response.ok) {
      console.error(`[Google Translate] API error: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error('[Google Translate] Error response:', errorBody);
      return texts;
    }

    const data = await response.json();

    if (data.error) {
      console.error('[Google Translate] API error response:', data.error);
      return texts;
    }

    const translations = data.data?.translations?.map(
      (t: { translatedText: string }) => t.translatedText
    );

    if (translations && translations.length === texts.length) {
      // Cache each translation
      texts.forEach((text, i) => {
        if (translations[i]) {
          cacheTranslation(text, translations[i], targetLanguage);
        }
      });
      console.log(`[Google Translate] Successfully translated ${translations.length} items`);
      return translations;
    }

    console.warn('[Google Translate] Translation count mismatch');
    return texts;
  } catch (error) {
    console.error('[Google Translate] Batch translation error:', error);
    return texts;
  }
}

/**
 * Get cached translation from localStorage
 */
function getCachedTranslation(text: string, targetLanguage: string): string | null {
  if (typeof window === 'undefined') return null;

  const key = `${CACHE_PREFIX}${targetLanguage}_${hashString(text)}`;
  const cached = localStorage.getItem(key);

  if (!cached) return null;

  try {
    const entry: CacheEntry = JSON.parse(cached);

    // Check if cache is still valid
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.translation;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
}

/**
 * Cache translation in localStorage
 */
function cacheTranslation(text: string, translation: string, targetLanguage: string): void {
  if (typeof window === 'undefined') return;

  try {
    const key = `${CACHE_PREFIX}${targetLanguage}_${hashString(text)}`;
    const entry: CacheEntry = {
      translation,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    // localStorage might be full or disabled
    console.warn('Cache storage error:', error);
  }
}

/**
 * Simple hash function for cache keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Clear all translations cache
 */
export function clearTranslationCache(): void {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(localStorage).filter((key) =>
    key.startsWith(CACHE_PREFIX)
  );

  keys.forEach((key) => localStorage.removeItem(key));
}
