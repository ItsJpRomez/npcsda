'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fmtDate, peso } from '@/lib/format';
import { getBrowserClient } from '@/lib/supabase/browser';
import { friendly } from '@/lib/admin/api';
import type { BuildingFund } from '@/lib/types';
import { Icon } from '../Icon';
import { ErrorBox } from './ui';

interface Overview {
  upcoming: number; ministries: number; officers: number; photos: number;
  next: { title: string; starts_at: string }[];
  fund: BuildingFund | null;
}

const SECTION_COUNT = 10; // public sections the Admin Panel manages

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
        const [upcoming, ministries, officers, photos, events, fund] = await Promise.all([
          count(head('events').eq('kind', 'event').in('status', ['upcoming', 'ongoing'])),
          count(head('ministries')), count(head('officers')), count(head('photos')),
          sb.from('events').select('title,starts_at').eq('kind', 'event').neq('status', 'completed')
            .gte('starts_at', new Date(Date.now() - 864e5).toISOString()).order('starts_at').limit(4),
          sb.from('building_fund').select('*').eq('id', 1).maybeSingle(),
        ]);
        if (events.error) throw events.error;
        setData({ upcoming, ministries, officers, photos, next: events.data ?? [], fund: (fund.data as BuildingFund) ?? null });
      } catch (err) { setError(friendly(err)); }
    })();
  }, []);

  const intro = <p className="page-intro">Welcome! Choose what you&apos;d like to update. Everything you save appears on the website right away.</p>;
  if (error) return <>{intro}<ErrorBox>Couldn&apos;t load the overview. {error}</ErrorBox></>;
  if (!data) {
    return (
      <>
        {intro}
        <div className="stats">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 128 }} />)}</div>
      </>
    );
  }

  const f = data.fund;
  const pct = f && f.goal > 0 ? Math.min(100, Math.round((f.raised / f.goal) * 100)) : 0;
  const card = (href: string, icon: string, n: number, text: string) => (
    <Link className="stat" href={href}><Icon name={icon} /><span className="stat-num">{n}</span><span className="stat-label">{text}</span></Link>
  );
  return (
    <>
      {intro}
      <div className="stats">
        {card('/admin/events', 'calendar', data.upcoming, 'Upcoming events')}
        {card('/admin/ministries', 'users', data.ministries, 'Church ministries')}
        {card('/admin/officers', 'user', data.officers, 'Church officers')}
        {card('/admin/gallery', 'camera', data.photos, 'Gallery photos')}
        {card('/admin/church', 'grid', SECTION_COUNT, 'Website content sections')}
      </div>
      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head"><div><h2>What would you like to update?</h2></div></div>
          <div className="quick">
            <Link href="/admin/events"><Icon name="plus" /> Add an event or announcement</Link>
            <Link href="/admin/gallery"><Icon name="upload" /> Upload photos</Link>
            <Link href="/admin/fund"><Icon name="church" /> Update the building fund</Link>
            <Link href="/admin/officers"><Icon name="user" /> Change church officers</Link>
            <Link href="/admin/schedule"><Icon name="clock" /> Edit worship times</Link>
            <Link href="/admin/church"><Icon name="info" /> Edit church details</Link>
          </div>
        </section>
        <div>
          <section className="panel">
            <div className="panel-head"><div><h2>Coming up</h2></div><Link href="/admin/events" className="link-btn" style={{ textDecoration: 'none' }}>All events</Link></div>
            {data.next.length ? (
              <ul className="mini-list">
                {data.next.map((ev) => <li key={ev.title + ev.starts_at}><strong>{ev.title}</strong><span>{fmtDate(ev.starts_at, false)}</span></li>)}
              </ul>
            ) : <p className="help" style={{ margin: 0 }}>No upcoming events. <Link href="/admin/events">Add one</Link>.</p>}
          </section>
          <section className="panel">
            <div className="panel-head"><div><h2>Building fund</h2></div><Link href="/admin/fund" className="link-btn" style={{ textDecoration: 'none' }}>Update</Link></div>
            <p style={{ margin: 0 }}><strong style={{ fontSize: '1.4rem', color: 'var(--heading)' }}>{peso(f?.raised)}</strong> raised of {peso(f?.goal)}</p>
            <div className="progress" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
            <p className="help" style={{ margin: 0 }}>{pct}% reached{!f?.form_url && <> · <strong>No donation form link yet</strong></>}</p>
          </section>
        </div>
      </div>
    </>
  );
}
