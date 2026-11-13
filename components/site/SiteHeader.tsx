'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';

const LINKS: [string, string][] = [
  ['#top', 'Home'], ['#about', 'About'], ['#services', 'Services'], ['#events', 'Events'],
  ['#ministries', 'Ministries'], ['#resources', 'Resources'], ['#give', 'Give'],
];

type Theme = 'light' | 'dark';

export function SiteHeader({ shortName }: { shortName: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [active, setActive] = useState('#top');
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Theme: the inline script in the layout applied the saved choice before paint
  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  }, []);
  const switchTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#ffffff' : '#0b1622');
    try { localStorage.setItem('npc-theme', next); } catch { /* storage blocked */ }
    setTheme(next);
  };

  // Solid header after scrolling
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mobile menu: body class for the scrim, Escape / outside click / wide screen close it
  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); } };
    const onClick = (e: MouseEvent) => { if (!(e.target as Element).closest('.site-header')) setOpen(false); };
    const wide = window.matchMedia('(min-width: 1101px)');
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

  // Scroll spy
  useEffect(() => {
    const targets = [...LINKS.map(([h]) => h), '#visit']
      .map((h) => (h === '#top' ? document.querySelector('.hero') : document.querySelector(h)))
      .filter((el): el is Element => !!el);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setActive(entry.target.classList.contains('hero') ? '#top' : `#${entry.target.id}`);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach((t) => spy.observe(t));
    return () => spy.disconnect();
  }, []);

  const label = `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`;
  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`} id="top">
      <div className="header-inner">
        <a href="#top" className="brand" aria-label={`${shortName}, home`}>
          <span className="logo-badge" aria-hidden="true" />
          <span className="brand-text">
            <strong>{shortName}</strong>
            <small>Quezon City</small>
          </span>
        </a>

        <nav className={`main-nav${open ? ' is-open' : ''}`} id="main-nav" aria-label="Main" onClick={(e) => { if ((e.target as Element).closest('a')) setOpen(false); }}>
          <ul>
            {LINKS.map(([href, text]) => (
              <li key={href}><a href={href} className={active === href ? 'is-active' : undefined}>{text}</a></li>
            ))}
            <li><a href="#visit" className={`nav-cta${active === '#visit' ? ' is-active' : ''}`}>Contact Us</a></li>
          </ul>
        </nav>

        <div className="header-actions">
          <button className="icon-btn theme-toggle" type="button" aria-label={label} title={label} onClick={switchTheme}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} />
          </button>
          <button
            ref={toggleRef}
            className="icon-btn nav-toggle"
            type="button"
            aria-controls="main-nav"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  );
}
