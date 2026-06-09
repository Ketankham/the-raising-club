# 🌍 Full-Site Translation Guide (English ↔ Spanish)

## Overview
This guide explains how to systematically translate ALL 50+ pages and components to support English/Spanish language switching site-wide.

## Architecture
- **Translation keys**: Stored in `messages/en.json` and `messages/es.json`
- **Page structure**: All pages are under `src/app/[locale]/` for automatic locale routing
- **Component approach**: Pages use `useTranslations()` hook to access translated strings
- **Locale switching**: Available in SiteHeader (public) and AppSidebar (authenticated)

## Phase 1: Foundation (Core Infrastructure) ✅
- [x] Install next-intl
- [x] Configure routing (`src/i18n/routing.ts`)
- [x] Create middleware composition (`src/proxy.ts`)
- [x] Add sidebar switcher (authenticated pages)
- [x] Add header switcher (public pages)
- [x] Create base translation keys (sidebar, common, landing)

## Phase 2: Priority Pages (6 Pages)
Must translate for full site bilingual support:

### 1. **Landing Page** (Partially done - Hero, JoinCards, HowItWorks)
**Files to update:**
- `src/components/landing/features.tsx`
- `src/components/landing/audiences.tsx`
- `src/components/landing/mission.tsx`
- `src/components/landing/final-cta.tsx`

**Pattern:**
```tsx
"use client";
import { useTranslations } from 'next-intl';

export function Features() {
  const t = useTranslations('landing.features');
  return <h2>{t('title')}</h2>;
}
```

### 2. **About Us Page**
**Files to update:**
- `src/app/[locale]/about-us/page.tsx`
- `src/components/about/about-hero.tsx`
- `src/components/about/founder.tsx`
- `src/components/about/values.tsx`
- `src/components/about/about-cta.tsx`

### 3. **Marketplace Page**
**Files to update:**
- `src/app/[locale]/marketplace/page.tsx`
- All marketplace list components

### 4. **Courses Page**
**Files to update:**
- `src/app/[locale]/courses/page.tsx`
- `src/app/[locale]/courses/[slug]/page.tsx`
- Course components

### 5. **Events Page**
**Files to update:**
- `src/app/[locale]/events/page.tsx`
- `src/app/[locale]/events/[slug]/page.tsx`
- Event components

### 6. **Terms & Privacy Pages**
**Files to update:**
- `src/app/[locale]/terms/page.tsx`
- `src/app/[locale]/privacy/page.tsx`
- These are mostly static text

## How to Convert a Page to i18n

### Step 1: Add Translation Keys to messages/en.json and es.json
```json
{
  "pages": {
    "aboutUs": {
      "title": "About Us",
      "heroTitle": "...",
      "section1Title": "...",
      "section1Content": "..."
    }
  }
}
```

### Step 2: Add "use client" if page is Server Component
```tsx
"use client";
```

### Step 3: Import useTranslations Hook
```tsx
import { useTranslations } from 'next-intl';
```

### Step 4: Use Translations in Component
```tsx
export function AboutHero() {
  const t = useTranslations('pages.aboutUs');
  
  return (
    <h1>{t('heroTitle')}</h1>
  );
}
```

### Step 5: Update Metadata (if page-level)
Metadata must be in Server Component, so use a separate layout or wrap in a parent:
```tsx
export const metadata: Metadata = {
  title: "About Us — The Raising Club",
  description: "..."
};
```

## Phase 3: Remaining Pages (44+ pages)

Using the same pattern above, translate:

### Authenticated Pages
- Dashboard (+ all dashboard subpages)
- Profile pages
- Settings pages
- Connect / Browse pages
- Jobs pages
- Courses detail pages
- Events detail/registration pages
- Organization pages

### Public Pages
- Sign In / Forgot Password
- Onboarding flow
- Membership page
- Manifesto page
- Deactivated page

### Admin Pages (Optional - lower priority)
- All `/admin/*` pages
- Courses admin
- Marketplace admin
- Plans admin
- Users admin

## Translation Key Structure

### Top-level namespaces:
```
pages.* → Page-specific content
  - pages.aboutUs
  - pages.marketplace
  - pages.courses
  - pages.events
  - pages.terms
  - pages.privacy
  - pages.dashboard
  - etc.

landing.* → Landing page components
  - landing.hero
  - landing.joinCards
  - landing.howItWorks
  - etc.

sidebar.* → Authenticated sidebar
common.* → Shared across entire app
navigation.* → Header/footer nav
```

## Best Practices

1. **Namespace by feature**: Keep related strings together
   ```json
   "pages.courses": { "title": "...", "noCourses": "...", "enrollNow": "..." }
   ```

2. **Use meaningful keys**: Avoid generic keys like "text1", "text2"
   ```json
   // Good
   "pages.courses.noCourses": "No courses yet"
   
   // Bad
   "pages.courses.text": "No courses yet"
   ```

3. **Keep strings short**: Breaks in translation alignment
   ```json
   // Good - concatenate in JSX
   "firstName": "First", "lastName": "Last"
   
   // Less ideal
   "fullName": "First and Last"
   ```

4. **Use components for dynamic text**: When text has variables
   ```tsx
   const t = useTranslations('pages');
   // Instead of: t('greeting', {name: userName})
   // Use: {t('greeting')} {userName}
   ```

## Translation Completeness Checklist

- [ ] All page titles translated
- [ ] All section headers translated
- [ ] All button labels translated
- [ ] All form labels translated
- [ ] All error messages translated
- [ ] All success messages translated
- [ ] All placeholder text translated
- [ ] All empty states translated
- [ ] All metadata (page title, description) translated

## Common Pitfalls

1. **Forgetting "use client"** on components that use `useTranslations()`
2. **Hardcoding strings** in components instead of using translation keys
3. **Inconsistent key naming** across pages
4. **Missing translations** in es.json when adding to en.json
5. **Not testing** both languages before committing

## Testing Your Translations

1. **Test English URL**: `/dashboard` should show English
2. **Test Spanish URL**: `/es/dashboard` should show Spanish
3. **Test switcher**: Click EN/ES buttons and verify content changes
4. **Test persistence**: Navigate to new page, language should persist
5. **Test browser refresh**: Language preference should be remembered

## Next Steps

1. **Priority Phase**: Finish landing page (Features, Audiences, Mission, CTA)
2. **Week 1**: Complete the 6 priority pages (About, Marketplace, Courses, Events, Terms, Privacy)
3. **Week 2+**: Translate remaining pages using the pattern above

## Automation Tips

The `scripts/generate-page-translations.mjs` script can help:
```bash
node scripts/generate-page-translations.mjs aboutUs
node scripts/generate-page-translations.mjs courses
```

This shows you the translation key structure for each page type.

## Spanish Translation Notes

- **Gender matters**: Some words have masculine/feminine forms
- **Formal vs. Informal**: Use "usted" (formal) for most of the site
- **Regional differences**: We're using neutral Spanish (no regional slang)
- **Character limits**: Spanish is ~20% longer than English on average

## Support

For questions:
- Check this guide first
- Search `messages/*.json` for similar keys
- Use the pattern from already-translated pages as reference
