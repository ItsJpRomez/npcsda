import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { SetupNotice } from '@/components/admin/SetupNotice';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAdmin, getServerClient } from '@/lib/supabase/server';

/* Every Admin Panel page is rendered on demand, never cached. */
export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) return <SetupNotice />;
  const admin = await getAdmin();
  if (!admin) {
    const { data: { user } } = await (await getServerClient()).auth.getUser();
    redirect(user ? '/admin/login?denied=1' : '/admin/login');
  }
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
