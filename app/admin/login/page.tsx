import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/LoginForm';
import { SetupNotice } from '@/components/admin/SetupNotice';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAdmin } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Admin Sign In · NPC SDA Church' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!isSupabaseConfigured) return <SetupNotice />;
  const params = await searchParams;
  const mode = params.mode === 'newpass' ? 'newpass' : 'login';
  if (mode === 'login' && !('denied' in params) && (await getAdmin())) redirect('/admin');

  const notice =
    'denied' in params ? { text: 'This account does not have administrator access. Ask the church webmaster to add you.', kind: 'error' as const }
    : 'signedout' in params ? { text: 'You have been signed out.', kind: 'success' as const }
    : 'expired' in params ? { text: 'That link has expired. Please request a new one.', kind: 'error' as const }
    : null;

  return (
    <div className="auth-page">
      <aside className="auth-art">
        <a className="auth-brand" href="/"><span className="logo" aria-hidden="true" /> NPC SDA Church</a>
        <div className="art-copy">
          <h1>Church Website Admin Panel</h1>
          <p>Update events, photos, officers, ministries and church details. Changes appear on the website as soon as you save.</p>
        </div>
      </aside>
      <main className="auth-panel">
        <LoginForm initialMode={mode} notice={notice} />
      </main>
    </div>
  );
}
