import 'server-only';
import { DEFAULT_CONTENT } from './default-content';
import { isSupabaseConfigured } from './supabase/config';
import { getPublicClient } from './supabase/server';
import type { SiteContent } from './types';

/**
 * Loads everything the public page shows. Each section falls back to the
 * built-in content on its own, so one failing table never empties the page.
 */
export async function getSiteContent(): Promise<SiteContent> {
  if (!isSupabaseConfigured) return DEFAULT_CONTENT;
  const sb = getPublicClient();

  const list = async <K extends keyof SiteContent>(key: K, table: string, order: [string, boolean?][]): Promise<SiteContent[K]> => {
    let q = sb.from(table).select('*');
    if (table !== 'albums') q = q.eq('published', true);
    for (const [col, nullsFirst] of order) q = q.order(col, { ascending: true, nullsFirst: nullsFirst ?? false });
    const { data, error } = await q;
    if (error || !data) {
      console.warn(`[content] using built-in ${table}:`, error?.message);
      return DEFAULT_CONTENT[key];
    }
    return data as SiteContent[K];
  };
  const single = async <K extends 'info' | 'fund' | 'giving'>(key: K, table: string): Promise<SiteContent[K]> => {
    const { data, error } = await sb.from(table).select('*').eq('id', 1).maybeSingle();
    if (error || !data) {
      if (error) console.warn(`[content] using built-in ${table}:`, error.message);
      return DEFAULT_CONTENT[key];
    }
    return data as SiteContent[K];
  };

  const [info, services, events, ministries, officers, milestones, albums, photos, fund, giving, givingMethods, resources] =
    await Promise.all([
      single('info', 'church_info'),
      list('services', 'services', [['day_of_week'], ['start_time']]),
      list('events', 'events', [['starts_at']]),
      list('ministries', 'ministries', [['sort_order'], ['created_at']]),
      list('officers', 'officers', [['sort_order'], ['created_at']]),
      list('milestones', 'milestones', [['year'], ['sort_order']]),
      list('albums', 'albums', [['sort_order'], ['created_at']]),
      list('photos', 'photos', [['sort_order'], ['created_at']]),
      single('fund', 'building_fund'),
      single('giving', 'giving'),
      list('givingMethods', 'giving_methods', [['sort_order'], ['created_at']]),
      list('resources', 'resources', [['sort_order'], ['created_at']]),
    ]);

  return { info, services, events, ministries, officers, milestones, albums, photos, fund, giving, givingMethods, resources };
}
