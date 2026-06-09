# 🌍 Translation Completion Plan - All Static Pages

## Current Status

✅ **Completed:**
- Landing page: Hero, JoinCards, HowItWorks, FinalCta (4/6 sections)
- Google Translate integration fully operational
- 100+ base translation keys created in messages/ files
- Language switcher UI working on all pages

❌ **Incomplete:**
- Landing page: Features, Audiences, Mission (3/6 sections)
- About Us page (all components)
- Marketplace, Courses, Events pages (all)
- Terms, Privacy pages (legal content)
- Dashboard pages (partially)

---

## Phased Completion Strategy

### Phase 1: Complete Landing Page (PRIORITY)
**Impact:** Public-facing, highest visibility

#### 1.1 Features Component
- **Status:** ❌ Hardcoded
- **Complexity:** 6 feature cards with title + body
- **Action:**
  ```tsx
  "use client";
  import { useTranslations } from 'next-intl';
  
  export function Features() {
    const t = useTranslations('landing.features');
    // Replace each FEATURES[i].title and .body with t() calls
  }
  ```
- **Translation keys needed:** Already in messages/es.json ✓
- **Estimated time:** 15 minutes

#### 1.2 Audiences Component
- **Status:** ❌ Hardcoded
- **Complexity:** 3 cards × 4 detailed points each = 12 text blocks
- **Challenge:** Detailed content (not just title/description)
- **Action Option A (Quick):** Translate just titles + short taglines
  ```tsx
  title: t("forParents"), tagline: t("parentDesc")
  // 6 translation keys needed (3 × 2)
  ```
- **Action Option B (Complete):** Translate all detail points
  - Requires adding 12 new translation keys per card type
  - Then wire each point in the render loop
- **Recommendation:** Start with Option A (quick wins), expand later
- **Estimated time:** 30 minutes (A) / 2 hours (B)

#### 1.3 Mission Component
- **Status:** ❌ Hardcoded
- **Complexity:** 4 pillar cards + quote banner
- **Content to translate:**
  - Quote: "When families rise, society rises"
  - 4 pillar titles + 4 pillar descriptions
  - "Why The Raising Club" heading + intro text
- **Translation keys needed:** Partially available, need to add pillar details
- **Action:**
  ```tsx
  const t = useTranslations('landing.mission');
  // Wire: t('quote'), t('pillar1Title'), t('pillar1Body'), etc.
  ```
- **Estimated time:** 45 minutes

**Landing page completion estimate:** 1.5-2 hours total

---

### Phase 2: About Us Page
- **Status:** ❌ Not started
- **Components affected:**
  - AboutHero (title + description)
  - Founder (founder name + bio)
  - Values (value cards)
  - AboutCta
- **Complexity:** Moderate (mostly titles + short descriptions)
- **Translation keys:** NOT created yet - use Google Translate API
  ```bash
  # Add aboutUs translation keys to messages/en.json
  # Then run:
  GOOGLE_TRANSLATE_API_KEY=<key> node scripts/google-translate.mjs
  ```
- **Estimated time:** 1.5 hours (keys + wiring)

---

### Phase 3: Marketplace, Courses, Events Pages
- **Status:** ❌ Not started
- **Complexity:** Low to moderate (listing pages)
- **Content:** Page titles, empty states, filter/sort labels, CTAs
- **Estimated time:** 1 hour each = 3 hours total

---

