'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../Icon';

/* ---------- Toasts + confirm dialog ---------- */
type ToastKind = 'success' | 'error';
interface Toast { id: number; text: string; kind: ToastKind }
interface ConfirmOpts { title: string; body: string; confirmLabel?: string; danger?: boolean }

interface UI {
  toast: (text: string, kind?: ToastKind) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
  /** Pages with unsaved changes register here so leaving can ask first. */
  setDirty: (dirty: boolean) => void;
  isDirty: () => boolean;
}

const UIContext = createContext<UI | null>(null);

export function useUI(): UI {
  const ui = useContext(UIContext);
  if (!ui) throw new Error('useUI must be used inside <AdminUIProvider>');
  return ui;
}

export function AdminUIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ask, setAsk] = useState<(ConfirmOpts & { resolve: (ok: boolean) => void }) | null>(null);
  const dirty = useRef(false);

  const toast = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 8000 : 4000);
  }, []);
  const confirm = useCallback((opts: ConfirmOpts) => new Promise<boolean>((resolve) => setAsk({ ...opts, resolve })), []);
  const setDirty = useCallback((d: boolean) => { dirty.current = d; }, []);
  const isDirty = useCallback(() => dirty.current, []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const answer = (ok: boolean) => { ask?.resolve(ok); setAsk(null); };
  const danger = ask?.danger ?? true;

  return (
    <UIContext.Provider value={{ toast, confirm, setDirty, isDirty }}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
            <Icon name={t.kind === 'error' ? 'alert' : 'check'} />
            <p>{t.text}</p>
            <button type="button" aria-label="Dismiss" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}>
              <Icon name="x" size="sm" />
            </button>
          </div>
        ))}
      </div>
      <Modal open={!!ask} onClose={() => answer(false)} small labelledBy="confirm-title">
        {ask && (
          <>
            <div className="dlg-body">
              <div className="confirm-icon"><Icon name={danger ? 'trash' : 'alert'} /></div>
              <h2 id="confirm-title" style={{ fontSize: '1.1rem', marginBottom: 6 }}>{ask.title}</h2>
              <p style={{ margin: 0, color: 'var(--muted)' }}>{ask.body}</p>
            </div>
            <div className="dlg-foot">
              <button type="button" className="btn btn-light" autoFocus onClick={() => answer(false)}>Cancel</button>
              <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-navy'}`} onClick={() => answer(true)}>{ask.confirmLabel ?? 'Delete'}</button>
            </div>
          </>
        )}
      </Modal>
    </UIContext.Provider>
  );
}

/* ---------- Native <dialog> wrapper ---------- */
export function Modal({ open, onClose, children, small, labelledBy }: {
  open: boolean; onClose: () => void; children: ReactNode; small?: boolean; labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={small ? 'small' : undefined}
      aria-labelledby={labelledBy}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
    >
      {open ? children : null}
    </dialog>
  );
}

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export function Busy({ busy, label = 'Saving…', children }: { busy: boolean; label?: string; children: ReactNode }) {
  return busy ? <><Spinner /> {label}</> : <>{children}</>;
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return <div className="alert alert-error"><Icon name="alert" size="sm" /><span>{children}</span></div>;
}
