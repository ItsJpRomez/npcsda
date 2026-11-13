'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { fmtDate } from '@/lib/format';
import { getBrowserClient } from '@/lib/supabase/browser';
import { friendly, persist } from '@/lib/admin/api';
import { Field, focusFirstError, fromForm, toForm, type Errors, type FormState, type ImageState } from './fields';
import { SINGLES, type SingleSection, type SingleSectionKey } from './sections';
import { Busy, ErrorBox, useUI } from './ui';

/** Form for a one-row table (church info, building fund, giving). */
export function SinglePanel({ section, after }: { section: SingleSectionKey; after?: ReactNode }) {
  const def = SINGLES[section] as SingleSection;
  const fields = def.groups.flatMap((g) => g.fields);
  const ui = useUI();
  const prefix = useId();
  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [images, setImages] = useState<Record<string, ImageState>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLFormElement>(null);

  useEffect(() => {
    getBrowserClient().from(def.table).select('*').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (error) { setLoadError(friendly(error)); return; }
      const r = (data ?? {}) as Record<string, unknown>;
      setRow(r);
      setForm(toForm(fields, r));
      setStatus(r.updated_at ? `Last saved ${fmtDate(r.updated_at as string)}` : '');
    });
    return () => ui.setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.table]);

  const markDirty = () => { ui.setDirty(true); setStatus('You have unsaved changes'); };
  const change = (key: string, v: string | boolean) => {
    markDirty();
    setForm((f) => ({ ...f, [key]: v }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { values, errors: errs } = fromForm(fields, form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      ui.toast('Please fix the highlighted fields.', 'error');
      requestAnimationFrame(() => focusFirstError(root.current, errs));
      return;
    }
    setBusy(true);
    try {
      const saved = await persist({ table: def.table, single: true, values, original: row, fields, images });
      setRow(saved);
      setImages({});
      ui.setDirty(false);
      setStatus('Saved just now');
      ui.toast('Saved. The website is updated.');
    } catch (err) { ui.toast(friendly(err), 'error'); }
    setBusy(false);
  };

  if (loadError) return <ErrorBox>{loadError}</ErrorBox>;
  if (!row) return <div className="page-loading" style={{ minHeight: '30vh' }} role="status"><span className="spinner" /><span>Loading…</span></div>;

  const preview = def.preview?.(form);
  return (
    <>
      {def.intro && <p className="page-intro">{def.intro}</p>}
      <form noValidate onSubmit={submit} ref={root}>
        {def.groups.map((g, gi) => (
          <section className="panel" key={g.title}>
            <div className="panel-head"><div><h2>{g.title}</h2>{g.desc && <p>{g.desc}</p>}</div></div>
            <div className="form-grid">
              {g.fields.map((f) => (
                <Field
                  key={f.key} f={f} idPrefix={prefix} value={form[f.key]} error={errors[f.key]} onChange={change}
                  image={images[f.key]} currentImage={row[f.key] as string | null}
                  onImage={(key, st) => { markDirty(); setImages((m) => ({ ...m, [key]: st })); }}
                />
              ))}
            </div>
            {preview && gi === def.groups.length - 1 && (
              <div className="live-preview">
                <div className="progress" aria-hidden="true"><span style={{ width: `${preview.pct}%` }} /></div>
                <p className="help" style={{ margin: 0 }}>{preview.text}</p>
              </div>
            )}
          </section>
        ))}
        <div className="save-bar">
          <span className="status" aria-live="polite">{status}</span>
          <button type="submit" className="btn btn-navy" disabled={busy}><Busy busy={busy}>Save changes</Busy></button>
        </div>
      </form>
      {after}
    </>
  );
}
