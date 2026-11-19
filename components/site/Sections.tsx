/* The public page, section by section. Server components: they render to plain
   HTML, with small client components (Interactive.tsx, Gallery.tsx) where needed. */
import type { CSSProperties, ReactNode } from 'react';
import {
  DAYS, fmtPhone, isExternal, manila, manilaHM, mapsEmbed, mapsUrl, mediaSrc, paragraphs, safeUrl, sameManilaDay, telHref, timeLabel, timeRange, initials,
} from '@/lib/format';
import type { ChurchEvent, Officer, SiteContent } from '@/lib/types';
import { Icon } from '../Icon';
import { CopyButton, NextServiceBar, PrayerForm, ServiceTimes } from './Interactive';
import { EventPhotos } from './EventPhotos';
import { Gallery } from './Gallery';
import { RotatingVerse } from './RotatingVerse';
import { Photo, Placeholder } from './Media';

/** <a> that opens external links in a new tab. */
function A({ href, className, children, label }: { href: string; className?: string; children: ReactNode; label?: string }) {
  return isExternal(href)
    ? <a href={href} className={className} target="_blank" rel="noopener" aria-label={label}>{children}</a>
    : <a href={href} className={className} aria-label={label}>{children}</a>;
}

/** Pastel tint for a hue (the design's oklch(0.96 0.03 H) / oklch(0.55 0.14 H) pairs). */
const tint = (h: number) => ({ '--h': h } as CSSProperties);
const hueOf = (text: string, hues = [255, 160, 295, 10, 70, 210]) =>
  hues[[...text].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) >>> 0, 7) % hues.length];

function SectionHead({ eyebrow, title, id, lead, center, action }: { eyebrow: string; title: string; id: string; lead?: ReactNode; center?: boolean; action?: ReactNode }) {
  return (
    <header className={`section-head${center ? ' is-center' : ''}${action ? ' has-action' : ''}`}>
      <div className="sh-text">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
        {lead && <p className="lead">{lead}</p>}
      </div>
      {action}
    </header>
  );
}

