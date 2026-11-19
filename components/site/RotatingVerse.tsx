'use client';

import { useState, type CSSProperties } from 'react';
import type { Verse } from '@/lib/types';
import { Icon } from '../Icon';

/** Reading time: about 3 words a second plus time to settle, kept between 7 and 14 seconds. */
const readMs = (text: string) => Math.min(14000, Math.max(7000, 2500 + text.split(/\s+/).length * 330));

/**
 * Hero verse that rotates on its own. The active dot fills up while the verse is shown and
 * the next verse comes in when it is full, so pausing (button, hover or keyboard focus)
 * freezes the fill and resumes exactly where it stopped.
 */
export function RotatingVerse({ verses: list }: { verses: Verse[] }) {
  const VERSES = list.map((v) => ({ text: v.text, ref: v.reference }));
  const [cur, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [announce, setAnnounce] = useState(false);
  if (!VERSES.length) return null;
  const i = cur % VERSES.length;
  const go = (n: number, byUser = false) => { setI((n + VERSES.length) % VERSES.length); setAnnounce(byUser); };

  return (
    <div className={`hero-verse${paused ? ' is-paused' : ''}`} role="region" aria-roledescription="carousel" aria-label="Bible verses">
      <div className="verse-stage" aria-live={announce ? 'polite' : 'off'}>
        {VERSES.map((v, n) => (
          <blockquote key={n} className={`verse-slide${n === i ? ' is-active' : ''}`} aria-hidden={n !== i}>
            <p>“{v.text}”</p>
            <cite>{v.ref}</cite>
          </blockquote>
        ))}
      </div>
      <div className="verse-controls">
        <div className="verse-dots">
          {VERSES.map((v, n) => (
            <button
              key={n}
              type="button"
              className="verse-dot"
              aria-label={`Show ${v.ref}`}
              aria-current={n === i ? 'true' : undefined}
              onClick={() => go(n, true)}
            >
              {n === i && (
                <span
                  key={i}
                  className="vd-fill"
                  style={{ '--read': `${readMs(v.text)}ms` } as CSSProperties}
                  onAnimationEnd={() => go(i + 1)}
                />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="verse-pause"
          aria-label={paused ? 'Play verses' : 'Pause verses'}
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
        >
          <Icon name={paused ? 'play' : 'pause'} px={14} />
        </button>
      </div>
    </div>
  );
}
