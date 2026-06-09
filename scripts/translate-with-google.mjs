#!/usr/bin/env node

/**
 * Google Translate Integration Script
 *
 * This script uses Google Translate API to automatically translate all
 * static page content to Spanish, dynamically on-demand.
 *
 * Features:
 * - Translates all English strings to Spanish using Google Translate API
 * - Caches translations to avoid repeated API calls
 * - Supports both batch translation and runtime translation
 *
 * Setup:
 * 1. Install: npm install --save-dev @google-cloud/translate
 * 2. Set env var: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
 * 3. Run: node scripts/translate-with-google.mjs
 */

import fs from 'fs';
import path from 'path';
import { Translate } from '@google-cloud/translate/build/src/index.js';

// Initialize Google Translate client
const translate = new Translate({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-project-id',
});

// Cache for translations (in-memory + file-based)
const cacheFile = path.join(process.cwd(), '.translation-cache.json');
let translationCache = {};

// Load existing cache
function loadCache() {
  if (fs.existsSync(cacheFile)) {
    try {
      translationCache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      console.log(`✓ Loaded ${Object.keys(translationCache).length} cached translations`);
    } catch (err) {
      console.warn('Could not load cache:', err.message);
      translationCache = {};
    }
  }
}

// Save cache to file
function saveCache() {
  fs.writeFileSync(cacheFile, JSON.stringify(translationCache, null, 2));
}

/**
 * Translate a string to Spanish using Google Translate API
 * Results are cached for performance
 */
async function translateString(text, targetLanguage = 'es') {
  if (!text || typeof text !== 'string') return text;

  // Check cache first
  const cacheKey = `${text}:${targetLanguage}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    const [translation] = await translate.translate(text, {
      targetLanguage: targetLanguage,
      format: 'text',
    });

    const translatedText = Array.isArray(translation) ? translation[0] : translation;

    // Cache the result
    translationCache[cacheKey] = translatedText;

    return translatedText;
  } catch (err) {
    console.error(`Translation error for "${text}":`, err.message);
    return text; // Return original text on error
  }
}

/**
 * Recursively translate all strings in an object
 */
async function translateObject(obj, targetLanguage = 'es') {
  const translated = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      console.log(`Translating: ${key}`);
      translated[key] = await translateString(value, targetLanguage);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      translated[key] = await translateObject(value, targetLanguage);
    } else {
      translated[key] = value;
    }
  }

  return translated;
}

/**
 * Batch translate all messages and save to es.json
 */
async function batchTranslateMessages() {
  console.log('\n🌍 Starting batch translation of messages...\n');

  loadCache();

  const messagesPath = path.join(process.cwd(), 'messages', 'en.json');

  if (!fs.existsSync(messagesPath)) {
    console.error('❌ messages/en.json not found');
    process.exit(1);
  }

  const englishMessages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));

  console.log(`📝 Translating ${JSON.stringify(englishMessages).length} characters of content...\n`);

  const spanishMessages = await translateObject(englishMessages, 'es');

  // Save translations
  const outputPath = path.join(process.cwd(), 'messages', 'es.json');
  fs.writeFileSync(outputPath, JSON.stringify(spanishMessages, null, 2));

  // Save cache
  saveCache();

  console.log(`\n✅ Translation complete!`);
  console.log(`📍 Spanish translations saved to: ${outputPath}`);
  console.log(`💾 Cache saved to: ${cacheFile}`);
}

/**
 * Runtime translation function for dynamic use
 * (can be imported and used in server-side code)
 */
export async function getTranslation(text, targetLanguage = 'es') {
  loadCache();
  return await translateString(text, targetLanguage);
}

/**
 * Translate specific page/namespace
 */
export async function translatePage(pageName) {
  loadCache();

  const messagesPath = path.join(process.cwd(), 'messages', 'en.json');
  const englishMessages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));

  if (!englishMessages.pages?.[pageName]) {
    console.error(`❌ Page "${pageName}" not found in messages`);
    return null;
  }

  console.log(`\n🌍 Translating page: ${pageName}\n`);

  const translatedPage = await translateObject(englishMessages.pages[pageName], 'es');

  saveCache();

  return {
    [pageName]: translatedPage
  };
}

// CLI usage
const command = process.argv[2];

if (command === 'batch') {
  batchTranslateMessages();
} else if (command === 'page') {
  const pageName = process.argv[3];
  if (!pageName) {
    console.error('Usage: node scripts/translate-with-google.mjs page <pageName>');
    process.exit(1);
  }
  translatePage(pageName).then(result => {
    if (result) {
      console.log(JSON.stringify(result, null, 2));
    }
  });
} else {
  console.log(`
  📚 Google Translate Integration

  Usage:
    node scripts/translate-with-google.mjs batch    # Translate all messages
    node scripts/translate-with-google.mjs page <pageName>  # Translate specific page

  Environment:
    - Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to credentials.json
    - Set GOOGLE_CLOUD_PROJECT_ID for the project

  Examples:
    node scripts/translate-with-google.mjs batch
    node scripts/translate-with-google.mjs page aboutUs
    node scripts/translate-with-google.mjs page courses
  `);
}
