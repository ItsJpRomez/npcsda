'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';
import { Icon } from '../Icon';
import { Busy } from './ui';

type Mode = 'login' | 'reset' | 'newpass';
type Msg = { text: string; kind: 'error' | 'success' | 'info' } | null;

function friendlyAuth(err: unknown): string {
  const m = (err as { message?: string })?.message ?? String(err);
  if (/invalid login credentials/i.test(m)) return "That email and password don't match. Please try again.";
  if (/email not confirmed/i.test(m)) return "This email address hasn't been confirmed yet. Check your inbox for the confirmation link.";
  if (/failed to fetch|network/i.test(m)) return "Can't reach the server. Check your internet connection and try again.";
  if (/rate limit|too many/i.test(m)) return 'Too many attempts. Please wait a few minutes and try again.';
  return m;
}

export function LoginForm({ initialMode, notice }: { initialMode: Mode; notice: Msg }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [msg, setMsg] = useState<Msg>(notice);
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState<string | null>(null);
  const sb = getBrowserClient();

  // A non-admin who signed in is signed out again
  useEffect(() => { if (notice?.text.includes('administrator access')) void sb.auth.signOut(); }, [notice, sb]);

  const show = (m: Mode) => { setMode(m); setMsg(null); setInvalid(null); };
  const fail = (field: string, text: string) => { setInvalid(field); setMsg({ text, kind: 'error' }); document.getElementById(field)?.focus(); };
  const isAdmin = async () => { const { data, error } = await sb.rpc('is_admin'); return !error && data === true; };

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('email', 'Please enter a valid email address.');
    if (!password) return fail('password', 'Please enter your password.');
    setBusy(true); setMsg(null); setInvalid(null);
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!(await isAdmin())) {
        await sb.auth.signOut();
        throw new Error('This account does not have administrator access. Ask the church webmaster to add you.');
      }
      window.location.replace('/admin');
    } catch (err) {
      setMsg({ text: friendlyAuth(err), kind: 'error' });
      setBusy(false);
    }
  };

  const reset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('reset-email', 'Please enter a valid email address.');
    setBusy(true);
    try {
      const next = encodeURIComponent('/admin/login?mode=newpass');
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin/auth/callback?next=${next}` });
      if (error) throw error;
      setMsg({ text: 'If that email belongs to an administrator, a reset link is on its way. Check your inbox.', kind: 'success' });
    } catch (err) { setMsg({ text: friendlyAuth(err), kind: 'error' }); }
    setBusy(false);
  };

  const newPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p1 = String(fd.get('password') ?? '');
    const p2 = String(fd.get('password2') ?? '');
    if (p1.length < 8) return fail('new-password', 'Please use at least 8 characters.');
    if (p1 !== p2) return fail('new-password2', "The two passwords don't match.");
    setBusy(true);
    try {
      const { error } = await sb.auth.updateUser({ password: p1 });
      if (error) throw error;
      if (await isAdmin()) { window.location.replace('/admin'); return; }
      await sb.auth.signOut();
      show('login');
      setMsg({ text: 'Password saved. You can now sign in.', kind: 'success' });
    } catch (err) { setMsg({ text: friendlyAuth(err), kind: 'error' }); }
    setBusy(false);
  };

  const inv = (id: string) => (invalid === id ? true : undefined);
  return (
    <div className="auth-card">
      <div role="alert">
        {msg && (
          <div className={`alert alert-${msg.kind}`}>
            <Icon name={msg.kind === 'success' ? 'check' : msg.kind === 'info' ? 'info' : 'alert'} size="sm" />
            <span>{msg.text}</span>
          </div>
        )}
      </div>

      {mode === 'login' && (
        <form noValidate onSubmit={login}>
          <h2>Sign in</h2>
          <p className="lead">For church administrators only.</p>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" autoComplete="username" required aria-invalid={inv('email')} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={inv('password')} />
          </div>
          <button className="btn btn-navy btn-block" type="submit" disabled={busy}><Busy busy={busy} label="Signing in…">Sign in</Busy></button>
          <div className="auth-foot">
            <button className="link-btn" type="button" onClick={() => show('reset')}>Forgot your password?</button>
            <a href="/">← Back to website</a>
          </div>
        </form>
      )}

      {mode === 'reset' && (
        <form noValidate onSubmit={reset}>
          <h2>Reset your password</h2>
          <p className="lead">Enter your admin email address and we&apos;ll send you a link to choose a new password.</p>
          <div className="field">
            <label htmlFor="reset-email">Email address</label>
            <input id="reset-email" name="email" type="email" autoComplete="username" required aria-invalid={inv('reset-email')} />
          </div>
          <button className="btn btn-navy btn-block" type="submit" disabled={busy}><Busy busy={busy} label="Sending…">Send reset link</Busy></button>
          <div className="auth-foot">
            <button className="link-btn" type="button" onClick={() => show('login')}>← Back to sign in</button>
          </div>
        </form>
      )}

      {mode === 'newpass' && (
        <form noValidate onSubmit={newPassword}>
          <h2>Choose a new password</h2>
          <p className="lead">Use at least 8 characters.</p>
          <div className="field">
            <label htmlFor="new-password">New password</label>
            <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required aria-invalid={inv('new-password')} />
          </div>
          <div className="field">
            <label htmlFor="new-password2">Type it again</label>
            <input id="new-password2" name="password2" type="password" autoComplete="new-password" minLength={8} required aria-invalid={inv('new-password2')} />
          </div>
          <button className="btn btn-navy btn-block" type="submit" disabled={busy}><Busy busy={busy}>Save new password</Busy></button>
        </form>
      )}
    </div>
  );
}
