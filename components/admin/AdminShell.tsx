'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';
import { Icon } from './Icon';
import { Modal, useUI } from './ui';

interface Route { href: string; title: string; label?: string; icon: string; group: string; desc?: string }

export const ROUTES: Route[] = [
  { href: '/admin', title: 'Dashboard', icon: 'dashboard', group: '' },
  { href: '/admin/church', title: 'Church information', icon: 'info', group: 'Church', desc: 'Address, contact info and map location' },
  { href: '/admin/schedule', title: 'Worship schedule', icon: 'clock', group: 'Church', desc: 'Sabbath School, Divine Service and midweek prayer' },
  { href: '/admin/history', title: 'Church history', icon: 'history', group: 'Church', desc: 'Our story and milestones' },
  { href: '/admin/officers', title: 'Church officers', icon: 'user', group: 'Church', desc: 'Names, roles and photos' },
  { href: '/admin/events', title: 'Events & news', icon: 'calendar-event', group: 'Content', desc: 'Events and announcements' },
  { href: '/admin/ministries', title: 'Ministries', icon: 'users', group: 'Content', desc: 'Ministry descriptions, leaders and schedules' },
  { href: '/admin/gallery', title: 'Photo gallery', icon: 'camera', group: 'Content', desc: 'Photos and albums' },
  { href: '/admin/verses', title: 'Hero verses', icon: 'quote', group: 'Content', desc: 'Bible verses that rotate on the home page' },
  { href: '/admin/resources', title: 'Spiritual resources', icon: 'book', group: 'Content', desc: 'Links to Bible study and devotionals' },
  { href: '/admin/fund', title: 'Building fund', icon: 'church', group: 'Giving', desc: 'Amount raised, goal and donation form link' },
  { href: '/admin/giving', title: 'Tithes & offerings', icon: 'gift', group: 'Giving', desc: 'GCash, bank details and giving form' },
];

const EVENT_SUBS = [
  { type: 'event', label: 'Events' },
  { type: 'announcement', label: 'Announcements' },
];

interface Attention { text: string; href: string }

/** Light / dark switch. Shared with the public site; app/layout.tsx applies it before paint. */
const toggleTheme = () => {
  const root = document.documentElement;
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('npc-theme', next); } catch { /* preference only */ }
};

/** First name(s) for the greeting: "John Paul Romez" → "John Paul", "Maria Santos" → "Maria". */
const firstName = (name: string) => {
  const w = name.trim().split(/\s+/).filter(Boolean);
  return w.length >= 3 ? w.slice(0, -1).join(' ') : w[0] ?? '';
};
const initials = (name: string, email: string) => {
  const w = name.trim().split(/\s+/).filter(Boolean);
  if (w.length >= 2) return (w[0][0] + w[w.length - 1][0]).toUpperCase();
  return (w[0]?.[0] ?? email[0] ?? 'A').toUpperCase();
};
const badgeText = (n: number) => (n > 9 ? '9+' : String(n));
const COLLAPSE_KEY = 'npc-admin-sidebar';

