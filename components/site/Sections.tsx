/* The public page, section by section. Server components: they render to plain
   HTML, with small client components (Interactive.tsx, Gallery.tsx) where needed. */
import type { ReactNode } from 'react';
import {
  DAYS, fmtPhone, isExternal, manila, manilaHM, mapsEmbed, mapsUrl, mediaSrc, paragraphs, safeUrl, sameManilaDay, telHref, timeLabel, timeRange, initials,
} from '@/lib/format';
import type { ChurchEvent, SiteContent } from '@/lib/types';
import { Icon } from '../Icon';
import { Countdown, CopyButton, FundProgress, PrayerForm, ServiceCards } from './Interactive';
import { Gallery } from './Gallery';
import { Photo, Placeholder } from './Media';

/** <a> that opens external links in a new tab. */
function Link({ href, className, children, label }: { href: string; className?: string; children: ReactNode; label?: string }) {
  return isExternal(href)
    ? <a href={href} className={className} target="_blank" rel="noopener" aria-label={label}>{children}</a>
    : <a href={href} className={className} aria-label={label}>{children}</a>;
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

/* ---------------- Hero + countdown ---------------- */
export function Hero({ c }: { c: SiteContent }) {
  const { info, services } = c;
  const { fb, directions } = contact(info);
  const [before, after] = info.name.includes('Seventh-day') ? info.name.split('Seventh-day') : [info.name, null];
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-media" aria-hidden="true">
          {/* Swap for a high-resolution photo of the church (at least 1920px wide) for the sharpest result */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/church.jpg" alt="" width={720} height={540} fetchPriority="high" />
        </div>
        <div className="container hero-content">
          <p className="hero-kicker"><span className="kicker-line" aria-hidden="true" />Welcome to the</p>
          <h1 id="hero-title">
            {after === null ? info.name : <>{before}<span className="nowrap">Seventh-day</span>{after}</>}
          </h1>
          <blockquote className="hero-verse">
            <p>«But grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ. To him be glory both now and for ever. Amen.»</p>
            <cite>2 Peter 3:18</cite>
          </blockquote>
          <div className="hero-cta">
            <a href="#visit" className="btn btn-primary btn-lg">Join us this Sabbath <Icon name="arrow" size="sm" /></a>
            {fb && (
              <a href={fb} className="btn btn-glass btn-lg" target="_blank" rel="noopener">
                <Icon name="play" size="sm" /> Watch on Facebook
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="container hero-bar-wrap">
        <div className="hero-bar" id="countdown">
          <Countdown services={services} />
          <div className="hb-place">
            <Icon name="pin" />
            <p>
              {info.address}
              {directions && <><br /><a href={directions} target="_blank" rel="noopener">Get directions</a></>}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- Service times ---------------- */
export function Services({ c }: { c: SiteContent }) {
  return (
    <section className="section" id="services" aria-labelledby="services-title">
      <div className="container">
        <header className="split-head reveal">
          <div>
            <p className="eyebrow">Worship with us</p>
            <h2 id="services-title">Worship &amp; Service Times</h2>
          </div>
          <p className="lead">Everyone is welcome. Come as you are. You&apos;ll find a warm seat and a friendly face.</p>
        </header>
        <ServiceCards services={c.services} />
      </div>
    </section>
  );
}

/* ---------------- Who we are + history ---------------- */
export function About({ c }: { c: SiteContent }) {
  const { info, ministries, milestones } = c;
  const intro = paragraphs(info.intro);
  const story = paragraphs(info.history);
  return (
    <section className="section section-alt" id="about" aria-labelledby="about-title">
      <div className="container about-grid">
        <div className="about-media reveal">
          <figure className="about-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/church.jpg" alt="The NPC Seventh-day Adventist Church building: a white two-story sanctuary with tall stained-glass windows" loading="lazy" width={720} height={540} />
          </figure>
          {info.founded_year && (
            <div className="about-badge">
              <span className="ab-year">{info.founded_year}</span>
              <span className="ab-text">Serving Napocor Village<br />&amp; Pasong Tamo</span>
            </div>
          )}
        </div>

        <div className="about-copy">
          <p className="eyebrow reveal">Who we are</p>
          <h2 id="about-title" className="reveal">{info.about_heading || 'Who we are'}</h2>
          {intro.length > 0 && <div className="about-intro reveal">{intro.map((p, i) => <p key={i}>{p}</p>)}</div>}

          {(info.mission || info.vision) && (
            <div className="mv-grid reveal">
              {info.mission && <div className="mv-item"><h3>Our Mission</h3><p>{info.mission}</p></div>}
              {info.vision && <div className="mv-item"><h3>Our Vision</h3><p>{info.vision}</p></div>}
            </div>
          )}

          <dl className="stats reveal">
            {info.founded_year && <div><dt>Founded</dt><dd>{info.founded_year}</dd></div>}
            {info.member_count && <div><dt>Members</dt><dd>{info.member_count}</dd></div>}
            <div><dt>Ministries</dt><dd>{ministries.length}</dd></div>
          </dl>
        </div>
      </div>

      <div className="container">
        <div className="identity reveal">
          <h3 className="identity-title">Seventh-day Adventist identity</h3>
          <ul className="identity-list" role="list">
            <li><Icon name="sun" /><strong>Seventh-day</strong> We keep the Bible Sabbath, from Friday sunset to Saturday sunset, as a day of rest and worship.</li>
            <li><Icon name="sparkle" /><strong>Adventist</strong> We joyfully await the Second Coming (the &quot;advent&quot;) of Jesus Christ.</li>
            <li><Icon name="heart" /><strong>Whole-person faith</strong> We believe God cares for body, mind, and spirit, so we value health, education, and service.</li>
            <li><Icon name="users" /><strong>Worldwide family</strong> We belong to a global church of more than 22 million members in over 200 countries.</li>
          </ul>
          <a href="https://www.adventist.org/beliefs/" className="btn btn-outline" target="_blank" rel="noopener">
            Learn more about our beliefs <Icon name="external" size="sm" />
          </a>
        </div>

        {(story.length > 0 || milestones.length > 0) && (
          <div className="history reveal">
            <div className="history-head">
              <p className="eyebrow">Our story</p>
              <h3 className="history-title">Church history</h3>
              {story.length > 0 && <div className="history-text">{story.map((p, i) => <p key={i}>{p}</p>)}</div>}
            </div>
            {milestones.length > 0 && (
              <ol className="timeline" role="list">
                {milestones.map((m) => (
                  <li className="tl-item" key={m.id}>
                    <span className="tl-year">{m.year ?? ''}</span>
                    <div className="tl-body">
                      {m.image_url && <figure className="tl-photo"><Photo src={m.image_url} alt={m.title} /></figure>}
                      <h4>{m.title}</h4>
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
function eventDates(ev: ChurchEvent) {
  if (!ev.starts_at) return { date: '', time: ev.schedule_note || '', multi: false };
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
    date = manila(s, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  const time = ev.schedule_note || (e && !multi ? timeRange(manilaHM(s), manilaHM(e)) : timeLabel(manilaHM(s)));
  return { date, time, multi };
}

function DateChip({ ev, className }: { ev: ChurchEvent; className: string }) {
  if (!ev.starts_at) return className === 'event-date' ? <div className="event-date"><Icon name="calendar" /></div> : null;
  return (
    <div className={className}>
      <span>{manila(ev.starts_at, { day: '2-digit' })}</span>
      <small>{manila(ev.starts_at, { month: 'short' })}</small>
    </div>
  );
}

function EventLink({ ev }: { ev: ChurchEvent }) {
  const u = safeUrl(ev.link_url);
  if (!u) return null;
  return <Link href={u} className="event-link">More details <Icon name={isExternal(u) ? 'external' : 'arrow'} size="sm" /></Link>;
}

export function Events({ c, now }: { c: SiteContent; now: number }) {
  const { fb } = contact(c.info);
  // Hide completed items, and events that ended more than 12 hours ago
  const visible = c.events.filter((ev) => {
    if (ev.status === 'completed') return false;
    const last = ev.ends_at || ev.starts_at;
    return !last || Date.parse(last) + 12 * 3600e3 > now;
  });
  const events = visible
    .filter((ev) => ev.kind !== 'announcement')
    .sort((a, b) => (a.starts_at ? Date.parse(a.starts_at) : Infinity) - (b.starts_at ? Date.parse(b.starts_at) : Infinity));
  const notes = visible.filter((ev) => ev.kind === 'announcement');
  const feat = events.find((ev) => ev.is_featured) ?? events[0];
  const rest = events.filter((ev) => ev !== feat).slice(0, 6);

  return (
    <section className="section" id="events" aria-labelledby="events-title">
      <div className="container">
        <header className="split-head reveal">
          <div>
            <p className="eyebrow">What&apos;s happening</p>
            <h2 id="events-title">Events &amp; Announcements</h2>
          </div>
          {fb && <a className="text-link" href={fb} target="_blank" rel="noopener">Follow updates on Facebook <Icon name="arrow" size="sm" /></a>}
        </header>

        <div className={`events-layout${!feat || !rest.length ? ' is-single' : ''}`}>
          {!feat ? (
            <div className="cms-empty-card reveal">
              <Icon name="calendar" />
              <p><strong>No upcoming events right now.</strong> Check back soon, or follow our Facebook page for the latest news.</p>
            </div>
          ) : (
            <>
              <FeaturedEvent ev={feat} />
              {rest.length > 0 && (
                <div className="event-list">
                  {rest.map((ev) => {
                    const d = eventDates(ev);
                    return (
                      <article key={ev.id} className={`event-card reveal${ev.image_url ? ' has-image' : ''}`}>
                        <DateChip ev={ev} className="event-date" />
                        <div className="event-body">
                          {ev.category && <p className="tag">{ev.category}</p>}
                          <h3>{ev.title}</h3>
                          {(d.multi || d.time || ev.location) && (
                            <ul className="event-meta" role="list">
                              {d.multi && <li><Icon name="calendar" size="sm" /> {d.date}</li>}
                              {d.time && <li><Icon name="clock" size="sm" /> {d.time}</li>}
                              {ev.location && <li><Icon name="pin" size="sm" /> {ev.location}</li>}
                            </ul>
                          )}
                          {ev.description && <p>{ev.description}</p>}
                          <EventLink ev={ev} />
                        </div>
                        {ev.image_url && <div className="event-thumb"><Photo src={ev.image_url} alt={ev.title} /></div>}
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {notes.length > 0 && (
          <div className="announcements">
            {notes.map((n) => {
              const u = safeUrl(n.link_url);
              return (
                <aside className="announce reveal" aria-label="Announcement" key={n.id}>
                  <span className="announce-icon"><Icon name="megaphone" /></span>
                  <p>
                    <strong>{n.category || 'Announcement'}</strong> <b>{n.title}</b>{n.description ? `: ${n.description}` : ''}
                    {u && <> <Link href={u}>Learn more</Link></>}
                  </p>
                </aside>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedEvent({ ev }: { ev: ChurchEvent }) {
  const d = eventDates(ev);
  return (
    <article className="event-feature reveal">
      <div className="event-media">
        {ev.image_url ? <Photo src={ev.image_url} alt={ev.title} /> : <Placeholder index={0} icon="calendar" label={`Photo placeholder for ${ev.title}`} />}
        <DateChip ev={ev} className="date-chip" />
      </div>
      <div className="event-body">
        <p className="tag">Featured{ev.category ? ` · ${ev.category}` : ''}</p>
        <h3>{ev.title}</h3>
        {(d.date || d.time || ev.location) && (
          <ul className="event-meta" role="list">
            {d.date && <li><Icon name="calendar" size="sm" /> {d.date}</li>}
            {d.time && <li><Icon name="clock" size="sm" /> {d.time}</li>}
            {ev.location && <li><Icon name="pin" size="sm" /> {ev.location}</li>}
          </ul>
        )}
        {ev.description && <p>{ev.description}</p>}
        <EventLink ev={ev} />
      </div>
    </article>
  );
}

/* ---------------- Ministries ---------------- */
export function Ministries({ c }: { c: SiteContent }) {
  const list = c.ministries;
  const big = list.length >= 4;
  return (
    <section className="section section-alt" id="ministries" aria-labelledby="ministries-title">
      <div className="container">
        <header className="center-head reveal">
          <p className="eyebrow">Get involved</p>
          <h2 id="ministries-title">Our Ministries</h2>
          <p className="lead">There&apos;s a place for every age and every gift.</p>
        </header>
        <ul className="ministry-grid" role="list">
          {list.length ? list.map((m, i) => (
            <li key={m.id} className={`ministry${big && i === 0 ? ' m-xl' : big && i === 1 ? ' m-wide' : ''} reveal`}>
              {m.image_url ? <Photo src={m.image_url} alt={m.name} /> : <Placeholder index={i} icon={m.icon || 'users'} label={`Photo placeholder for ${m.name}`} />}
              <div className="ministry-body">
                <h3>{m.name}</h3>
                {m.description && <p>{m.description}</p>}
                {(m.leader || m.schedule) && (
                  <p className="ministry-meta">
                    {m.leader && <span><Icon name="users" size="sm" /> {m.leader}</span>}
                    {m.schedule && <span><Icon name="clock" size="sm" /> {m.schedule}</span>}
                  </p>
                )}
              </div>
            </li>
          )) : (
            <li className="cms-empty-wide"><p className="cms-empty">Ministry information is coming soon.</p></li>
          )}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- Spiritual resources + prayer form ---------------- */
const RES: Record<string, [string, string]> = {
  bible: ['book', '#159bd7'], sabbath_school: ['users', '#1d9aa8'], devotional: ['sun', '#c9a227'],
  sermon: ['play', '#5a67c9'], study: ['book', '#12403c'], prayer: ['heart', '#b4657c'],
};

export function Resources({ c }: { c: SiteContent }) {
  return (
    <section className="section" id="resources" aria-labelledby="resources-title">
      <div className="container resources-grid">
        <div className="resources-main">
          <p className="eyebrow reveal">Grow in faith</p>
          <h2 id="resources-title" className="reveal">Spiritual Resources</h2>
          <p className="lead reveal">Tools for daily Bible study, Sabbath School preparation, and devotional life.</p>
          <ul className="resource-list" role="list">
            {c.resources.length ? c.resources.map((r) => {
              const [icon, color] = RES[r.category] ?? RES.study;
              const u = safeUrl(r.url) || '#resources';
              return (
                <li className="reveal" key={r.id}>
                  <Link href={u} className="resource">
                    {r.image_url
                      ? <span className="r-icon r-cover"><Photo src={r.image_url} alt="" /></span>
                      : <span className="r-icon" style={{ ['--r' as string]: color }}><Icon name={icon} /></span>}
                    <span className="r-text"><strong>{r.title}</strong>{r.description && <span>{r.description}</span>}</span>
                    <Icon name={isExternal(u) ? 'external' : 'arrow'} className="icon sm r-go" />
                  </Link>
                </li>
              );
            }) : <li><p className="cms-empty">Resources are coming soon.</p></li>}
          </ul>
        </div>

        <div className="prayer reveal" id="prayer">
          <h3>Send us a prayer request</h3>
          <blockquote className="verse">«The effectual fervent prayer of a righteous man availeth much.» <cite>James 5:16</cite></blockquote>
          <PrayerForm email={c.info.email ?? ''} />
        </div>
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
    <section className="section section-alt building" id="building" aria-labelledby="building-title">
      <div className="container building-layout">
        <figure className="building-photo reveal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaSrc(f.image_url) || '/assets/church.jpg'}
            alt={f.image_caption || f.title || 'Church building project'} loading="lazy" width={720} height={540} />
          {f.image_caption && <figcaption><Icon name="camera" size="sm" /> {f.image_caption}</figcaption>}
        </figure>

        <div className="building-card reveal">
          <p className="eyebrow eyebrow-gold">Arise and build</p>
          <h2 id="building-title">{f.title || 'Church Building Fund'}</h2>
          {f.description && <p>{f.description}</p>}

          <div className="fund">
            <div className="fund-top">
              <p className="fund-raised-wrap"><span className="fund-raised">{peso(raised)}</span> <span className="muted">raised</span></p>
              <p className="fund-pct"><span>{pct}%</span></p>
            </div>
            <FundProgress raised={raised} goal={goal} />
            <dl className="fund-stats">
              <div><dt>Goal</dt><dd className="fund-goal">{peso(goal)}</dd></div>
              <div><dt>Still needed</dt><dd className="fund-left">{peso(Math.max(0, goal - raised))}</dd></div>
            </dl>
          </div>

          <blockquote className="verse">«Except the LORD build the house, they labour in vain that build it.» <cite>Psalm 127:1</cite></blockquote>

          <div className="btn-row">
            {/* Set the Google Form link in the Admin Panel → Building fund. Until then the button scrolls to the giving details. */}
            {form && isExternal(form)
              ? <a href={form} className="btn btn-primary" id="donate-now" target="_blank" rel="noopener"><Icon name="gift" size="sm" /> Donate now</a>
              : <a href="#give" className="btn btn-primary" id="donate-now"><Icon name="gift" size="sm" /> Donate now</a>}
            <a href="#give" className="btn btn-outline">Other ways to give</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Tithes & offerings ---------------- */
export function Giving({ c }: { c: SiteContent }) {
  const form = safeUrl(c.giving.form_url);
  return (
    <section className="section band" id="give" aria-labelledby="give-title">
      <div className="container give-layout">
        <div className="give-intro reveal">
          <p className="eyebrow eyebrow-gold">Faithful giving</p>
          <h2 id="give-title">Tithes &amp; Offerings</h2>
          <blockquote className="verse">«Bring ye all the tithes into the storehouse… and prove me now herewith, saith the LORD of hosts.» <cite>Malachi 3:10</cite></blockquote>
          {c.giving.note && <p className="give-note">{c.giving.note}</p>}
          {form && isExternal(form) && (
            <a className="btn btn-primary give-online" href={form} target="_blank" rel="noopener">
              <Icon name="external" size="sm" /> <span>{c.giving.form_label || 'Give online'}</span>
            </a>
          )}
        </div>
        <div className="give-methods">
          {c.givingMethods.map((m) => {
            const hasDl = m.bank_name || m.account_name || m.account_number;
            return (
              <article className="give-card reveal" key={m.id}>
                <span className="gc-icon"><Icon name={m.icon || 'gift'} /></span>
                <div className="gc-body">
                  <h3>{m.title}</h3>
                  {hasDl && (
                    <dl>
                      {m.bank_name && <div><dt>Bank</dt><dd>{m.bank_name}</dd></div>}
                      {m.account_name && <div><dt>Account name</dt><dd>{m.account_name}</dd></div>}
                      {m.account_number && (
                        <div>
                          <dt>{m.bank_name ? 'Account no.' : 'Number'}</dt>
                          <dd>
                            <span className="copy-value">{m.account_number}</span>
                            <CopyButton value={m.account_number.replace(/\s/g, '')} label={`Copy ${m.title} number`} />
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}
                  {m.note && <p className={hasDl ? 'gc-note' : undefined}>{m.note}</p>}
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
      <div className="container">
        <header className="split-head reveal">
          <div>
            <p className="eyebrow">Church life</p>
            <h2 id="gallery-title">Photo Gallery</h2>
          </div>
          {fb && <a href={`${fb.replace(/\/+$/, '')}/photos`} className="text-link" target="_blank" rel="noopener">More photos on Facebook <Icon name="external" size="sm" /></a>}
        </header>
        <Gallery albums={c.albums} photos={c.photos} />
      </div>
    </section>
  );
}

/* ---------------- Officers ---------------- */
export function Officers({ c }: { c: SiteContent }) {
  const feat = c.officers.find((o) => o.is_featured);
  const rest = c.officers.filter((o) => o !== feat);
  const portrait = (o: (typeof c.officers)[number], lg = false) => (
    <div className={`portrait${lg ? ' portrait-lg' : ''}`}>
      {o.image_url ? <Photo src={o.image_url} alt="" /> : <span>{initials(o.full_name, o.position)}</span>}
    </div>
  );
  return (
    <section className="section section-alt" id="officers" aria-labelledby="officers-title">
      <div className="container">
        <header className="center-head reveal">
          <p className="eyebrow">Serving you</p>
          <h2 id="officers-title">Meet Our Church Officers</h2>
        </header>
        {feat && (
          <article className="pastor-card reveal">
            {portrait(feat, true)}
            <div className="pastor-body">
              <p className="eyebrow">{feat.position}</p>
              <h3>{feat.full_name || 'To be announced'}</h3>
              {feat.bio && <p className="pastor-bio">{feat.bio}</p>}
              {c.info.email && (
                <div className="btn-row">
                  <a className="btn btn-outline btn-sm" href={`mailto:${c.info.email}`}><Icon name="mail" size="sm" /> Email the church</a>
                </div>
              )}
            </div>
          </article>
        )}
        {rest.length > 0 && (
          <ul className="officer-grid" role="list">
            {rest.map((o) => (
              <li className="officer reveal" key={o.id}>
                {portrait(o)}
                <h3>{o.full_name || 'To be announced'}</h3>
                <p>{o.position}</p>
                {o.bio && <p className="officer-bio">{o.bio}</p>}
              </li>
            ))}
          </ul>
        )}
        {!c.officers.length && <p className="cms-empty">Officer information is coming soon.</p>}
      </div>
    </section>
  );
}

/* ---------------- Visit us ---------------- */
export function Visit({ c }: { c: SiteContent }) {
  const { info, services } = c;
  const { fb, fbHandle, directions, mapEmbed } = contact(info);
  const schedule = [...services].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));
  return (
    <section className="section" id="visit" aria-labelledby="visit-title">
      <div className="container visit-grid">
        <div className="visit-copy">
          <p className="eyebrow reveal">We&apos;d love to meet you</p>
          <h2 id="visit-title" className="reveal">Visit Us</h2>

          <ul className="contact-grid reveal" role="list">
            {info.address && <li className="c-wide"><Icon name="pin" /><div><h3>Address</h3><p>{info.address}</p></div></li>}
            {info.phone && <li><Icon name="phone" /><div><h3>Phone</h3><p><a href={telHref(info.phone)}>{fmtPhone(info.phone)}</a></p></div></li>}
            {fb && <li><Icon name="facebook" /><div><h3>Facebook</h3><p><a href={fb} target="_blank" rel="noopener">{fbHandle}</a></p></div></li>}
            {info.email && <li className="c-wide"><Icon name="mail" /><div><h3>Email</h3><p><a href={`mailto:${info.email}`}>{info.email}</a></p></div></li>}
          </ul>

          <div className="visit-schedule reveal">
            <h3><Icon name="clock" size="sm" /> Worship schedule</h3>
            <ul className="schedule-list" role="list" id="schedule-list">
              {schedule.map((sv) => (
                <li key={sv.id}><strong>{sv.name}</strong><span>{DAYS[sv.day_of_week].slice(0, 3)} · {timeRange(sv.start_time, sv.end_time)}</span></li>
              ))}
            </ul>
          </div>

          <div className="first-time reveal">
            <strong>First time?</strong> Arrive by 8:30 AM on Saturday for Sabbath School. Our greeters will help you find a seat, and you&apos;re welcome to stay for fellowship lunch.
          </div>

          {directions && (
            <a className="btn btn-primary reveal" href={directions} target="_blank" rel="noopener">
              <Icon name="map" size="sm" /> Get directions
            </a>
          )}
        </div>
        {mapEmbed && (
          <div className="map reveal">
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
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="f-brand">
          <a href="#top" className="brand">
            <span className="logo-badge" aria-hidden="true" />
            <span className="brand-text"><strong>{info.short_name || info.name}</strong><small>Napocor Village, Quezon City</small></span>
          </a>
          <p className="f-verse">«Come unto me, all ye that labour and are heavy laden, and I will give you rest.» <span>Matthew 11:28</span></p>
          <div className="socials">
            {fb && <a href={fb} target="_blank" rel="noopener" aria-label="Facebook"><Icon name="facebook" size="sm" /></a>}
            {info.email && <a href={`mailto:${info.email}`} aria-label="Email"><Icon name="mail" size="sm" /></a>}
            {info.phone && <a href={telHref(info.phone)} aria-label="Call"><Icon name="phone" size="sm" /></a>}
          </div>
        </div>
        <nav aria-label="Footer">
          <h2 className="f-title">Explore</h2>
          <ul className="f-links">
            <li><a href="#services">Service Times</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#events">Events</a></li>
            <li><a href="#ministries">Ministries</a></li>
            <li><a href="#resources">Resources</a></li>
          </ul>
        </nav>
        <nav aria-label="Get involved">
          <h2 className="f-title">Get involved</h2>
          <ul className="f-links">
            <li><a href="#building">Building Fund</a></li>
            <li><a href="#give">Tithes &amp; Offerings</a></li>
            <li><a href="#prayer">Prayer Request</a></li>
            <li><a href="#gallery">Gallery</a></li>
            <li><a href="#officers">Church Officers</a></li>
          </ul>
        </nav>
        <div>
          <h2 className="f-title">Contact</h2>
          <ul className="f-contact">
            {info.address && <li><Icon name="pin" size="sm" /> {info.address}</li>}
            {info.phone && <li><Icon name="phone" size="sm" /> <a href={telHref(info.phone)}>{fmtPhone(info.phone)}</a></li>}
            {info.email && <li><Icon name="mail" size="sm" /> <a href={`mailto:${info.email}`}>{info.email}</a></li>}
          </ul>
        </div>
      </div>
      <div className="container copyright">
        <p>© {year} {info.name} · Pasong Tamo, Quezon City, Philippines</p>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
