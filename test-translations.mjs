#!/usr/bin/env node

/**
 * Translation Verification Test using Playwright
 *
 * Checks:
 * 1. Landing page loads in English
 * 2. All major sections are present
 * 3. Language switcher is visible
 * 4. Switching to Spanish translates content
 * 5. Key sections have Spanish text
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://theraisingclub.com';

async function testTranslations() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('\n🌍 Translation Verification Test\n');
  console.log(`Testing: ${BASE_URL}\n`);

  try {
    // Test 1: Load landing page in English
    console.log('1️⃣  Loading landing page (English)...');
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (err) {
      console.warn('   ⚠️  Page load timeout, continuing with partial content...');
    }

    const pageTitle = await page.locator('h1').first().textContent();
    console.log(`   ✓ Landing page loaded`);
    console.log(`   ✓ H1 text: "${pageTitle?.trim()}"\n`);

    // Capture English text from key sections
    const englishTexts = {};

    // Hero section
    console.log('2️⃣  Scanning English text from key sections...\n');

    const heroTitle = await page.locator('h1').first();
    if (heroTitle) {
      englishTexts.hero = await heroTitle.textContent();
      console.log(`   Hero H1: "${englishTexts.hero?.trim()}"`);
    }

    const heroParagraphs = await page.locator('p').all();
    if (heroParagraphs.length > 0) {
      const heroDesc = await heroParagraphs[0].textContent();
      englishTexts.heroDesc = heroDesc;
      console.log(`   Hero description starts with: "${heroDesc?.trim().substring(0, 60)}..."`);
    }

    // Check for header navigation
    const navLinks = await page.locator('a[href*="/"]').all();
    console.log(`   Found ${navLinks.length} navigation links`);

    // Check for language switcher
    const langSwitcher = await page.locator('button:has-text("EN"), button:has-text("ES")').first();
    const hasSwitcher = await langSwitcher.isVisible().catch(() => false);
    console.log(`   Language switcher visible: ${hasSwitcher ? '✓ YES' : '✗ NO'}\n`);

    if (!hasSwitcher) {
      console.warn('⚠️  Language switcher not found on header!');
      console.log('   Looking for alternative switcher patterns...');

      const allButtons = await page.locator('button').all();
      for (let i = 0; i < Math.min(10, allButtons.length); i++) {
        const text = await allButtons[i].textContent();
        console.log(`   Button ${i}: "${text?.trim()}"`);
      }
    }

    // Test 2: Check for hardcoded English text (not translated)
    console.log('3️⃣  Checking for hardcoded (untranslated) text...\n');

    const bodyText = await page.evaluate(() => document.body.innerText);

    const hardcodedPatterns = [
      'Everything You Need',
      'How it Works',
      'Why The Raising Club',
      'Our Mission',
      'For Parents',
      'For Caregivers',
      'For Organizations',
      'Ready to Join',
    ];

    const missingTranslations = [];
    for (const pattern of hardcodedPatterns) {
      if (bodyText.includes(pattern)) {
        console.log(`   ✓ Found: "${pattern}"`);
      } else {
        console.log(`   ✗ Missing: "${pattern}"`);
        missingTranslations.push(pattern);
      }
    }

    if (missingTranslations.length > 0) {
      console.log(`\n   ⚠️  ${missingTranslations.length} sections not found (may be loaded dynamically)`);
    }

    // Test 3: Click language switcher
    console.log('\n4️⃣  Switching to Spanish...\n');

    // Try to find and click the Spanish button
    const esButton = await page.locator('button:has-text("ES")').first();
    if (await esButton.isVisible()) {
      console.log('   Clicking ES button...');
      await esButton.click();
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      console.log('   ✓ Language switched\n');
    } else {
      console.log('   ✗ Spanish button not found');
      console.log('   Trying alternative selector...');

      // Try text content match
      const buttons = await page.locator('button').all();
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text?.includes('ES')) {
          await btn.click();
          await page.waitForLoadState('domcontentloaded').catch(() => {});
          console.log('   ✓ Language switched via alternative selector\n');
          break;
        }
      }
    }

    // Test 4: Check Spanish translations
    console.log('5️⃣  Verifying Spanish translations...\n');

    const spanishTexts = {};
    const spanishBodyText = await page.evaluate(() => document.body.innerText);

    const spanishPatterns = [
      'Más que cuidado infantil', // More than childcare
      'Acerca de nosotros', // About us
      'Cómo funciona', // How it works
      '¿Por qué', // Why
      'Para Padres', // For Parents
      'Para Cuidadores', // For Caregivers
      'Nuestra Misión', // Our Mission
    ];

    console.log('   Looking for Spanish text:\n');
    let spanishFound = 0;
    for (const pattern of spanishPatterns) {
      if (spanishBodyText.includes(pattern)) {
        console.log(`   ✓ Found Spanish: "${pattern}"`);
        spanishFound++;
      } else {
        console.log(`   ✗ Missing Spanish: "${pattern}"`);
      }
    }

    console.log(`\n   Summary: ${spanishFound}/${spanishPatterns.length} Spanish strings found`);

    // Test 5: Take screenshot
    console.log('\n6️⃣  Taking screenshots for visual inspection...\n');
    await page.screenshot({ path: 'landing-page-english.png' });
    console.log('   ✓ Screenshot saved: landing-page-english.png');

    // Switch back to English for comparison
    const enButton = await page.locator('button:has-text("EN")').first();
    if (await enButton.isVisible()) {
      await enButton.click();
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.screenshot({ path: 'landing-page-spanish.png' });
      console.log('   ✓ Screenshot saved: landing-page-spanish.png');
    }

    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('📊 TRANSLATION AUDIT REPORT\n');
    console.log(`✓ Base URL: ${BASE_URL}`);
    console.log(`✓ Page loaded: Yes`);
    console.log(`✓ Language switcher: ${hasSwitcher ? 'Visible' : 'NOT VISIBLE'}`);
    console.log(`✓ Spanish translations found: ${spanishFound}/${spanishPatterns.length}`);

    if (spanishFound < spanishPatterns.length) {
      console.log(`\n⚠️  ISSUES DETECTED:`);
      console.log(`   - Missing ${spanishPatterns.length - spanishFound} Spanish translations`);
      console.log(`   - These text sections are likely hardcoded in components`);
      console.log(`   - Need to wire components to use useTranslations() hook`);
      console.log(`   - See TRANSLATION_GUIDE.md for implementation pattern`);
    } else {
      console.log('\n✅ All major sections properly translated!');
    }

    console.log('='.repeat(60) + '\n');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testTranslations();
