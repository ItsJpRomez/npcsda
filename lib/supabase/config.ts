/* Supabase connection settings, read from environment variables
   (.env.local on your computer, Project Settings → Environment Variables on Vercel).
   Both values are public by design; Row Level Security protects the data. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const MEDIA_BUCKET = 'media';
