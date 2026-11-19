import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SUPABASE_KEY, SUPABASE_URL } from './config';

/** Supabase client that acts as the signed-in user (reads the session cookies). */
export async function getServerClient(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. proxy.ts refreshes the session instead.
        }
      },
    },
  });
}

/** Anonymous client for public content (no cookies, so pages can be cached). */
export function getPublicClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** True when the signed-in user is listed in admin_users. */
export async function getAdmin(): Promise<{ email: string; name: string } | null> {
  const sb = await getServerClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb.rpc('is_admin');
  if (error || data !== true) return null;
  // Display name, if one is set on the account (Supabase → Authentication → Users → Display name)
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name = [meta.display_name, meta.full_name, meta.name].find((v) => typeof v === 'string' && v.trim()) as string | undefined;
  return { email: user.email ?? '', name: name?.trim() ?? '' };
}
