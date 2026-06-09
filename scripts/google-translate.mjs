#!/usr/bin/env node

/**
 * Google Translate API Integration
 *
 * Dynamically translates all English content to Spanish using Google's Translation API
 *
 * Usage:
 *   GOOGLE_TRANSLATE_API_KEY=<key> node scripts/google-translate.mjs
 *
 * Features:
 * - Translates messages/en.json to Spanish
 * - Caches results to avoid re-translating
 * - Supports both batch and individual string translation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

if (!API_KEY) {
  console.error('❌ Error: GOOGLE_TRANSLATE_API_KEY environment variable not set');
  console.error('\nUsage:');
  console.error('  export GOOGLE_TRANSLATE_API_KEY="AIzaSy..."');
  console.error('  node scripts/google-translate.mjs');
  process.exit(1);
}

const cacheFile = path.join(process.cwd(), '.translation-cache.json');
let cache = {};

function loadCache() {
  if (fs.existsSync(cacheFile)) {
    try {
      cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      console.log(`✓ Loaded ${Object.keys(cache).length} cached translations`);
    } catch (err) {
      console.warn('⚠ Could not load cache:', err.message);
    }
  }
}

function saveCache() {
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
  console.log(`💾 Saved cache to ${cacheFile}`);
}

/**
 * Translate text using Google Translate API
 */
async function translateText(text, targetLanguage = 'es') {
  if (!text || typeof text !== 'string' || text.length === 0) {
    return text;
  }

  const cacheKey = `${text}|${targetLanguage}`;
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          target: targetLanguage,
          source: 'en',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error(`Translation error for "${text}":`, error);
      return text; // Fallback to original
    }

    const data = await response.json();
    const translated = data.data.translations[0].translatedText;

    // HTML entity decoding
    const decoded = translated
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');

    cache[cacheKey] = decoded;
    return decoded;
  } catch (err) {
    console.error(`Translation error: ${err.message}`);
    return text;
  }
}

/**
 * Recursively translate object
 */
async function translateObject(obj, targetLanguage = 'es') {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      process.stdout.write(`  Translating: ${key}... `);
      result[key] = await translateText(value, targetLanguage);
      console.log('✓');
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      console.log(`📁 ${key}/`);
      result[key] = await translateObject(value, targetLanguage);
    } else {
      result[key] = value;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return result;
}

/**
 * Main function
 */
async function main() {
  console.log('\n🌍 Google Translate Integration\n');
  loadCache();

  const enPath = path.join(process.cwd(), 'messages', 'en.json');
  if (!fs.existsSync(enPath)) {
    console.error(`❌ messages/en.json not found at ${enPath}`);
    process.exit(1);
  }

  console.log('📖 Reading messages/en.json...');
  const enMessages = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

  console.log('\n🔄 Translating to Spanish...\n');
  const esMessages = await translateObject(enMessages, 'es');

  console.log('\n✅ Translation complete!\n');

  const esPath = path.join(process.cwd(), 'messages', 'es.json');
  console.log(`📝 Writing to ${esPath}...`);
  fs.writeFileSync(esPath, JSON.stringify(esMessages, null, 2));

  saveCache();

  console.log(`\n✨ Done! Spanish translations saved to messages/es.json\n`);
  console.log('Next steps:');
  console.log('  1. Review messages/es.json for translation quality');
  console.log('  2. Make manual adjustments if needed');
  console.log('  3. Commit both en.json and es.json to git');
  console.log('  4. Push to production\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
