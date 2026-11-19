'use client';

import { useEffect, useRef, useState } from 'react';
import { fromLocalInput, hm, mediaSrc, toLocalInput } from '@/lib/format';
import { ACCEPT, MAX_MB, checkFile } from '@/lib/admin/api';
import { Icon } from './Icon';

export type FieldType =
  | 'text' | 'textarea' | 'select' | 'checkbox' | 'image' | 'gallery' | 'datetime' | 'time'
  | 'money' | 'number' | 'url' | 'link' | 'email' | 'tel';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  full?: boolean;
  help?: string;
  placeholder?: string;
  options?: [string | number, string][];
  cast?: 'int';
  folder?: string;   // storage folder for image and gallery fields
  cover?: string;    // gallery fields: column that mirrors the first photo
  maxItems?: number; // gallery fields: most photos allowed
  min?: number;
  max?: number;
  rows?: number;
}

export interface ImageState { file: File | null; removed: boolean; preview: string | null }
/** One photo in a gallery field: already saved (url) or chosen and waiting for Save (file). */
export interface GalleryItem { id: string; url?: string; file?: File; preview: string }
export interface GalleryState { items: GalleryItem[] }
export type MediaState = ImageState | GalleryState;
export const isGallery = (m: MediaState | undefined): m is GalleryState => !!m && 'items' in m;
export type FormState = Record<string, string | boolean>;
export type Errors = Record<string, string>;

/** Database value → form input value */
export function toForm(fields: FieldDef[], row: Record<string, unknown>): FormState {
  const out: FormState = {};
  for (const f of fields) {
    const v = row[f.key];
    if (f.type === 'image' || f.type === 'gallery') continue;
    if (f.type === 'checkbox') out[f.key] = Boolean(v);
    else if (f.type === 'datetime') out[f.key] = toLocalInput(v as string | null);
    else if (f.type === 'time') out[f.key] = hm(v as string | null);
    else out[f.key] = v == null ? '' : String(v);
  }
  return out;
}

