'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';
import { Icon } from '../Icon';
import { useUI } from './ui';

export const ROUTES = [
  { href: '/admin', title: 'Dashboard', icon: 'grid', group: '' },
  { href: '/admin/church', title: 'Church information', icon: 'info', group: 'Church' },
  { href: '/admin/schedule', title: 'Worship schedule', icon: 'clock', group: 'Church' },
  { href: '/admin/history', title: 'Church history', icon: 'history', group: 'Church' },
  { href: '/admin/officers', title: 'Church officers', icon: 'user', group: 'Church' },
  { href: '/admin/events', title: 'Events & announcements', icon: 'calendar', group: 'Content' },
  { href: '/admin/ministries', title: 'Ministries', icon: 'users', group: 'Content' },
  { href: '/admin/gallery', title: 'Photo gallery', icon: 'camera', group: 'Content' },
  { href: '/admin/resources', title: 'Spiritual resources', icon: 'book', group: 'Content' },
  { href: '/admin/fund', title: 'Building fund', icon: 'church', group: 'Giving' },
  { href: '/admin/giving', title: 'Tithes & offerings', icon: 'gift', group: 'Giving' },
];

/** Sidebar + top bar around every Admin Panel page. */
export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const ui = useUI();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const view = useRef<HTMLElement>(null);
  const route = ROUTES.find((r) => r.href === path) ?? ROUTES[0];

  useEffect(() => {
    view.current?.focus({ preventScroll: true });
    setOpen(false);
  }, [route.title]);

  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  /** Ask before leaving a page with unsaved changes. */
  const guard = async (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === path || !ui.isDirty()) return;
    e.preventDefault();
    const leave = await ui.confirm({ title: 'Leave without saving?', body: "You have changes on this page that haven't been saved.", confirmLabel: 'Leave page', danger: false });
    if (leave) { ui.setDirty(false); router.push(href); }
  };

  const signOut = async () => {
    if (ui.isDirty() && !(await ui.confirm({ title: 'Sign out without saving?', body: "You have changes that haven't been saved.", confirmLabel: 'Sign out', danger: false }))) return;
    ui.setDirty(false);
    await getBrowserClient().auth.signOut();
    window.location.replace('/admin/login?signedout=1');
  };

  let group = '';
  return (
    <div className="app">
      <aside className="sidebar" id="sidebar" aria-label="Admin sections">
        <Link className="sb-brand" href="/admin" onClick={(e) => guard(e, '/admin')}>
          <span className="logo" aria-hidden="true" />
          <span><strong>NPC SDA Church</strong><small>Admin Panel</small></span>
        </Link>
        <nav className="nav" aria-label="Admin">
          {ROUTES.map((r) => {
            const head = r.group && r.group !== group ? <p className="nav-group">{r.group}</p> : null;
            group = r.group;
            return (
              <div key={r.href} style={{ display: 'contents' }}>
                {head}
                <Link href={r.href} aria-current={r.href === path ? 'page' : undefined} onClick={(e) => guard(e, r.href)}>
                  <Icon name={r.icon} /><span>{r.title}</span>
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="sb-foot">
          <p className="sb-user">Signed in as<br /><strong style={{ color: '#fff' }}>{email}</strong></p>
          <a href="/" target="_blank" rel="noopener"><Icon name="external" /><span>View website</span></a>
          <button type="button" onClick={signOut}><Icon name="logout" /><span>Sign out</span></button>
        </div>
      </aside>
      <div className="scrim" onClick={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" aria-label="Open menu" aria-controls="sidebar" aria-expanded={open} onClick={() => setOpen(true)}>
            <Icon name="menu" />
          </button>
          <h1>{route.title}</h1>
          <span className="spacer" />
          <a className="btn btn-light" href="/" target="_blank" rel="noopener"><Icon name="external" size="sm" /> <span>View website</span></a>
        </header>
        <main className="view" ref={view} tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
