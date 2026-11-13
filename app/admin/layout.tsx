import type { Metadata } from 'next';
import { IconSprite } from '@/components/Icon';
import { AdminUIProvider } from '@/components/admin/ui';
import './admin.css';

export const metadata: Metadata = {
  title: 'Admin Panel · NPC SDA Church',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IconSprite />
      <AdminUIProvider>{children}</AdminUIProvider>
    </>
  );
}
