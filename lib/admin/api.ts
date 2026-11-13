'use client';

/* Data helpers for the Admin Panel. All access goes through the signed-in
   user's Supabase session; Row Level Security decides what is allowed. */

import { getBrowserClient } from '@/lib/supabase/browser';
import { MEDIA_BUCKET } from '@/lib/supabase/config';
import { revalidateSite } from '@/app/admin/actions';
import type { FieldDef, ImageState } from '@/components/admin/fields';

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
  images: Record<string, ImageState>;
}): Promise<Row> {
  const { table, id, single, values, original, fields, images } = opts;
  const sb = getBrowserClient();
  const imageFields = fields.filter((f) => f.type === 'image');
  const uploaded: string[] = [];
  try {
    for (const f of imageFields) {
      const st = images[f.key];
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
  if (row.image_url) void removeImage(row.image_url);
  void publish();
}

export async function setPublished(table: string, id: Row['id'], on: boolean): Promise<void> {
  const { error } = await getBrowserClient().from(table).update({ published: on }).eq('id', id);
  if (error) throw error;
  void publish();
}

/** Move an item one place up/down among the visible items, then renumber the whole list. */
export async function moveRow(table: string, all: Row[], visible: Row[], id: Row['id'], dir: -1 | 1): Promise<void> {
  const vi = visible.findIndex((r) => r.id === id);
  const other = visible[vi + dir];
  if (!other) return;
  const order = [...all].sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
  const [item] = order.splice(order.findIndex((r) => r.id === id), 1);
  order.splice(order.findIndex((r) => r.id === other.id) + (dir > 0 ? 1 : 0), 0, item);
  const changes = order.map((r, i) => ({ r, n: (i + 1) * 10 })).filter(({ r, n }) => r.sort_order !== n);
  const sb = getBrowserClient();
  const results = await Promise.all(changes.map(({ r, n }) => sb.from(table).update({ sort_order: n }).eq('id', r.id)));
  const bad = results.find((x) => x.error);
  if (bad?.error) throw bad.error;
  changes.forEach(({ r, n }) => { r.sort_order = n; });
  void publish();
}
