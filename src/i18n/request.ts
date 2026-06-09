import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { createClient } from '@/lib/supabase/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Signed-in user preference overrides URL/cookie/browser
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('locale')
        .eq('id', user.id)
        .single();
      if (profile?.locale) locale = profile.locale;
    }
  } catch {
    // If Supabase is unavailable, continue with routing-detected locale
  }

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
