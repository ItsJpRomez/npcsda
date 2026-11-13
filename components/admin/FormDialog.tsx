'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { friendly } from '@/lib/admin/api';
import { Icon } from '../Icon';
import { Field, focusFirstError, fromForm, toForm, type Errors, type FieldDef, type FormState, type ImageState } from './fields';
import { Busy, Modal, useUI } from './ui';

export interface FormDialogProps {
  title: string;
  fields: FieldDef[];
  initial: Record<string, unknown>;
  validate?: (v: Record<string, unknown>) => [string, string] | null;
  onSave: (values: Record<string, unknown>, images: Record<string, ImageState>) => Promise<void>;
  onClose: () => void;
}

/** Add / edit pop-up. Asks before throwing away unsaved changes. */
export function FormDialog({ title, fields, initial, validate, onSave, onClose }: FormDialogProps) {
  const ui = useUI();
  const prefix = useId();
  const [form, setForm] = useState<FormState>(() => toForm(fields, initial));
  const [images, setImages] = useState<Record<string, ImageState>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const dirty = useRef(false);
  const body = useRef<HTMLDivElement>(null);

  const change = (key: string, v: string | boolean) => {
    dirty.current = true;
    setForm((f) => ({ ...f, [key]: v }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };
  const close = async () => {
    if (busy) return;
    if (dirty.current && !(await ui.confirm({ title: 'Discard your changes?', body: "You have changes that haven't been saved.", confirmLabel: 'Discard' }))) return;
    onClose();
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { values, errors: errs } = fromForm(fields, form);
    if (!Object.keys(errs).length && validate) {
      const problem = validate(values);
      if (problem) errs[problem[0]] = problem[1];
    }
    setErrors(errs);
    if (Object.keys(errs).length) { requestAnimationFrame(() => focusFirstError(body.current, errs)); return; }
    setBusy(true);
    try {
      await onSave(values, images);
      dirty.current = false;
      onClose();
    } catch (err) {
      ui.toast(friendly(err), 'error');
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={close} labelledBy={`${prefix}-title`}>
      <form noValidate onSubmit={submit} style={{ display: 'contents' }}>
        <div className="dlg-head">
          <h2 id={`${prefix}-title`}>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={close}><Icon name="x" /></button>
        </div>
        <div className="dlg-body" ref={body}>
          <div className="form-grid">
            {fields.map((f) => (
              <Field
                key={f.key} f={f} idPrefix={prefix} value={form[f.key]} error={errors[f.key]} onChange={change}
                image={images[f.key]} currentImage={initial[f.key] as string | null}
                onImage={(key, st) => { dirty.current = true; setImages((m) => ({ ...m, [key]: st })); }}
              />
            ))}
          </div>
        </div>
        <div className="dlg-foot">
          <button type="button" className="btn btn-light" onClick={close} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-navy" disabled={busy}><Busy busy={busy}>Save</Busy></button>
        </div>
      </form>
    </Modal>
  );
}