const contact = (info: SiteContent['info']) => {
  const fb = safeUrl(info.facebook_url);
  const q = info.map_query || info.address || '';
  return {
    fb,
    fbHandle: fb.replace(/^https?:\/\/(www\.)?facebook\.com\//i, '').replace(/\/+$/, ''),
    directions: q ? mapsUrl(q) : '',
    mapEmbed: q ? mapsEmbed(q) : '',
  };
};

/* ---------------- Hero ---------------- */
export function Hero({ c }: { c: SiteContent }) {
  const { info } = c;
  const { fb } = contact(info);
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="hero-pill"><span className="dot" aria-hidden="true" />Welcome to the</span>
          <h1 id="hero-title">{info.name}</h1>
          <RotatingVerse verses={c.verses} />
          <div className="hero-cta">
            <a href="#services" className="btn btn-primary btn-xl btn-glow">Join us this Sabbath <Icon name="arrow" px={18} /></a>
            {fb && <a href={fb} className="btn btn-soft btn-xl" target="_blank" rel="noopener"><Icon name="play" px={18} />Watch on Facebook</a>}
          </div>
        </div>
        <div className="hero-media">
          <div className="hero-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/church.jpg" alt={`${info.name} building`} width={720} height={540} fetchPriority="high" />
            {/* Night view fades in over the day photo in dark mode */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/church-night.jpg" alt="" aria-hidden="true" className="photo-night" width={1200} height={900} decoding="async" />
          </div>
          {info.founded_year && (
            <div className="since-card">
              <span className="icon-tile" style={tint(255)}><Icon name="church" px={22} /></span>
              <span><strong>Since {info.founded_year}</strong><span>Serving Napocor Village &amp; Pasong Tamo</span></span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Next service + service times ---------------- */
export function Services({ c }: { c: SiteContent }) {
  const { directions } = contact(c.info);
  return (
    <section className="section section-soft services" id="services" aria-labelledby="services-title">
      <div className="container stack-72">
        <NextServiceBar services={c.services} address={c.info.address ?? ''} directions={directions} />
        <div className="stack-40">
          <SectionHead eyebrow="Worship with us" id="services-title" title="Worship & service times"
            lead={<>Everyone is welcome. Come as you are — you&apos;ll find a warm seat and a friendly face.</>} />
          <ServiceTimes services={c.services} />
        </div>
      </div>
    </section>
  );
}

/* ---------------- Who we are + identity + history ---------------- */
const IDENTITY = [
  { title: 'Seventh-day', desc: 'We keep the Bible Sabbath, from Friday sunset to Saturday sunset, as a day of rest and worship.', icon: 'sun', h: 70 },
  { title: 'Adventist', desc: 'We joyfully await the Second Coming (the “advent”) of Jesus Christ.', icon: 'sparkle', h: 255 },
  { title: 'Whole-person faith', desc: 'We believe God cares for body, mind, and spirit, so we value health, education, and service.', icon: 'heart', h: 10 },
  { title: 'Worldwide family', desc: 'We belong to a global church of more than 22 million members in over 200 countries.', icon: 'world', h: 160 },
];

export function About({ c }: { c: SiteContent }) {
  const { info, ministries, milestones } = c;
  const intro = paragraphs(info.intro);
  const story = paragraphs(info.history);
  const stats = [
    info.founded_year ? [String(info.founded_year), 'Founded'] : null,
    info.member_count ? [info.member_count, 'Members'] : null,
    [String(ministries.length), 'Ministries'],
  ].filter((x): x is string[] => !!x);
  return (
    <section className="section" id="about" aria-labelledby="about-title">
      <div className="container stack-48">
        <div className="split">
          <div className="photo-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/church.jpg" alt="Our church building in Napocor Village" loading="lazy" width={720} height={540} />
          </div>
          <div className="stack-24">
            <div className="sh-text">
              <p className="eyebrow">Who we are</p>
              <h2 id="about-title" className="balance">{info.about_heading || 'Who we are'}</h2>
            </div>
            {intro.length > 0 && <div className="prose">{intro.map((p, i) => <p key={i}>{p}</p>)}</div>}
            {(info.mission || info.vision) && (
              <div className="mv-grid">
                {info.mission && <div className="mv-item"><h3><Icon name="target" px={19} />Our mission</h3><p>{info.mission}</p></div>}
                {info.vision && <div className="mv-item"><h3><Icon name="eye" px={19} />Our vision</h3><p>{info.vision}</p></div>}
              </div>
            )}
            <dl className="about-stats">
              {stats.map(([v, l]) => <div key={l}><dd>{v}</dd><dt>{l}</dt></div>)}
            </dl>
          </div>
        </div>

        <div className="card card-lg identity">
          <div className="identity-head">
            <h3>Seventh-day Adventist identity</h3>
            <a href="https://www.adventist.org/beliefs/" className="btn btn-soft btn-md" target="_blank" rel="noopener">Learn more about our beliefs <Icon name="arrow-up-right" px={16} /></a>
          </div>
          <ul className="identity-grid">
            {IDENTITY.map((i) => (
              <li key={i.title}>
                <span className="icon-tile" style={tint(i.h)}><Icon name={i.icon} px={21} /></span>
                <strong>{i.title}</strong>
                <span>{i.desc}</span>
              </li>
            ))}
          </ul>
        </div>

        {(story.length > 0 || milestones.length > 0) && (
          <div className="card card-lg history">
            <div className="history-head">
              <span className="icon-tile" style={tint(10)}><Icon name="history" px={21} /></span>
              <h3>Our story</h3>
            </div>
            {story.length > 0 && <div className="prose">{story.map((p, i) => <p key={i}>{p}</p>)}</div>}
            {milestones.length > 0 && (
              <ol className="timeline">
                {milestones.map((m) => (
                  <li key={m.id}>
                    <span className="tl-year">{m.year ?? ''}</span>
                    <div className="tl-body">
                      {m.image_url && <figure className="tl-photo"><Photo src={m.image_url} alt={m.title} /></figure>}
                      <strong>{m.title}</strong>
                      {m.description && <p>{m.description}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Events & announcements ---------------- */
/** All photos of an event, cover first (older rows only have image_url). */
const photosOf = (ev: ChurchEvent): string[] => (ev.images?.length ? ev.images : ev.image_url ? [ev.image_url] : []);

function eventDates(ev: ChurchEvent) {
  if (!ev.starts_at) return { date: '', time: ev.schedule_note || '' };
  const s = ev.starts_at;
  const e = ev.ends_at;
  const multi = !!(e && !sameManilaDay(s, e));
  let date: string;
  if (e && multi) {
    const sm = manila(s, { month: 'short' });
    const em = manila(e, { month: 'short' });
    date = sm === em
      ? `${sm} ${manila(s, { day: 'numeric' })} – ${manila(e, { day: 'numeric' })}`
      : `${manila(s, { month: 'short', day: 'numeric' })} – ${manila(e, { month: 'short', day: 'numeric' })}`;
  } else {
    date = manila(s, { weekday: 'long', month: 'short', day: 'numeric' });
  }
  const time = ev.schedule_note || (e && !multi ? timeRange(manilaHM(s), manilaHM(e)) : timeLabel(manilaHM(s)));
  return { date, time };
}

export function Events({ c, now }: { c: SiteContent; now: number }) {
  const { fb, fbHandle } = contact(c.info);
  // Hide completed items, and events that ended more than 12 hours ago
  const visible = c.events.filter((ev) => {
    if (ev.status === 'completed') return false;
    const last = ev.ends_at || ev.starts_at;
    return !last || Date.parse(last) + 12 * 3600e3 > now;
  });
  const events = visible
    .filter((ev) => ev.kind !== 'announcement')
    .sort((a, b) => (a.starts_at ? Date.parse(a.starts_at) : Infinity) - (b.starts_at ? Date.parse(b.starts_at) : Infinity))
    .slice(0, 8);
  const notes = visible.filter((ev) => ev.kind === 'announcement');

  return (
    <section className="section section-soft" id="events" aria-labelledby="events-title">
      <div className="container stack-40">
        <SectionHead eyebrow="What's happening" id="events-title" title="Events & announcements"
          action={fb ? <a className="text-link" href={fb} target="_blank" rel="noopener">Follow updates on Facebook <Icon name="chevron" px={17} /></a> : undefined} />
        <div className="events-grid">
          <div className="card">
            <div className="card-head between"><h3>Upcoming events</h3><span className="muted">{events.length} upcoming</span></div>
            {events.length ? (
              <ul className="event-list">
                {events.map((ev) => {
                  const d = eventDates(ev);
                  const link = safeUrl(ev.link_url);
                  return (
                    <li key={ev.id} className={`event-row${ev.is_featured ? ' is-featured' : ''}`}>
                      <div className="date-badge" aria-hidden="true">
                        {ev.starts_at
                          ? <><span>{manila(ev.starts_at, { month: 'short' }).toUpperCase()}</span><strong>{manila(ev.starts_at, { day: '2-digit' })}</strong></>
                          : <Icon name="calendar" px={22} />}
                      </div>
                      <div className="event-body">
                        {(ev.category || ev.is_featured) && (
                          <div className="event-tags">
                            {ev.category && <span className="tag-pill" style={tint(hueOf(ev.category))}>{ev.category}</span>}
                            {ev.is_featured && <span className="featured">Featured</span>}
                          </div>
                        )}
                        <h4>{ev.title}</h4>
                        {(d.date || d.time || ev.location) && (
                          <ul className="event-meta">
                            {d.date && <li><Icon name="calendar" px={15} />{d.date}</li>}
                            {d.time && <li><Icon name="clock" px={15} />{d.time}</li>}
                            {ev.location && <li><Icon name="pin" px={15} />{ev.location}</li>}
                          </ul>
                        )}
                        {ev.description && <p>{ev.description}</p>}
                        <EventPhotos images={photosOf(ev)} title={ev.title} />
                        {link && <A href={link} className="text-link sm">More details <Icon name={isExternal(link) ? 'arrow-up-right' : 'arrow'} px={16} /></A>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="card-empty">No upcoming events right now. Check back soon{fb ? ', or follow our Facebook page for the latest news' : ''}.</p>
            )}
          </div>

          <div className="stack-16">
            {notes.map((n) => {
              const u = safeUrl(n.link_url);
              return (
                <aside className="card note-card" aria-label="Announcement" key={n.id}>
                  <div className="note-head">
                    <span className="icon-tile sm" style={tint(55)}><Icon name="megaphone" /></span>
                    <strong>{n.category || 'Announcement'}</strong>
                  </div>
                  <h4>{n.title}</h4>
                  {n.description && <p>{n.description}</p>}
                  <EventPhotos images={photosOf(n)} title={n.title} />
                  {u && <A href={u} className="text-link sm">Learn more <Icon name="chevron" px={16} /></A>}
                </aside>
              );
            })}
            {fb && (
              <a href={fb} className="fb-card" target="_blank" rel="noopener">
                <span className="fb-icon"><Icon name="facebook" /></span>
                <strong>Never miss an update</strong>
                <span>Live streams, reminders and photos are posted on our Facebook page first.</span>
                <span className="fb-follow">Follow {fbHandle} <Icon name="arrow" px={16} /></span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Ministries ---------------- */
const MINISTRY_HUES = [255, 160, 70, 10, 295, 145, 210, 45];

export function Ministries({ c }: { c: SiteContent }) {
  return (
    <section className="section" id="ministries" aria-labelledby="ministries-title">
      <div className="container stack-44">
        <SectionHead center eyebrow="Get involved" id="ministries-title" title="Our ministries" lead="There's a place for every age and every gift." />
        {c.ministries.length ? (
          <ul className="ministry-grid">
            {c.ministries.map((m, i) => (
              <li key={m.id} className={`card ministry${m.image_url ? ' has-photo' : ''}`}>
                {m.image_url && <div className="ministry-photo"><Photo src={m.image_url} alt="" /></div>}
                <div className="ministry-body">
                  <span className="icon-tile lg" style={tint(MINISTRY_HUES[i % MINISTRY_HUES.length])}><Icon name={m.icon || 'users'} px={23} /></span>
                  <div className="stack-6">
                    <h3>{m.name}</h3>
                    {m.description && <p>{m.description}</p>}
                  </div>
                  {(m.leader || m.schedule) && (
                    <ul className="ministry-meta">
                      {m.leader && <li><Icon name="user" px={15} />{m.leader}</li>}
                      {m.schedule && <li><Icon name="clock" px={15} />{m.schedule}</li>}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="empty-note">Ministry information is coming soon.</p>}
      </div>
    </section>
  );
}

/* ---------------- Spiritual resources + prayer request ---------------- */
const RES: Record<string, [string, number]> = {
  bible: ['book', 255], sabbath_school: ['users', 210], devotional: ['sun', 70],
  sermon: ['play', 295], study: ['book', 160], prayer: ['heart', 10],
};

export function Resources({ c }: { c: SiteContent }) {
  return (
    <section className="section section-soft" id="resources" aria-labelledby="resources-title">
      <div className="container split split-top">
        <div className="stack-32">
          <SectionHead eyebrow="Grow in faith" id="resources-title" title="Spiritual resources"
            lead="Tools for daily Bible study, Sabbath School preparation, and devotional life." />
          {c.resources.length ? (
            <ul className="card link-list">
              {c.resources.map((r) => {
                const [icon, h] = RES[r.category] ?? RES.study;
                const u = safeUrl(r.url) || '#prayer';
                return (
                  <li key={r.id}>
                    <A href={u} className="link-row">
                      {r.image_url
                        ? <span className="icon-tile cover"><Photo src={r.image_url} alt="" /></span>
                        : <span className="icon-tile" style={tint(h)}><Icon name={icon} px={21} /></span>}
                      <span className="lr-text"><strong>{r.title}</strong>{r.description && <span>{r.description}</span>}</span>
                      <Icon name={isExternal(u) ? 'external' : 'arrow'} px={18} className="icon lr-go" />
                    </A>
                  </li>
                );
              })}
            </ul>
          ) : <p className="empty-note">Resources are coming soon.</p>}
        </div>

        {c.info.email && (
          <div className="card card-lg prayer" id="prayer">
            <div className="stack-14">
              <span className="icon-tile lg" style={tint(10)}><Icon name="heart" px={23} /></span>
              <h3>Send us a prayer request</h3>
              <p className="verse">“The effectual fervent prayer of a righteous man availeth much.” <cite>— James 5:16</cite></p>
            </div>
            <PrayerForm email={c.info.email} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Building fund ---------------- */
export function BuildingFund({ c }: { c: SiteContent }) {
  const f = c.fund;
  const raised = Number(f.raised) || 0;
  const goal = Number(f.goal) || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const peso = (n: number) => '₱' + n.toLocaleString('en-PH', { maximumFractionDigits: 2 });
  const form = safeUrl(f.form_url);
  return (
    <section className="section" id="fund" aria-labelledby="fund-title">
      <div className="container split">
        <figure className="photo-frame fund-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaSrc(f.image_url) || '/assets/church.jpg'} alt={f.image_caption || f.title || 'Church building project'} loading="lazy" width={720} height={540} />
          {f.image_caption && <figcaption><Icon name="camera" px={16} />{f.image_caption}</figcaption>}
        </figure>

        <div className="stack-24">
          <div className="sh-text">
            <p className="eyebrow">Arise and build</p>
            <h2 id="fund-title">{f.title || 'Church building fund'}</h2>
            {f.description && <p className="lead">{f.description}</p>}
          </div>
          <div className="card fund-card">
            <div className="fund-top">
              <div><span className="muted">Raised so far</span><strong className="fund-raised">{peso(raised)}</strong></div>
              <span className="pct-pill">{pct}%</span>
            </div>
            <div className="fund-bar" role="progressbar" aria-label="Building fund progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><span style={{ width: `${pct}%` }} /></div>
            <dl className="fund-stats">
              <div><dt>Goal</dt><dd>{peso(goal)}</dd></div>
              <div><dt>Still needed</dt><dd>{peso(Math.max(0, goal - raised))}</dd></div>
            </dl>
            <p className="verse">“Except the LORD build the house, they labour in vain that build it.” <cite>— Psalm 127:1</cite></p>
            <div className="btn-row">
              {/* Donations go only through the church's Google Form (Admin Panel → Building fund). */}
              {form && isExternal(form)
                ? <a href={form} className="btn btn-primary btn-lg" target="_blank" rel="noopener"><Icon name="gift" px={18} />Donate now</a>
                : <a href="#give" className="btn btn-primary btn-lg"><Icon name="gift" px={18} />Donate now</a>}
              <a href="#give" className="btn btn-soft btn-lg">Other ways to give</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Tithes & offerings ---------------- */
const GIVE_HUES = [255, 160, 70, 295, 10];

export function Giving({ c }: { c: SiteContent }) {
  const form = safeUrl(c.giving.form_url);
  return (
    <section className="section section-soft" id="give" aria-labelledby="give-title">
      <div className="container split split-top">
        <div className="stack-24">
          <div className="sh-text">
            <p className="eyebrow">Faithful giving</p>
            <h2 id="give-title">Tithes &amp; offerings</h2>
          </div>
          <blockquote className="card verse-card">
            <p>“Bring ye all the tithes into the storehouse… and prove me now herewith, saith the LORD of hosts.”</p>
            <cite>Malachi 3:10</cite>
          </blockquote>
          {c.giving.note && <p className="give-note">{c.giving.note}</p>}
          {form && isExternal(form) && (
            <a className="btn btn-primary btn-lg give-online" href={form} target="_blank" rel="noopener"><Icon name="external" px={18} />{c.giving.form_label || 'Give online'}</a>
          )}
        </div>
        <div className="stack-14">
          {c.givingMethods.map((m, i) => {
            const fields: [string, string, boolean][] = [];
            if (m.bank_name) fields.push(['Bank', m.bank_name, false]);
            if (m.account_name) fields.push(['Account name', m.account_name, false]);
            if (m.account_number) fields.push([m.bank_name ? 'Account no.' : 'Number', m.account_number, true]);
            return (
              <article className="card give-card" key={m.id}>
                <span className="icon-tile" style={tint(GIVE_HUES[i % GIVE_HUES.length])}><Icon name={m.icon || 'gift'} px={22} /></span>
                <div className="give-body">
                  <h3>{m.title}</h3>
                  {m.note && <p>{m.note}</p>}
                  {fields.length > 0 && (
                    <dl className="give-fields">
                      {fields.map(([label, value, copy]) => (
                        <div key={label}>
                          <span className="gf-text"><dt>{label}</dt><dd>{value}</dd></span>
                          {copy && <CopyButton value={value.replace(/\s/g, '')} label={`Copy ${m.title} ${label.toLowerCase()}`} />}
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Gallery ---------------- */
export function GallerySection({ c }: { c: SiteContent }) {
  const { fb } = contact(c.info);
  return (
    <section className="section" id="gallery" aria-labelledby="gallery-title">
      <div className="container stack-32">
        <SectionHead eyebrow="Church life" id="gallery-title" title="Photo gallery"
          action={fb ? <a href={`${fb.replace(/\/+$/, '')}/photos`} className="text-link" target="_blank" rel="noopener">More photos on Facebook <Icon name="chevron" px={17} /></a> : undefined} />
        <Gallery albums={c.albums} photos={c.photos} />
      </div>
    </section>
  );
}

/* ---------------- Officers ---------------- */
const OFFICER_HUES = [255, 295, 160, 210, 10, 70, 55];

/** Officer portrait with an out-of-bounds effect: the photo fills a tinted frame
    and the head (an oval around the top of the photo) breaks out above its top edge.
    Cut-out PNGs rise out whole; regular photos pop out as a soft oval.
    With no photo yet, a silhouette with initials does the same. */
function PopOutPortrait({ o, hue }: { o: Officer; hue: number }) {
  // PNGs are treated as background-removed cut-outs: the whole figure rises out of the frame
  if (o.image_url && /\.png(\?|$)/i.test(o.image_url)) {
    return (
      <figure className="oob is-cutout" style={tint(hue)}>
        <span className="oob-frame" />
        <span className="oob-cut"><Photo src={o.image_url} alt="" /></span>
      </figure>
    );
  }
  return (
    <figure className="oob" style={tint(hue)}>
      <span className="oob-frame">{o.image_url && <Photo src={o.image_url} alt="" />}</span>
      {o.image_url ? (
        <span className="oob-pop" aria-hidden="true"><Photo src={o.image_url} alt="" /></span>
      ) : (
        <svg className="oob-sil" viewBox="0 0 100 125" aria-hidden="true">
          <path className="sil-body" d="M12 125C12 84 29 60 50 60s38 24 38 65Z" />
          <circle className="sil-head" cx="50" cy="26" r="19" />
          <text x="50" y="26" textAnchor="middle" dominantBaseline="central">{initials(o.full_name, o.position)}</text>
        </svg>
      )}
    </figure>
  );
}

export function Officers({ c }: { c: SiteContent }) {
  const feat = c.officers.find((o) => o.is_featured);
  const rest = c.officers.filter((o) => o !== feat);
  return (
    <section className="section section-soft" id="officers" aria-labelledby="officers-title">
      <div className="container stack-48">
        <SectionHead center eyebrow="Leadership" id="officers-title" title="Meet our church officers" />
        {feat && (
          <article className="pastor-card">
            <PopOutPortrait o={feat} hue={255} />
            <div className="pastor-body">
              <span className="tag-pill blue">{feat.position}</span>
              <h3>{feat.full_name || 'To be announced'}</h3>
              {feat.bio && <p>{feat.bio}</p>}
              {c.info.email && <a className="btn btn-soft btn-md" href={`mailto:${c.info.email}`}><Icon name="mail" px={17} />Email the church</a>}
            </div>
          </article>
        )}
        {rest.length > 0 && (
          <ul className="officer-grid">
            {rest.map((o, i) => (
              <li className="officer" key={o.id}>
                <PopOutPortrait o={o} hue={OFFICER_HUES[i % OFFICER_HUES.length]} />
                <div className="officer-info">
                  <strong>{o.full_name || 'To be announced'}</strong>
                  <span>{o.position}</span>
                  {o.bio && <p>{o.bio}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {!c.officers.length && <p className="empty-note">Officer information is coming soon.</p>}
      </div>
    </section>
  );
}

/* ---------------- Visit us ---------------- */
export function Visit({ c }: { c: SiteContent }) {
  const { info, services } = c;
  const { fb, fbHandle, directions, mapEmbed } = contact(info);
  const schedule = [...services].sort((a, b) => ((a.day_of_week + 4) % 7) - ((b.day_of_week + 4) % 7) || a.start_time.localeCompare(b.start_time));
  const contacts = [
    info.address && { label: 'Address', value: info.address, icon: 'pin', href: directions, h: 255 },
    info.phone && { label: 'Phone', value: fmtPhone(info.phone), icon: 'phone', href: telHref(info.phone), h: 160 },
    fb && { label: 'Facebook', value: fbHandle, icon: 'facebook', href: fb, h: 230 },
    info.email && { label: 'Email', value: info.email, icon: 'mail', href: `mailto:${info.email}`, h: 10 },
  ].filter((x): x is { label: string; value: string; icon: string; href: string; h: number } => !!x);
  return (
    <section className="section" id="visit" aria-labelledby="visit-title">
      <div className="container split split-stretch">
        <div className="stack-24">
          <div className="sh-text"><p className="eyebrow">We&apos;d love to meet you</p><h2 id="visit-title">Visit us</h2></div>
          {contacts.length > 0 && (
            <ul className="card link-list">
              {contacts.map((ct) => (
                <li key={ct.label}>
                  <A href={ct.href || '#visit'} className="link-row compact">
                    <span className="icon-tile sm" style={tint(ct.h)}><Icon name={ct.icon} /></span>
                    <span className="lr-text"><span className="lr-label">{ct.label}</span><strong>{ct.value}</strong></span>
                  </A>
                </li>
              ))}
            </ul>
          )}
          {schedule.length > 0 && (
            <div className="soft-card">
              <h3><Icon name="clock" px={19} />Worship schedule</h3>
              <ul className="schedule">
                {schedule.map((sv) => <li key={sv.id}><strong>{sv.name}</strong><span>{DAYS[sv.day_of_week].slice(0, 3)} · {timeRange(sv.start_time, sv.end_time)}</span></li>)}
              </ul>
            </div>
          )}
          <p className="first-time"><Icon name="sparkle" /><span><b>First time?</b> Arrive by 8:30 AM on Saturday for Sabbath School. Our greeters will help you find a seat, and you&apos;re welcome to stay for fellowship lunch.</span></p>
          {directions && <a className="btn btn-primary btn-xl btn-glow self-start" href={directions} target="_blank" rel="noopener"><Icon name="map-2" px={18} />Get directions</a>}
        </div>
        {mapEmbed && (
          <div className="map">
            <iframe title={`Map showing ${info.name}, ${info.address ?? ''}`} src={mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
export function Footer({ c, year }: { c: SiteContent; year: number }) {
  const { info } = c;
  const { fb } = contact(info);
  const cols: [string, [string, string][]][] = [
    ['Explore', [['services', 'Service times'], ['about', 'About us'], ['events', 'Events'], ['ministries', 'Ministries'], ['resources', 'Resources']]],
    ['Get involved', [['fund', 'Building fund'], ['give', 'Tithes & offerings'], ['prayer', 'Prayer request'], ['gallery', 'Gallery'], ['officers', 'Church officers']]],
  ];
  return (
    <footer className="site-footer">
      <div className="container stack-44">
        <div className="footer-grid">
          <div className="stack-16">
            <a href="#home" className="brand">
              <span className="logo-badge" aria-hidden="true" />
              <span className="brand-text"><strong>{info.short_name || info.name}</strong><small>Napocor Village, Quezon City</small></span>
            </a>
            <p className="verse">“Come unto me, all ye that labour and are heavy laden, and I will give you rest.” <cite>— Matthew 11:28</cite></p>
            <div className="socials">
              {fb && <a href={fb} target="_blank" rel="noopener" aria-label="Facebook"><Icon name="facebook" px={18} /></a>}
              {info.email && <a href={`mailto:${info.email}`} aria-label="Email"><Icon name="mail" px={18} /></a>}
              {info.phone && <a href={telHref(info.phone)} aria-label="Call"><Icon name="phone" px={18} /></a>}
            </div>
          </div>
          {cols.map(([title, links]) => (
            <nav key={title} aria-label={title} className="f-col">
              <h2>{title}</h2>
              {links.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
            </nav>
          ))}
          <div className="f-col">
            <h2>Contact</h2>
            {info.address && <p className="f-contact"><Icon name="pin" px={17} />{info.address}</p>}
            {info.phone && <a className="f-contact" href={telHref(info.phone)}><Icon name="phone" px={17} />{fmtPhone(info.phone)}</a>}
            {info.email && <a className="f-contact" href={`mailto:${info.email}`}><Icon name="mail" px={17} />{info.email}</a>}
          </div>
        </div>
        <div className="copyright">
          <p>© {year} {info.name} · Pasong Tamo, Quezon City, Philippines</p>
          <a href="#home" className="btn btn-outline btn-sm">Back to top <Icon name="arrow-up" px={15} /></a>
        </div>
      </div>
    </footer>
  );
}
