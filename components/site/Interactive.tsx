'use client';

/* Small interactive pieces of the public page. */

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { DAYS, timeRange } from '@/lib/format';
import { findNextService } from '@/lib/schedule';
import type { Service } from '@/lib/types';
import { Icon } from '../Icon';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fades sections in as they scroll into view (also picks up elements added later). */
export function RevealObserver() {
  useEffect(() => {
    const all = () => document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)');
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      all().forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const siblings = [...(el.parentElement?.children ?? [])].filter((c) => c.classList.contains('reveal'));
        el.style.transitionDelay = Math.min(Math.max(0, siblings.indexOf(el)) * 60, 360) + 'ms';
        el.classList.add('is-visible');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    const observe = () => all().forEach((el) => io.observe(el));
    observe();
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
  return null;
}

/** Ticks every `ms` so components can re-check the time. Starts at null on the server. */
function useNow(ms: number): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** "Next service scheduled in" countdown in the hero. */
export function Countdown({ services }: { services: Service[] }) {
  const now = useNow(1000);
  const info = now ? findNextService(services, now) : null;
  let s = info && now ? Math.max(0, Math.floor((info.startsAt - now) / 1000)) : 0;
  const days = Math.floor(s / 86400); s %= 86400;
  const hours = Math.floor(s / 3600); s %= 3600;
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  const label = !info ? 'See service times' : info.live ? `Happening now: ${info.live.name}` : `${info.service.name} · ${info.when}`;
  return (
    <>
      <div className="hb-next">
        <p className="hb-label">Next service scheduled in</p>
        <p className="countdown-event">
          <a href="#services"><span className="cd-event-name">{label}</span> <Icon name="arrow" size="sm" /></a>
        </p>
      </div>
      <div className="countdown" role="timer" aria-live="off" aria-label={info ? `Next service, ${info.service.name}, ${info.when}` : undefined}>
        {([['days', days], ['hours', hours], ['minutes', minutes], ['seconds', seconds]] as const).map(([unit, v]) => (
          <div className="cd-box" key={unit}>
            <span className="cd-num" data-unit={unit}>{v}</span>
            <span className="cd-label">{unit[0].toUpperCase() + unit.slice(1)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/** Worship & Service Times cards with "Happening now" / "Next up" badges. */
export function ServiceCards({ services }: { services: Service[] }) {
  const now = useNow(60 * 1000);
  const info = now ? findNextService(services, now) : null;
  const target = info ? (info.live ?? info.service) : null;
  const badge = (sv: Service) => {
    if (sv !== target) return null;
    return <span className="service-badge">{info?.live ? 'Happening now' : 'Next up'}</span>;
  };
  const state = (sv: Service) => (sv === target ? (info?.live ? ' is-now' : ' is-next') : '');

  const sabbath = services.filter((s) => s.day_of_week === 6);
  const week = services.filter((s) => s.day_of_week !== 6);
  return (
    <div className="services-layout">
      <article className="sabbath-panel reveal">
        <div className="sabbath-head">
          <span className="sabbath-icon"><Icon name="sun" /></span>
          <div>
            <h3>Every Sabbath</h3>
            <p>Saturday at NPC SDA Church</p>
          </div>
        </div>
        <ol className="sabbath-list" role="list">
          {sabbath.length ? sabbath.map((sv) => (
            <li key={sv.id} className={`service-card sabbath-item${sv.is_main ? ' is-main' : ''}${state(sv)}`}>
              <p className="service-time">{timeRange(sv.start_time, sv.end_time)}</p>
              <div className="si-body">
                <h4>{sv.name}</h4>
                <p className="service-day">Saturday</p>
              </div>
              {badge(sv)}
            </li>
          )) : (
            <li className="sabbath-item"><p className="service-time">Schedule coming soon</p></li>
          )}
        </ol>
      </article>

      <div className="weekday-col">
        {week.length > 0 && <p className="col-label reveal">During the week</p>}
        {week.map((sv) => (
          <article key={sv.id} className={`service-card weekday-card reveal${state(sv)}`}>
            <span className="wd-day" aria-hidden="true">{DAYS[sv.day_of_week].slice(0, 3)}</span>
            <div>
              <h4>{sv.name}</h4>
              <p className="service-day">{DAYS[sv.day_of_week]}</p>
              <p className="service-time">{timeRange(sv.start_time, sv.end_time)}</p>
            </div>
            {badge(sv)}
          </article>
        ))}
        <a className="plan-link reveal" href="#visit">
          <Icon name="map" />
          <span><strong>Planning your first visit?</strong> See directions and what to expect</span>
          <Icon name="arrow" size="sm" />
        </a>
      </div>
    </div>
  );
}

/** Building fund progress bar that fills when it scrolls into view. */
export function FundProgress({ raised, goal }: { raised: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const bar = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) { setShown(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.4 });
    if (bar.current) io.observe(bar.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={bar} className="fund-bar" role="progressbar" aria-label="Building fund progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <span style={{ width: shown ? `${pct}%` : '0%' }} />
    </div>
  );
}

/** Copies an account number to the clipboard. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable: the number is still visible */ }
  };
  return (
    <button className={`copy-btn${copied ? ' copied' : ''}`} type="button" aria-label={copied ? 'Copied!' : label} onClick={copy}>
      <Icon name="copy" size="sm" />
    </button>
  );
}

/** Prayer request form: opens the visitor's email app addressed to the church. */
export function PrayerForm({ email }: { email: string }) {
  const [request, setRequest] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [sent, setSent] = useState(false);
  const reqRef = useRef<HTMLTextAreaElement>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!request.trim()) { setInvalid(true); reqRef.current?.focus(); return; }
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim() || 'Anonymous';
    const priv = (form.elements.namedItem('private') as HTMLInputElement).checked;
    const subject = `Prayer request${priv ? ' (private)' : ''} from ${name}`;
    const body = `${request.trim()}\n\n— ${name}\n${priv ? 'Please keep this request private (pastor only).' : 'OK to share with the prayer team.'}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <form className="prayer-form" id="prayer-form" noValidate onSubmit={submit}>
      <div className="field">
        <label htmlFor="pr-name">Your name <span className="opt">(optional)</span></label>
        <input id="pr-name" name="name" type="text" autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="pr-request">Prayer request</label>
        <textarea
          ref={reqRef}
          id="pr-request"
          name="request"
          rows={5}
          required
          aria-describedby="pr-request-err"
          aria-invalid={invalid}
          value={request}
          onChange={(e) => { setRequest(e.target.value); if (invalid && e.target.value.trim()) setInvalid(false); }}
          onBlur={() => { if (request) setInvalid(!request.trim()); }}
        />
        <p className="field-error" id="pr-request-err" hidden={!invalid}>Please write your prayer request.</p>
      </div>
      <label className="check">
        <input type="checkbox" name="private" defaultChecked />
        <span>Keep this private: pastor only, don&apos;t share with the prayer team</span>
      </label>
      <button type="submit" className="btn btn-primary btn-block">
        <Icon name="send" size="sm" /> Send prayer request
      </button>
      <p className="form-note">Your request opens in your email app, addressed to our church inbox. Only our pastor and prayer team will see it.</p>
      {sent && <p className="form-status" role="status">Your email app should open with your request ready to send. Thank you. We will be praying with you.</p>}
    </form>
  );
}
