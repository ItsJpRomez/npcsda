'use client';

/* Small interactive pieces of the public page. */

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { DAYS, MANILA_OFFSET_MS, timeRange } from '@/lib/format';
import { findNextService } from '@/lib/schedule';
import type { Service } from '@/lib/types';
import { Icon } from '../Icon';

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

const manilaDay = (t: number) => Math.floor((t + MANILA_OFFSET_MS) / 864e5);
const pad = (n: number) => String(n).padStart(2, '0');

/** "Next service" bar under the hero: name, Today tag, live countdown, address. */
export function NextServiceBar({ services, address, directions }: { services: Service[]; address: string; directions: string }) {
  const now = useNow(1000);
  const info = now ? findNextService(services, now) : null;
  const sv = info ? (info.live ?? info.service) : null;
  const today = !!(info && now && (info.live || manilaDay(info.startsAt) === manilaDay(now)));
  let s = info && now ? Math.max(0, Math.floor((info.startsAt - now) / 1000)) : 0;
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const parts: [string, string][] = now && info && !info.live
    ? [[pad(d), 'Days'], [pad(h), 'Hours'], [pad(Math.floor(s / 60)), 'Mins'], [pad(s % 60), 'Secs']]
    : [['--', 'Days'], ['--', 'Hours'], ['--', 'Mins'], ['--', 'Secs']];
  const when = info ? (info.live ? `Happening now · ${timeRange(info.live.start_time, info.live.end_time)}` : `${today ? 'Today' : DAYS[info.service.day_of_week]} · ${timeRange(info.service.start_time, info.service.end_time)}`) : '';

  return (
    <div className="next-bar">
      <div className="nb-next">
        <span className="nb-icon"><Icon name="calendar-time" px={24} /></span>
        <div className="nb-text">
          <span className="nb-label">{info?.live ? 'Happening now' : 'Next service'}</span>
          <span className="nb-name">
            <strong>{sv ? sv.name : services.length ? 'Loading…' : 'See service times'}</strong>
            {today && <span className="tag tag-blue">Today</span>}
          </span>
          {when && <span className="nb-when">{when}</span>}
        </div>
      </div>
      {services.length > 0 && !info?.live && (
        <div className="countdown" role="timer" aria-live="off" aria-label={info ? `Next service, ${info.service.name}, ${info.when}` : 'Countdown to the next service'}>
          {parts.map(([v, l]) => (
            <div className="cd-box" key={l}><span className="cd-num">{v}</span><span className="cd-label">{l}</span></div>
          ))}
        </div>
      )}
      {address && (
        <div className="nb-place">
          <Icon name="pin" />
          <div>
            <p>{address}</p>
            {directions && <a href={directions} target="_blank" rel="noopener">Get directions <Icon name="arrow-up-right" px={16} /></a>}
          </div>
        </div>
      )}
    </div>
  );
}

const WEEK_TINTS = ['purple', 'blue', 'teal', 'amber', 'green', 'rose'];

/** Worship & service times: Sabbath card + weekday cards, with "Next up" / "Happening now". */
export function ServiceTimes({ services }: { services: Service[] }) {
  const now = useNow(60 * 1000);
  const info = now ? findNextService(services, now) : null;
  const target = info ? (info.live ?? info.service) : null;
  const badge = (sv: Service) => (sv === target ? <span className="pill-badge">{info?.live ? 'Happening now' : 'Next up'}</span> : null);

  const sabbath = services.filter((x) => x.day_of_week === 6);
  const week = services.filter((x) => x.day_of_week !== 6);
  return (
    <div className="services-grid">
      <article className="card sabbath-card">
        <div className="card-head">
          <span className="icon-tile tint-amber"><Icon name="sun" px={22} /></span>
          <div><h3>Every Sabbath</h3><p>Saturday at NPC SDA Church</p></div>
        </div>
        <ol className="sabbath-list">
          {sabbath.length ? sabbath.map((sv) => (
            <li key={sv.id} className={sv === target ? 'is-next' : undefined}>
              <span className="sl-time">{timeRange(sv.start_time, sv.end_time)}</span>
              <span className="sl-name"><strong>{sv.name}</strong>{sv.is_main && <span>Main worship service</span>}</span>
              {badge(sv)}
            </li>
          )) : <li><span className="sl-name"><span>The Sabbath schedule is coming soon.</span></span></li>}
        </ol>
      </article>

      <div className="week-col">
        {week.length > 0 && <p className="col-label">During the week</p>}
        {week.map((sv, i) => (
          <article key={sv.id} className="week-card">
            <span className={`day-tile tint-${WEEK_TINTS[i % WEEK_TINTS.length]}`} aria-hidden="true">{DAYS[sv.day_of_week].slice(0, 3).toUpperCase()}</span>
            <div className="wc-text"><h3>{sv.name}</h3><p>{DAYS[sv.day_of_week]} · {timeRange(sv.start_time, sv.end_time)}</p></div>
            {badge(sv)}
          </article>
        ))}
        <a className="plan-link" href="#visit">
          <span className="pl-icon"><Icon name="map-2" /></span>
          <span className="pl-text"><strong>Planning your first visit?</strong><span>See directions and what to expect</span></span>
          <Icon name="arrow" px={18} className="icon pl-go" />
        </a>
      </div>
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
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable: the number is still visible */ }
  };
  return (
    <button className={`copy-btn${copied ? ' is-copied' : ''}`} type="button" aria-label={copied ? 'Copied' : label} onClick={copy}>
      <Icon name={copied ? 'check' : 'copy'} px={15} />{copied ? 'Copied' : 'Copy'}
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
    const subject = `${priv ? '[Private] ' : ''}Prayer request from ${name}`;
    const body = `${request.trim()}\n\n— ${name}\n${priv ? 'Please keep this private (pastor only).' : 'OK to share with the prayer team.'}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <form className="prayer-form" noValidate onSubmit={submit}>
      <label className="field">
        <span className="field-label">Your name <span className="opt">(optional)</span></span>
        <input name="name" type="text" autoComplete="name" placeholder="e.g. Maria" />
      </label>
      <label className="field">
        <span className="field-label">Prayer request</span>
        <textarea
          ref={reqRef}
          name="request"
          rows={5}
          required
          placeholder="Share what's on your heart"
          aria-describedby="pr-request-err"
          aria-invalid={invalid}
          value={request}
          onChange={(e) => { setRequest(e.target.value); if (invalid && e.target.value.trim()) setInvalid(false); }}
        />
        <span className="field-error" id="pr-request-err" hidden={!invalid}>Please write your prayer request.</span>
      </label>
      <label className="check">
        <input type="checkbox" name="private" defaultChecked />
        <span className="check-box" aria-hidden="true"><Icon name="check" px={14} /></span>
        <span>Keep this private: pastor only, don&apos;t share with the prayer team</span>
      </label>
      <button type="submit" className="btn btn-primary btn-lg btn-glow btn-block"><Icon name="send" px={18} />Send prayer request</button>
      <p className="form-note">Your request opens in your email app, addressed to our church inbox. Only our pastor and prayer team will see it.</p>
      {sent && <p className="form-status" role="status">Your email app should open with your request ready to send. We&apos;ll be praying with you.</p>}
    </form>
  );
}
