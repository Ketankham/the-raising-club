# 🌍 Google Translate API Integration Guide

## Setup Steps

### 1. Install Google Translate Package

```bash
npm install --save-dev @google-cloud/translate
```

### 2. Set Up Google Cloud Credentials

#### Option A: Use Service Account (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Cloud Translation API**
4. Create a **Service Account**:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Add role: "Cloud Translation API Editor"
5. Create JSON key:
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key" > JSON
   - Save the JSON file to your project

#### Option B: Use Application Default Credentials
```bash
gcloud auth application-default login
```

### 3. Set Environment Variables

```bash
# Linux/Mac
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
export GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Windows PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\credentials.json"
$env:GOOGLE_CLOUD_PROJECT_ID = "your-project-id"
```

### 4. Run Translation Script

#### Batch Translate All Pages
```bash
node scripts/translate-with-google.mjs batch
```

This will:
- Read all English strings from `messages/en.json`
- Call Google Translate API for each string
- Cache translations in `.translation-cache.json`
- Save Spanish translations to `messages/es.json`

#### Translate Specific Page
```bash
node scripts/translate-with-google.mjs page aboutUs
node scripts/translate-with-google.mjs page courses
```

## How It Works

### Batch Translation (One-time)
```
messages/en.json → Google Translate API → messages/es.json
                                      ↓
                              .translation-cache.json
```

**Pros:**
- Fast page loads (translations pre-cached)
- Full control over translations
- Can review before deploying

**Cons:**
- Need to re-run script when adding new English strings

### Dynamic Translation (Runtime)
```
New English string → Google Translate API → Cache → HTML
```

**Pros:**
- Automatic for new content
- No need to rebuild messages files

**Cons:**
- Slower (API call per first-time translation)
- Depends on API availability

## Recommended Workflow

### For Static Pages (Terms, Privacy, About Us)
1. Run batch translation once:
   ```bash
   node scripts/translate-with-google.mjs batch
   ```
2. Review Spanish translations in `messages/es.json`
3. Make manual adjustments if needed (fix poor translations)
4. Commit both files to git

### For Dynamic Pages (Dashboard, User Content)
Use the imported `getTranslation` function in your code:
```tsx
import { getTranslation } from '@/scripts/translate-with-google.mjs';

// In server action or API route
const translatedText = await getTranslation("User's message", 'es');
```

## Cost Estimation

Google Translate API pricing (as of 2024):
- **$15 per million characters** after free tier
- Free tier: **500k characters/month**

Example costs:
- 50 pages × 2000 chars each = 100k chars = **$1.50**
- Dashboard + user content = ~500k chars = **FREE** (within free tier)
- Full site × 5 languages = ~500k chars = **FREE** (within free tier)

## Caching Strategy

Translations are cached in `.translation-cache.json` to:
1. Avoid repeated API calls for same strings
2. Reduce costs
3. Speed up batch operations

Cache structure:
```json
{
  "About Us:es": "Acerca de nosotros",
  "Learn from experts:es": "Aprende de expertos",
  ...
}
```

### Clear Cache
```bash
rm .translation-cache.json
```

## Troubleshooting

### "Credentials not found"
```bash
# Check if credentials file exists
ls -la $GOOGLE_APPLICATION_CREDENTIALS

# Or set it manually
export GOOGLE_APPLICATION_CREDENTIALS=/full/path/to/credentials.json
```

### "Translation API not enabled"
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/library)
2. Search for "Cloud Translation API"
3. Click and enable it

### "Quota exceeded"
- You've exceeded the free tier limit
- Upgrade to paid in Google Cloud Console
- Or wait for next billing cycle

## Implementation in Components

### For Pages Using Translations
Once batch translation is done, pages automatically use Spanish from `messages/es.json`:

```tsx
// Page component
import { useTranslations } from 'next-intl';

export default function AboutPage() {
  const t = useTranslations('pages.aboutUs');
  return <h1>{t('title')}</h1>; // Automatically English or Spanish
}
```

### For User-Generated Content
Use the dynamic translation function:

```tsx
// In server action
import { getTranslation } from '@/scripts/translate-with-google.mjs';

export async function translateUserComment(text: string) {
  const spanish = await getTranslation(text, 'es');
  return spanish;
}
```

## Next Steps

1. **Get credentials**: Follow Google Cloud setup above
2. **Run batch translation**: `node scripts/translate-with-google.mjs batch`
3. **Review translations**: Check `messages/es.json` for quality
4. **Commit**: Add both message files to git
5. **Deploy**: All pages now switch languages automatically

## CI/CD Integration

To auto-translate on each deploy:

```yaml
# .github/workflows/translate.yml (example)
name: Auto-translate
on: [push]

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: |
          export GOOGLE_APPLICATION_CREDENTIALS=${{ secrets.GOOGLE_CREDENTIALS }}
          node scripts/translate-with-google.mjs batch
      - run: git commit -am "chore: auto-translated messages"
```

## Limitations & Considerations

1. **Machine translation quality**: Google Translate is 90%+ accurate for Spanish but may need manual review
2. **Context**: Translations lack domain context (medical terms, brand names, etc.)
3. **Formatting**: HTML tags in strings may be mistranslated
4. **Cost**: Monitor API usage in Google Cloud Console

## Support

For issues:
- Check [Google Translate API docs](https://cloud.google.com/translate/docs)
- Review cached translations in `.translation-cache.json`
- Run with specific page to debug: `node scripts/translate-with-google.mjs page <name>`
