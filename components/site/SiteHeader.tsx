'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';

const LINKS: [string, string][] = [
  ['home', 'Home'], ['about', 'About'], ['services', 'Services'], ['events', 'Events'],
  ['ministries', 'Ministries'], ['resources', 'Resources'], ['gallery', 'Gallery'],
];

/** Sticky glass header: brand, section links with scroll spy, Give + Visit us. */
export function SiteHeader({ shortName }: { shortName: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('home');
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Mobile menu: Escape / outside click / growing to desktop width close it
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); } };
    const onClick = (e: MouseEvent) => { if (!(e.target as Element).closest('.site-header')) setOpen(false); };
    const wide = window.matchMedia('(min-width: 1100px)');
    const onWide = (m: MediaQueryListEvent) => { if (m.matches) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    wide.addEventListener('change', onWide);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
      wide.removeEventListener('change', onWide);
    };
  }, [open]);

  // Scroll spy: highlight the section in the middle of the screen
  useEffect(() => {
    const ids = [...LINKS.map(([id]) => id), 'fund', 'give', 'officers', 'visit'];
    const targets = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach((t) => spy.observe(t));
    return () => spy.disconnect();
  }, []);

  // Light / dark: the inline script in app/layout.tsx sets data-theme before paint
  const toggleTheme = () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('npc-theme', next); } catch { /* preference only */ }
  };

  const links = LINKS.map(([id, label]) => (
    <a key={id} href={`#${id}`} className="nav-link" aria-current={active === id ? 'true' : undefined} onClick={() => setOpen(false)}>{label}</a>
  ));

  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="#home" className="brand" aria-label={`${shortName}, home`}>
          <span className="logo-badge" aria-hidden="true" />
          <span className="brand-text"><strong>{shortName}</strong><small>Quezon City</small></span>
        </a>

        <nav className="main-nav" aria-label="Main">{links}</nav>

        <div className="header-actions">
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle dark mode">
            <Icon name="moon" px={18} className="icon when-light" />
            <Icon name="sun" px={18} className="icon when-dark" />
          </button>
          <a href="#give" className="btn btn-soft btn-md give-btn"><Icon name="heart-handshake" px={17} />Give</a>
          <a href="#visit" className="btn btn-primary btn-md btn-glow">Visit us</a>
          <button
            ref={toggleRef}
            className="menu-toggle"
            type="button"
            aria-controls="mobile-nav"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav" id="mobile-nav" aria-label="Main">
          {links}
          <a href="#give" className="nav-link nav-give" onClick={() => setOpen(false)}><Icon name="heart-handshake" />Give</a>
        </nav>
      )}
    </header>
  );
}
