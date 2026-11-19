'use client';

/* Data helpers for the Admin Panel. All access goes through the signed-in
   user's Supabase session; Row Level Security decides what is allowed. */

import { getBrowserClient } from '@/lib/supabase/browser';
import { MEDIA_BUCKET } from '@/lib/supabase/config';
import { revalidateSite } from '@/app/admin/actions';
import { isGallery, type FieldDef, type ImageState, type MediaState } from '@/components/admin/fields';

export const MAX_MB = 5;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const ACCEPT = Object.keys(TYPES).join(',');

export type Row = Record<string, unknown> & { id: string | number };

/** Plain-language message for an error from Supabase or the network. */
export function friendly(err: unknown): string {
  const e = err as { message?: string; error_description?: string } | null;
  const m = (e && (e.message || e.error_description)) || String(err);
  if (/row-level security|permission denied|not authorized|unauthorized/i.test(m)) return "You don't have permission to make this change. Please sign in again as an administrator.";
  if (/jwt|session|refresh token/i.test(m)) return 'Your session has expired. Please sign in again.';
  if (/failed to fetch|networkerror|network request failed/i.test(m)) return "Can't reach the server. Check your internet connection and try again.";
  if (/maximum allowed size|payload too large|too large/i.test(m)) return `This photo is too large. Please use one smaller than ${MAX_MB} MB.`;
  if (/mime type|invalid_mime/i.test(m)) return 'Only JPG, PNG or WebP photos can be uploaded.';
  if (/violates check constraint/i.test(m)) return "One of the values isn't allowed. Please check the form and try again.";
  return m;
}

/** Returns a problem message, or null if the file can be uploaded. */
export function checkFile(file: File): string | null {
  if (!TYPES[file.type]) return 'Only JPG, PNG or WebP photos can be uploaded.';
  if (file.size > MAX_MB * 1024 * 1024) {
    return `“${file.name}” is ${(file.size / 1048576).toFixed(1)} MB. Please use a photo smaller than ${MAX_MB} MB.`;
  }
  return null;
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const problem = checkFile(file);
  if (problem) throw new Error(problem);
  const sb = getBrowserClient();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${TYPES[file.type]}`;
  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, file, { cacheControl: '31536000', contentType: file.type, upsert: false });
  if (error) throw error;
  return sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

const storagePath = (url: unknown): string | null => {
  const part = String(url ?? '').split(`/storage/v1/object/public/${MEDIA_BUCKET}/`)[1];
  return part ? decodeURIComponent(part.split('?')[0]) : null;
};

/** Deletes an uploaded photo. Built-in site images (/assets/…) are never touched. */
export async function removeImage(url: unknown): Promise<void> {
  const p = storagePath(url);
  if (!p) return;
  const { error } = await getBrowserClient().storage.from(MEDIA_BUCKET).remove([p]);
  if (error) console.warn('Could not delete old image', p, error);
}

/** Tells the website to show the latest content now instead of waiting for its cache. */
export async function publish(): Promise<void> {
  try { await revalidateSite(); } catch (err) { console.warn('Could not refresh the website cache', err); }
}

/** Upload chosen photos, save the row, then tidy up photos that were replaced. */
export async function persist(opts: {
  table: string;
  id?: string | number | null;
  single?: boolean;
  values: Record<string, unknown>;
  original?: Record<string, unknown> | null;
  fields: FieldDef[];
  images: Record<string, MediaState>;
}): Promise<Row> {
  const { table, id, single, values, original, fields, images } = opts;
  const sb = getBrowserClient();
  const imageFields = fields.filter((f) => f.type === 'image');
  const galleryFields = fields.filter((f) => f.type === 'gallery');
  const uploaded: string[] = [];
  try {
    // Gallery fields: upload new photos in their place in the list; the first one also becomes the cover
    for (const f of galleryFields) {
      const st = images[f.key];
      if (!isGallery(st)) continue;
      const urls: string[] = [];
      for (const it of st.items) {
        if (it.url) { urls.push(it.url); continue; }
        if (!it.file) continue;
        const url = await uploadImage(it.file, f.folder || table);
        uploaded.push(url);
        urls.push(url);
      }
      values[f.key] = urls;
      if (f.cover) values[f.cover] = urls[0] ?? null;
    }
    for (const f of imageFields) {
      const st = images[f.key] as ImageState | undefined;
      if (st?.file) {
        const url = await uploadImage(st.file, f.folder || table);
        uploaded.push(url);
        values[f.key] = url;
      } else if (st?.removed) values[f.key] = null;
    }
    const q = single
      ? sb.from(table).upsert({ id: 1, ...values })
      : id != null ? sb.from(table).update(values).eq('id', id) : sb.from(table).insert(values);
    const { data, error } = await q.select().single();
    if (error) throw error;
    const saved = data as Row;
    if (original) {
      for (const f of imageFields) {
        if (original[f.key] && original[f.key] !== saved[f.key]) void removeImage(original[f.key]);
      }
      for (const f of galleryFields) {
        const kept = new Set(asList(saved[f.key]));
        asList(original[f.key]).filter((u) => !kept.has(u)).forEach((u) => void removeImage(u));
      }
    }
    void publish();
    return saved;
  } catch (err) {
    uploaded.forEach((u) => void removeImage(u));
    throw err;
  }
}

export async function deleteRow(table: string, row: Row): Promise<void> {
  const { error } = await getBrowserClient().from(table).delete().eq('id', row.id);
  if (error) throw error;
  new Set([row.image_url, ...asList(row.images)].filter(Boolean)).forEach((u) => void removeImage(u));
  void publish();
}

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x) : []);

export async function setPublished(table: string, id: Row['id'], on: boolean): Promise<void> {
  const { error } = await getBrowserClient().from(table).update({ published: on }).eq('id', id);
  if (error) throw error;
  void publish();
}

/**
 * Save a new order after drag-and-drop. `visibleOrder` is the new order of the items that
 * were on screen (maybe a filtered subset); hidden-by-filter items keep their places.
 * Returns the whole list in its new order with renumbered sort_order.
 */
export async function reorderRows<T extends Row>(table: string, all: T[], visibleOrder: T[]): Promise<T[]> {
  const sorted = [...all].sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
  const shown = new Set(visibleOrder.map((r) => r.id));
  let k = 0;
  const merged = sorted.map((r) => (shown.has(r.id) ? visibleOrder[k++] : r));
  const changes = merged.map((r, i) => ({ r, n: (i + 1) * 10 })).filter(({ r, n }) => r.sort_order !== n);
  const sb = getBrowserClient();
  const results = await Promise.all(changes.map(({ r, n }) => sb.from(table).update({ sort_order: n }).eq('id', r.id)));
  const bad = results.find((x) => x.error);
  if (bad?.error) throw bad.error;
  void publish();
  return merged.map((r, i) => ({ ...r, sort_order: (i + 1) * 10 }));
}