/** Floating sidebar + page header around every Admin Panel page (DESIGN_SYSTEM.md §3–5). */
export function AdminShell({ email, name, children }: { email: string; name: string; children: ReactNode }) {
  const ui = useUI();
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);          // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop icon rail
  const [eventsOpen, setEventsOpen] = useState(path === '/admin/events');
  const [upcoming, setUpcoming] = useState(0);
  const [attention, setAttention] = useState<Attention[]>([]);
  const [panel, setPanel] = useState<'search' | 'help' | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const view = useRef<HTMLElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const route = ROUTES.find((r) => r.href === path) ?? ROUTES[0];
  const eventType = path === '/admin/events' ? params.get('type') : null;

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1'); } catch { /* storage unavailable */ }
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* ignore */ }
      return !c;
    });
  };

  useEffect(() => {
    view.current?.focus({ preventScroll: true });
    setOpen(false);
    setBellOpen(false);
    if (path === '/admin/events') setEventsOpen(true);
  }, [path]);

  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!bellOpen) return;
    const onDown = (e: Event) => { if (!bellRef.current?.contains(e.target as Node)) setBellOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setBellOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [bellOpen]);

  // Badge count and "needs attention" items, refreshed on each page change.
  useEffect(() => {
    const sb = getBrowserClient();
    const head = (t: string) => sb.from(t).select('id', { count: 'exact', head: true });
    (async () => {
      try {
        const now = new Date().toISOString();
        const [up, fund, tiles, stale] = await Promise.all([
          head('events').eq('kind', 'event').in('status', ['upcoming', 'ongoing']),
          sb.from('building_fund').select('form_url').eq('id', 1).maybeSingle(),
          head('photos').is('image_url', null),
          head('events').eq('kind', 'event').in('status', ['upcoming', 'ongoing']).lt('ends_at', now),
        ]);
        setUpcoming(up.count ?? 0);
        const items: Attention[] = [];
        if (!fund.error && !(fund.data as { form_url?: string } | null)?.form_url) items.push({ text: 'Add your donation form link to the building fund.', href: '/admin/fund' });
        if (tiles.count) items.push({ text: `${tiles.count} gallery ${tiles.count === 1 ? 'tile still needs' : 'tiles still need'} a photo.`, href: '/admin/gallery' });
        if (stale.count) items.push({ text: `${stale.count} past ${stale.count === 1 ? 'event is' : 'events are'} still marked upcoming.`, href: '/admin/events?type=event' });
        setAttention(items);
      } catch { /* the badge and bell are optional */ }
    })();
  }, [path]);

  /** Ask before leaving a page with unsaved changes. */
  const guard = async (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === path || !ui.isDirty()) return;
    e.preventDefault();
    const leave = await ui.confirm({ title: 'Leave without saving?', body: "You have changes on this page that haven't been saved.", confirmLabel: 'Leave page', danger: false });
    if (leave) { ui.setDirty(false); router.push(href); }
  };
  const go = async (href: string) => {
    if (ui.isDirty() && !(await ui.confirm({ title: 'Leave without saving?', body: "You have changes on this page that haven't been saved.", confirmLabel: 'Leave page', danger: false }))) return;
    ui.setDirty(false);
    setPanel(null);
    setBellOpen(false);
    router.push(href);
  };

  const signOut = async () => {
    if (ui.isDirty() && !(await ui.confirm({ title: 'Sign out without saving?', body: "You have changes that haven't been saved.", confirmLabel: 'Sign out', danger: false }))) return;
    ui.setDirty(false);
    await getBrowserClient().auth.signOut();
    window.location.replace('/admin/login?signedout=1');
  };

  const groups = useMemo(() => {
    const out: { label: string; items: Route[] }[] = [];
    for (const r of ROUTES) {
      const last = out[out.length - 1];
      if (last && last.label === r.group) last.items.push(r); else out.push({ label: r.group, items: [r] });
    }
    return out;
  }, []);

  const heading = path === '/admin'
    ? (firstName(name) ? `Welcome back, ${firstName(name)}` : 'Welcome back')
    : route.title;

  return (
    <div className={`app${collapsed ? ' is-collapsed' : ''}`}>
      <aside className="sidebar" id="sidebar" aria-label="Admin sections">
        <div className="sb-brand">
          <Link className="sb-brand-link" href="/admin" onClick={(e) => guard(e, '/admin')}>
            <span className="logo" aria-hidden="true" />
            <span className="sb-brand-text"><strong>NPC SDA Church</strong><small>Admin panel</small></span>
          </Link>
          <button type="button" className="sb-collapse" onClick={toggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <Icon name="chevron-left" px={17} />
          </button>
          <button type="button" className="sb-close" onClick={() => setOpen(false)} aria-label="Close menu"><Icon name="x" px={18} /></button>
        </div>

        <nav className="nav" aria-label="Admin">
          {groups.map((g) => (
            <div className="nav-group" key={g.label || 'main'}>
              {g.label && <p className="nav-head">{g.label}</p>}
              {g.items.map((r) => {
                const active = r.href === path;
                const isEvents = r.href === '/admin/events';
                return (
                  <div key={r.href} className={`nav-entry${isEvents ? ' has-caret' : ''}`}>
                    <Link
                      href={r.href} className="nav-item" aria-current={active ? 'page' : undefined} title={collapsed ? r.title : undefined}
                      onClick={(e) => { if (isEvents) setEventsOpen(true); void guard(e, r.href); }}
                    >
                      <span className="nav-icon"><Icon name={r.icon} px={17} /></span>
                      <span className="nav-label">{r.title}</span>
                      {isEvents && upcoming > 0 && <span className="nav-badge" aria-label={`${upcoming} upcoming`}>{badgeText(upcoming)}</span>}
                    </Link>
                    {isEvents && (
                      <button
                        type="button" className={`nav-caret${eventsOpen ? ' is-open' : ''}${active ? ' on-active' : ''}`}
                        aria-label={eventsOpen ? 'Hide event types' : 'Show event types'} aria-expanded={eventsOpen}
                        onClick={() => setEventsOpen((o) => !o)}
                      >
                        <Icon name="chevron-down" px={16} />
                      </button>
                    )}
                    {isEvents && eventsOpen && (
                      <div className="subnav">
                        {EVENT_SUBS.map((s) => {
                          const href = `/admin/events?type=${s.type}`;
                          return (
                            <Link key={s.type} href={href} className="subnav-item" aria-current={eventType === s.type ? 'page' : undefined} onClick={(e) => guard(e, href)}>
                              {s.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sb-user">
          <span className="avatar" aria-hidden="true">{initials(name, email)}</span>
          <span className="sb-user-text">
            <strong>{name || 'Administrator'}</strong>
            <small title={email}>{email}</small>
          </span>
          <button type="button" className="sb-signout" onClick={signOut} aria-label="Sign out" title="Sign out"><Icon name="logout" px={18} /></button>
        </div>
      </aside>
      <div className="scrim" onClick={() => setOpen(false)} />

      <main className="main" ref={view} tabIndex={-1}>
        <header className="page-header">
          <div className="page-header-title">
            <button type="button" className="icon-btn menu-btn" aria-label="Open menu" aria-controls="sidebar" aria-expanded={open} onClick={() => setOpen(true)}>
              <Icon name="menu" />
            </button>
            <h1>{heading}</h1>
          </div>
          <div className="toolbar-top">
            <button type="button" className="icon-btn" aria-label="Find a section" title="Find a section" onClick={() => setPanel('search')}><Icon name="search" /></button>
            <button type="button" className="icon-btn" aria-label="Help" title="Help" onClick={() => setPanel('help')}><Icon name="help" /></button>
            <button type="button" className="icon-btn theme-btn" aria-label="Toggle dark mode" title="Toggle dark mode" onClick={toggleTheme}>
              <Icon name="moon" className="icon when-light" />
              <Icon name="sun" className="icon when-dark" />
            </button>
            <div className="bell" ref={bellRef}>
              <button type="button" className="icon-btn" aria-label={attention.length ? `${attention.length} things need attention` : 'Nothing needs attention'} aria-expanded={bellOpen} onClick={() => setBellOpen((o) => !o)}>
                <Icon name="bell" />
                {attention.length > 0 && <span className="bell-dot" aria-hidden="true" />}
              </button>
              {bellOpen && (
                <div className="popover" role="dialog" aria-label="Needs attention">
                  <p className="popover-title">Needs attention</p>
                  {attention.length ? (
                    <ul>
                      {attention.map((a) => (
                        <li key={a.href + a.text}><button type="button" onClick={() => go(a.href)}><span>{a.text}</span><Icon name="chevron" size="sm" /></button></li>
                      ))}
                    </ul>
                  ) : <p className="popover-empty">You&apos;re all caught up.</p>}
                </div>
              )}
            </div>
            <a className="btn btn-primary btn-view" href="/" target="_blank" rel="noopener"><Icon name="external" px={17} /> <span>View website</span></a>
          </div>
        </header>
        <div className="page-body">{children}</div>
      </main>

      <Modal open={panel === 'search'} onClose={() => setPanel(null)} small labelledBy="find-title">
        <SectionSearch onGo={go} onClose={() => setPanel(null)} />
      </Modal>
      <Modal open={panel === 'help'} onClose={() => setPanel(null)} small labelledBy="help-title">
        <div className="dlg-head"><h2 id="help-title">How the Admin Panel works</h2><button type="button" className="icon-btn" aria-label="Close" onClick={() => setPanel(null)}><Icon name="x" /></button></div>
        <div className="dlg-body help-body">
          <p>Everything you save here appears on the website right away. There&apos;s nothing else to publish.</p>
          <ul>
            <li>Use <strong>Visible</strong> to hide an item from the website without deleting it.</li>
            <li>Photos can be JPG, PNG or WebP, up to 5 MB each.</li>
            <li>Events leave the website on their own once their date has passed.</li>
            <li>Donations always go through your Google Form. The website never handles payments.</li>
          </ul>
          <p>Need another administrator account? Ask whoever manages the church&apos;s Supabase project to add one.</p>
        </div>
      </Modal>
    </div>
  );
}

/** "Find a section" dialog: type to filter, Enter to open the first match. */
function SectionSearch({ onGo, onClose }: { onGo: (href: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const hits = ROUTES.filter((r) => `${r.title} ${r.desc ?? ''} ${r.group}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <div className="dlg-head"><h2 id="find-title">Find a section</h2><button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="x" /></button></div>
      <div className="dlg-body">
        <div className="search">
          <Icon name="search" size="sm" />
          <input
            type="search" autoFocus placeholder="Try “photos” or “worship”" aria-label="Find a section" value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && hits[0]) onGo(hits[0].href); }}
          />
        </div>
        <ul className="find-list">
          {hits.map((r) => (
            <li key={r.href}>
              <button type="button" onClick={() => onGo(r.href)}>
                <span className="nav-icon"><Icon name={r.icon} px={17} /></span>
                <span className="find-text"><strong>{r.title}</strong>{r.desc && <span>{r.desc}</span>}</span>
              </button>
            </li>
          ))}
          {!hits.length && <li className="popover-empty">No section matches “{q}”.</li>}
        </ul>
      </div>
    </>
  );
}
