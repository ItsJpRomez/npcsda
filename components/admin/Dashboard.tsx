'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DAYS, MANILA_OFFSET_MS, peso } from '@/lib/format';
import { findNextService } from '@/lib/schedule';
import { getBrowserClient } from '@/lib/supabase/browser';
import { friendly } from '@/lib/admin/api';
import type { BuildingFund, Service } from '@/lib/types';
import { Icon } from './Icon';
import { ErrorBox } from './ui';

interface Overview {
  upcoming: number; ministries: number; officers: number; photos: number;
  next: { title: string; starts_at: string }[];
  services: Service[];
  fund: BuildingFund | null;
}

const SECTION_COUNT = 10; // public sections the Admin Panel manages
const DAY_MS = 864e5;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A moment as a Manila calendar date (the UTC fields hold Manila values). */
const manila = (t: number | string) => new Date(new Date(t).getTime() + MANILA_OFFSET_MS);
const dayNumber = (t: number | string) => Math.floor((new Date(t).getTime() + MANILA_OFFSET_MS) / DAY_MS);
const relDays = (t: number | string) => {
  const d = dayNumber(t) - dayNumber(Date.now());
  return d <= 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`;
};
const greeting = () => {
  const h = manila(Date.now()).getUTCHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const STATS = [
  { key: 'upcoming', href: '/admin/events?type=event', label: 'Upcoming events', icon: 'calendar', hue: 'blue' },
  { key: 'ministries', href: '/admin/ministries', label: 'Ministries', icon: 'users', hue: 'amber' },
  { key: 'officers', href: '/admin/officers', label: 'Church officers', icon: 'user', hue: 'purple' },
  { key: 'photos', href: '/admin/gallery', label: 'Gallery photos', icon: 'camera', hue: 'rose' },
  { key: 'sections', href: '/admin/church', label: 'Website sections', icon: 'grid', hue: 'green' },
] as const;

const TASKS = [
  { href: '/admin/events', title: 'Add an event or announcement', desc: 'Post to the Events page and homepage.', icon: 'calendar-plus', hue: 'blue' },
  { href: '/admin/gallery', title: 'Upload photos', desc: 'Add pictures from a recent service to the gallery.', icon: 'photo-up', hue: 'orange' },
  { href: '/admin/fund', title: 'Update the building fund', desc: 'Record new giving and adjust the goal.', icon: 'church', hue: 'green' },
  { href: '/admin/officers', title: 'Change church officers', desc: 'Edit names, roles and photos.', icon: 'user-edit', hue: 'purple' },
  { href: '/admin/schedule', title: 'Edit worship times', desc: 'Sabbath School, Divine Service and midweek prayer.', icon: 'clock', hue: 'teal' },
  { href: '/admin/church', title: 'Edit church details', desc: 'Address, contact info and map location.', icon: 'info', hue: 'rose' },
];

export function Dashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = getBrowserClient();
    const head = (table: string) => sb.from(table).select('id', { count: 'exact', head: true });
    const count = async (q: PromiseLike<{ count: number | null; error: unknown }>) => {
      const { count: n, error: e } = await q;
      if (e) throw e;
      return n ?? 0;
    };
    (async () => {
      try {
        const [upcoming, ministries, officers, photos, events, services, fund] = await Promise.all([
          count(head('events').eq('kind', 'event').in('status', ['upcoming', 'ongoing'])),
          count(head('ministries')), count(head('officers')), count(head('photos')),
          sb.from('events').select('title,starts_at').eq('kind', 'event').neq('status', 'completed')
            .gte('starts_at', new Date(Date.now() - DAY_MS).toISOString()).order('starts_at').limit(3),
          sb.from('services').select('*').eq('published', true).order('sort_order'),
          sb.from('building_fund').select('*').eq('id', 1).maybeSingle(),
        ]);
        if (events.error) throw events.error;
        setData({
          upcoming, ministries, officers, photos,
          next: events.data ?? [],
          services: (services.data as Service[]) ?? [],
          fund: (fund.data as BuildingFund) ?? null,
        });
      } catch (err) { setError(friendly(err)); }
    })();
  }, []);

  if (error) return <ErrorBox>Couldn&apos;t load the overview. {error}</ErrorBox>;
  if (!data) {
    return (
      <div className="dash" aria-busy="true">
        <div className="skeleton" style={{ height: 230 }} />
        <div className="stat-grid">{STATS.map((s) => <div key={s.key} className="skeleton" style={{ height: 92 }} />)}</div>
      </div>
    );
  }

  const values: Record<(typeof STATS)[number]['key'], number> = {
    upcoming: data.upcoming, ministries: data.ministries, officers: data.officers, photos: data.photos, sections: SECTION_COUNT,
  };
  const f = data.fund;
  const goal = Number(f?.goal ?? 0);
  const raised = Number(f?.raised ?? 0);
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const next = findNextService(data.services);
  const nextDay = next ? next.service.day_of_week : -1;
  const isToday = next ? (next.live != null || dayNumber(next.startsAt) === dayNumber(Date.now())) : false;
  const shown = next?.live ?? next?.service;

  return (
    <div className="dash">
      {/* §6 Next service */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="hero-intro">{greeting()}. Everything you save here appears on the website right away.</p>
          <h2 id="hero-title">{shown ? `${next?.live ? 'Now' : 'Next'}: ${shown.name}` : 'No worship times yet'}</h2>
          {next && (
            <p className="hero-time">
              <span>{next.live ? `${DAYS[next.live.day_of_week]} · ${next.when.split(' · ')[1]}` : next.when}</span>
              {isToday && <span className="tag tag-hero">Today</span>}
            </p>
          )}
          <Link className="btn btn-ghost-dark" href="/admin/schedule"><Icon name="clock" px={17} /> Edit worship times</Link>
        </div>
        <ol className="day-tracker" aria-label="Day of the next service">
          {DAYS.map((d, i) => (
            <li key={d} className={i === nextDay ? 'is-active' : undefined} aria-current={i === nextDay ? 'date' : undefined}>
              <span>{d.slice(0, 3)}</span>
              <i aria-hidden="true" />
            </li>
          ))}
        </ol>
      </section>

      {/* §7 Stat cards */}
      <div className="stat-grid">
        {STATS.map((s) => (
          <Link key={s.key} href={s.href} className="stat-card">
            <span className="stat-text"><span className="stat-label">{s.label}</span><span className="stat-num">{values[s.key]}</span></span>
            <span className={`stat-icon tint-${s.hue}`}><Icon name={s.icon} px={20} /></span>
          </Link>
        ))}
      </div>

      {/* §8 Two columns */}
      <div className="columns">
        <section className="card col-main">
          <div className="card-head"><div><h2>What would you like to update?</h2><p>Common tasks for keeping the website current.</p></div></div>
          <ul className="action-list">
            {TASKS.map((t) => (
              <li key={t.title}>
                <Link href={t.href} className="action-row">
                  <span className={`icon-tile tint-${t.hue}`}><Icon name={t.icon} px={20} /></span>
                  <span className="row-text"><strong>{t.title}</strong><span>{t.desc}</span></span>
                  <Icon name="chevron" px={18} className="icon row-chevron" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="col-side">
          <section className="card">
            <div className="card-head"><div><h2>Coming up</h2></div><Link href="/admin/events?type=event" className="card-link">View all <Icon name="chevron" px={16} /></Link></div>
            {data.next.length ? (
              <ul className="event-list">
                {data.next.map((ev) => {
                  const d = manila(ev.starts_at);
                  return (
                    <li key={ev.title + ev.starts_at} className="event-row">
                      <span className="date-tile" aria-hidden="true"><span>{MONTHS[d.getUTCMonth()]}</span><strong>{d.getUTCDate()}</strong></span>
                      <span className="row-text"><strong>{ev.title}</strong><span>{DAYS[d.getUTCDay()]}, {MONTHS[d.getUTCMonth()]} {d.getUTCDate()}, {d.getUTCFullYear()}</span></span>
                      <span className="row-meta">{relDays(ev.starts_at)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="card-body card-empty">No upcoming events yet. <Link href="/admin/events">Add one</Link> so visitors know what&apos;s happening.</p>
            )}
          </section>

          <section className="card">
            <div className="card-head"><div><h2>Building fund</h2></div><Link href="/admin/fund" className="card-link">Update <Icon name="chevron" px={16} /></Link></div>
            <div className="card-body fund">
              <div className="fund-figure"><strong>{peso(raised)}</strong><span>raised of {peso(goal)} goal</span></div>
              <div className="progress-wrap">
                <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Building fund progress"><span style={{ width: `${pct}%` }} /></div>
                <div className="progress-caps"><span>{pct}% reached</span>{goal > raised && <span>{peso(goal - raised)} to go</span>}</div>
              </div>
              {!f?.form_url && (
                <div className="callout">
                  <span className="callout-icon"><Icon name="link" px={17} /></span>
                  <span className="callout-text">No donation form link yet</span>
                  <Link href="/admin/fund">Add link</Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