### Phase 4: Legal Pages (Terms & Privacy)
- **Status:** ❌ Not started  
- **Complexity:** HIGH (100+ sections of legal content)
- **Approach:** Use Google Translate API only (don't translate manually)
  1. Extract legal content into messages/en.json structure
  2. Run Google Translate API
  3. Wire component to use translations
- **Note:** Legal documents may need human review after MT
- **Estimated time:** 2 hours

---

### Phase 5: Dashboard & Authenticated Pages
- **Status:** ⚠️ Partially started
- **Complexity:** Medium (many page variants)
- **Already translated:** Sidebar labels, common UI elements
- **Still needed:** Page-specific content, form labels, messages
- **Estimated time:** 3+ hours

---

## Implementation Workflow

### For Each Component:

**Step 1: Identify text to translate**
```bash
# Read component and list all hardcoded English strings
grep -n "title\|label\|body\|description\|heading" src/components/landing/features.tsx
```

**Step 2: Add translation keys to messages/en.json**
```json
{
  "landing": {
    "features": {
      "feature1Title": "Smart Matching",
      "feature1Body": "We match families..."
    }
  }
}
```

**Step 3: Generate Spanish translations**
```bash
GOOGLE_TRANSLATE_API_KEY=<key> node scripts/google-translate.mjs
```

**Step 4: Wire component**
```tsx
"use client";
import { useTranslations } from 'next-intl';

export function Features() {
  const t = useTranslations('landing.features');
  return <h3>{t('feature1Title')}</h3>;
}
```

**Step 5: Build & test**
```bash
npm run build
# Test locally or on production with language switcher
```

---

## Quick Wins (Do These First)

These are the simplest components to wire (under 30 min each):

1. ✅ Hero — **DONE**
2. ✅ JoinCards — **DONE**
3. ✅ HowItWorks — **DONE**
4. ✅ FinalCta — **DONE**
5. ⏭️ **Audiences** (titles + taglines only)
6. ⏭️ **Mission** (quote + main sections)
7. ⏭️ **AboutHero** (title + description)

**Estimate for all quick wins:** 2-3 hours

---

## Recommended Next Steps (Priority Order)

### TODAY/TOMORROW:
1. **Wire remaining 3 landing components** (Features, Audiences, Mission)
   - Handles highest-traffic public pages
   - Allows Playwright test to pass
   - ~1.5-2 hours of work
2. **Push to production** and verify with Playwright test

### WEEK 2:
3. Wire About Us page
4. Add translation keys for Marketplace, Courses, Events
5. Wire those pages

### WEEK 3+:
6. Legal pages (Terms, Privacy) - lower priority
7. Dashboard pages - lower priority

---

## Automation Opportunity

For pages with many similar cards (Features, Audiences, Mission):

Create a `TranslatedCard` wrapper component:
```tsx
interface TranslatedCardProps {
  titleKey: string;
  bodyKey: string;
  namespace: string;
}

export function TranslatedCard({ titleKey, bodyKey, namespace }: TranslatedCardProps) {
  const t = useTranslations(namespace);
  return (
    <div>
      <h3>{t(titleKey)}</h3>
      <p>{t(bodyKey)}</p>
    </div>
  );
}

// Usage:
<TranslatedCard titleKey="feature1Title" bodyKey="feature1Body" namespace="landing.features" />
```

This reduces boilerplate and makes translation wiring faster.

---

## Testing Checklist

After wiring each component:

- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] Visit `/` in English - text shows English
- [ ] Click ES button - text shows Spanish
- [ ] Visit `/es/` directly - text shows Spanish
- [ ] Click EN button from Spanish page - text switches back to English
- [ ] Language switcher visible in header
- [ ] No console errors

---

## Files to Update (Checklist)

### Landing Page:
- [ ] `src/components/landing/features.tsx`
- [ ] `src/components/landing/audiences.tsx`
- [ ] `src/components/landing/mission.tsx`

### About Us:
- [ ] `src/components/about/about-hero.tsx`
- [ ] `src/components/about/founder.tsx`
- [ ] `src/components/about/values.tsx`
- [ ] `src/components/about/about-cta.tsx`

### Other Pages:
- [ ] `src/app/[locale]/marketplace/page.tsx` + components
- [ ] `src/app/[locale]/courses/page.tsx` + components
- [ ] `src/app/[locale]/events/page.tsx` + components
- [ ] `src/app/[locale]/terms/page.tsx`
- [ ] `src/app/[locale]/privacy/page.tsx`

### Message Files:
- [ ] `messages/en.json` - add missing keys
- [ ] `messages/es.json` - run Google Translate API

---

## Key Learnings Applied

From `learnings.md #8`:
- Always complete component refactoring fully before committing
- Run `npm run build` locally before pushing
- Verify translations render properly before deployment

---

## Notes

- Translation keys in `messages/` files **must have matching keys** in both `en.json` and `es.json`
- Google Translate API is idempotent - running it multiple times is safe (cached)
- Always test language switching on deployed site (not just local dev)
- Spanish translation quality is ~90% (may need manual review for legal/marketing copy)

---

## Questions?

Refer to:
- `TRANSLATION_GUIDE.md` - Complete i18n architecture guide
- `GOOGLE_TRANSLATE_SETUP.md` - API integration details
- `scripts/google-translate.mjs` - Automation script