/** Form input values → database values, or field errors. */
export function fromForm(fields: FieldDef[], form: FormState): { values: Record<string, unknown>; errors: Errors } {
  const values: Record<string, unknown> = {};
  const errors: Errors = {};
  for (const f of fields) {
    if (f.type === 'image' || f.type === 'gallery') continue;
    const raw = form[f.key];
    if (f.type === 'checkbox') { values[f.key] = Boolean(raw); continue; }
    const s = String(raw ?? '').trim();
    if (f.required && !s) { errors[f.key] = `Please fill in “${f.label}”.`; continue; }
    if (!s) { values[f.key] = null; continue; }
    switch (f.type) {
      case 'number': case 'money': {
        const n = Number(s);
        if (!Number.isFinite(n) || (f.type === 'money' && n < 0)) { errors[f.key] = 'Please enter a valid number.'; break; }
        if ((f.min != null && n < f.min) || (f.max != null && n > f.max)) { errors[f.key] = `Please enter a number between ${f.min} and ${f.max}.`; break; }
        values[f.key] = f.type === 'number' ? Math.round(n) : n;
        break;
      }
      case 'url':
        if (!/^https?:\/\/\S+\.\S+/i.test(s)) errors[f.key] = 'Please enter a full web address starting with https://';
        else values[f.key] = s;
        break;
      case 'link':
        if (!/^(https?:\/\/\S+\.\S+|#[\w-]+)$/i.test(s)) errors[f.key] = 'Please enter a full web address starting with https://, or #prayer.';
        else values[f.key] = s;
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) errors[f.key] = 'Please enter a valid email address.';
        else values[f.key] = s;
        break;
      case 'datetime': values[f.key] = fromLocalInput(s); break;
      case 'select': values[f.key] = f.cast === 'int' ? parseInt(s, 10) : s; break;
      default: values[f.key] = s;
    }
  }
  return { values, errors };
}

/** Focus the first field with an error. */
export function focusFirstError(root: HTMLElement | null, errors: Errors) {
  const key = Object.keys(errors)[0];
  if (key && root) root.querySelector<HTMLElement>(`[name="${CSS.escape(key)}"]`)?.focus();
}

/* ---------- One form field ---------- */
export function Field({ f, idPrefix, value, error, onChange, image, onImage, currentImage }: {
  f: FieldDef;
  idPrefix: string;
  value: string | boolean | undefined;
  error?: string;
  onChange: (key: string, v: string | boolean) => void;
  image?: MediaState;
  onImage?: (key: string, st: MediaState) => void;
  currentImage?: unknown;
}) {
  const id = `${idPrefix}-${f.key}`;
  const cls = `field${f.full ? ' full' : ''}`;
  const described = [f.help && `${id}-help`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  const common = {
    id, name: f.key, required: f.required, 'aria-invalid': error ? true : undefined, 'aria-describedby': described,
    placeholder: f.placeholder,
  };

  if (f.type === 'checkbox') {
    return (
      <div className={cls}>
        <label className="switch-row">
          <input type="checkbox" name={f.key} checked={Boolean(value)} onChange={(e) => onChange(f.key, e.target.checked)} />
          <span className="switch" aria-hidden="true" />
          <span>{f.label}</span>
        </label>
        {f.help && <p className="help" id={`${id}-help`}>{f.help}</p>}
      </div>
    );
  }

  if (f.type === 'image') {
    return <ImageField f={f} id={id} cls={cls} state={isGallery(image) ? undefined : image} current={typeof currentImage === 'string' ? currentImage : null} onImage={(st) => onImage?.(f.key, st)} />;
  }
  if (f.type === 'gallery') {
    const saved = Array.isArray(currentImage) ? (currentImage as string[]).filter(Boolean) : [];
    return <GalleryField f={f} id={id} cls={cls} state={isGallery(image) ? image : undefined} saved={saved} onChange={(st) => onImage?.(f.key, st)} />;
  }

  const v = String(value ?? '');
  const set = (e: { target: { value: string } }) => onChange(f.key, e.target.value);
  let input;
  switch (f.type) {
    case 'textarea':
      input = <textarea {...common} rows={f.rows ?? 4} value={v} onChange={set} />;
      break;
    case 'select':
      input = (
        <select {...common} value={v} onChange={set}>
          {!f.required && <option value="">None</option>}
          {(f.options ?? []).map(([val, text]) => <option key={String(val)} value={String(val)}>{text}</option>)}
        </select>
      );
      break;
    case 'datetime': input = <input {...common} type="datetime-local" value={v} onChange={set} />; break;
    case 'time': input = <input {...common} type="time" value={v} onChange={set} />; break;
    case 'money': input = <input {...common} type="number" min={0} step="0.01" inputMode="decimal" value={v} onChange={set} />; break;
    case 'number': input = <input {...common} type="number" inputMode="numeric" min={f.min} max={f.max} value={v} onChange={set} />; break;
    case 'link': input = <input {...common} type="text" inputMode="url" value={v} onChange={set} />; break;
    default:
      input = <input {...common} type={f.type} value={v} onChange={set} autoComplete={f.type === 'email' ? 'email' : undefined} />;
  }
  return (
    <div className={cls}>
      <label htmlFor={id}>{f.label}{f.required && <> <span className="req" aria-hidden="true">*</span></>}</label>
      {input}
      {f.help && <p className="help" id={`${id}-help`}>{f.help}</p>}
      {error && <p className="error" id={`${id}-err`}>{error}</p>}
    </div>
  );
}

/* ---------- Photo picker: keeps the chosen file until Save ---------- */
function ImageField({ f, id, cls, state, current, onImage }: {
  f: FieldDef; id: string; cls: string; state?: ImageState; current: string | null; onImage: (st: ImageState) => void;
}) {
  const [problem, setProblem] = useState<string | null>(null);
  const preview = useRef<string | null>(null);
  useEffect(() => () => { if (preview.current) URL.revokeObjectURL(preview.current); }, []);

  const shown = state?.preview ?? (state?.removed ? null : current ? mediaSrc(current) : null);
  const choose = (file: File | undefined) => {
    if (!file) return;
    const p = checkFile(file);
    setProblem(p);
    if (p) return;
    if (preview.current) URL.revokeObjectURL(preview.current);
    preview.current = URL.createObjectURL(file);
    onImage({ file, removed: false, preview: preview.current });
  };
  const remove = () => {
    if (preview.current) URL.revokeObjectURL(preview.current);
    preview.current = null;
    setProblem(null);
    onImage({ file: null, removed: true, preview: null });
  };

  return (
    <div className={cls}>
      <span className="field-label" id={`${id}-label`}>{f.label}</span>
      <div className="img-field">
        <div className="img-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {shown ? <img src={shown} alt={state?.file ? 'Preview of the new photo' : ''} /> : <Icon name="image" />}
        </div>
        <div className="img-actions">
          <label className="btn btn-light file-btn">
            <Icon name="upload" size="sm" /> <span>{state?.file ? 'Choose another' : shown ? 'Replace photo' : 'Choose photo'}</span>
            <input type="file" accept={ACCEPT} aria-labelledby={`${id}-label`} onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          {shown && <button type="button" className="link-btn danger" onClick={remove}>Remove photo</button>}
          <p className="help">{f.help ?? `JPG, PNG or WebP, up to ${MAX_MB} MB. Saved when you click Save.`}</p>
          {problem && <p className="error" role="alert">{problem}</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Several photos: add, reorder, remove; the first is the cover ---------- */
let nextId = 0;
function GalleryField({ f, id, cls, state, saved, onChange }: {
  f: FieldDef; id: string; cls: string; state?: GalleryState; saved: string[]; onChange: (st: GalleryState) => void;
}) {
  const max = f.maxItems ?? 12;
  const [problems, setProblems] = useState<string[]>([]);
  const items: GalleryItem[] = state?.items ?? saved.map((url) => ({ id: url, url, preview: mediaSrc(url) }));
  const previews = useRef<Set<string>>(new Set());
  useEffect(() => () => { previews.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const set = (next: GalleryItem[]) => onChange({ items: next });
  const add = (files: FileList | null) => {
    if (!files?.length) return;
    const room = max - items.length;
    const bad: string[] = [];
    const added: GalleryItem[] = [];
    for (const file of Array.from(files)) {
      const p = checkFile(file);
      if (p) { bad.push(p); continue; }
      if (added.length >= room) { bad.push(`Only ${max} photos can be added, so some were skipped.`); break; }
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      added.push({ id: `new-${++nextId}`, file, preview });
    }
    setProblems(bad);
    if (added.length) set([...items, ...added]);
  };
  const move = (i: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(i, 1);
    next.splice(to, 0, it);
    set(next);
  };
  const remove = (i: number) => set(items.filter((_, n) => n !== i));

  return (
    <div className={cls}>
      <span className="field-label" id={`${id}-label`}>{f.label}</span>
      <div className="gallery-field">
        {items.length > 0 && (
          <ol className="gf-grid" aria-labelledby={`${id}-label`}>
            {items.map((it, i) => (
              <li key={it.id} className="gf-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.preview} alt={`Photo ${i + 1}${it.file ? ' (new)' : ''}`} />
                {i === 0 ? <span className="badge sky gf-cover">Cover</span> : (
                  <button type="button" className="gf-make-cover" onClick={() => move(i, 0)}>Make cover</button>
                )}
                <div className="gf-tools">
                  <button type="button" className="icon-btn sm" aria-label={`Move photo ${i + 1} earlier`} disabled={i === 0} onClick={() => move(i, i - 1)}><Icon name="chevron-left" size="sm" /></button>
                  <button type="button" className="icon-btn sm" aria-label={`Move photo ${i + 1} later`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)}><Icon name="chevron" size="sm" /></button>
                  <button type="button" className="icon-btn sm danger" aria-label={`Remove photo ${i + 1}`} onClick={() => remove(i)}><Icon name="trash" size="sm" /></button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="img-actions">
          <label className={`btn btn-light file-btn${items.length >= max ? ' is-disabled' : ''}`}>
            <Icon name="upload" size="sm" /> <span>{items.length ? 'Add more photos' : 'Choose photos'}</span>
            <input type="file" multiple accept={ACCEPT} disabled={items.length >= max} aria-labelledby={`${id}-label`} onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
          </label>
          <p className="help">{f.help ?? `Up to ${max} photos. JPG, PNG or WebP, up to ${MAX_MB} MB each. The first photo is the cover. Saved when you click Save.`}</p>
          {problems.map((p, i) => <p key={i} className="error" role="alert">{p}</p>)}
        </div>
      </div>
    </div>
  );
}
