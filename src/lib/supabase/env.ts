/**
 * Resolves Supabase connection config from env, accepting either the new
 * publishable key (`sb_publishable_…`) or the legacy anon JWT. Next inlines
 * each `process.env.NEXT_PUBLIC_*` reference at build time.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
