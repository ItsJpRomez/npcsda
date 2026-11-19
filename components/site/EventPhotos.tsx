'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { mediaSrc } from '@/lib/format';
import { Icon } from '../Icon';

/**
 * Photos for one event or announcement: a mosaic of up to three tiles
 * (the third shows "+N" when there are more), opening a full-screen viewer
 * with arrows, keyboard, swipe and thumbnails.
 */
export function EventPhotos({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!images.length) return null;
  const shown = images.slice(0, 3);
  const extra = images.length - shown.length;

  return (
    <>
      <div className={`ev-photos n${shown.length}`}>
        {shown.map((src, i) => (
          <button
            key={src + i}
            type="button"
            className="ev-photo"
            onClick={() => setOpen(i)}
            aria-label={`View photo ${i + 1} of ${images.length}: ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaSrc(src)} alt="" loading="lazy" decoding="async" />
            {i === shown.length - 1 && extra > 0 && <span className="ev-more" aria-hidden="true">+{extra}</span>}
          </button>
        ))}
        {images.length > 1 && (
          <span className="ev-count" aria-hidden="true"><Icon name="image" px={14} />{images.length}</span>
        )}
      </div>
      {open !== null && <Lightbox images={images} title={title} start={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Lightbox({ images, title, start, onClose }: { images: string[]; title: string; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const ref = useRef<HTMLDialogElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const many = images.length > 1;
  const go = useCallback((d: number) => setI((n) => (n + d + images.length) % images.length), [images.length]);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    dlg.showModal();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = prev; if (dlg.open) dlg.close(); };
  }, []);

  // Keep the current thumbnail in view
  useEffect(() => {
    thumbs.current?.querySelector('[aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [i]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };
  const down = (e: PointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY }; };
  const up = (e: PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || !many) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1);
  };

  return (
    <dialog
      ref={ref}
      className="lightbox"
      aria-label={`Photos: ${title}`}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onKeyDown={onKey}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="lb-top">
        <div className="lb-title"><strong>{title}</strong>{many && <span>{i + 1} / {images.length}</span>}</div>
        <button type="button" className="lb-btn" onClick={onClose} aria-label="Close photos"><Icon name="x" px={20} /></button>
      </div>

      <div className="lb-stage" onPointerDown={down} onPointerUp={up} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={i} src={mediaSrc(images[i])} alt={`${title}, photo ${i + 1} of ${images.length}`} draggable={false} />
        {many && (
          <>
            <button type="button" className="lb-btn lb-prev" onClick={() => go(-1)} aria-label="Previous photo"><Icon name="chevron-left" px={22} /></button>
            <button type="button" className="lb-btn lb-next" onClick={() => go(1)} aria-label="Next photo"><Icon name="chevron" px={22} /></button>
          </>
        )}
      </div>

      {many && (
        <div className="lb-thumbs" ref={thumbs}>
          {images.map((src, n) => (
            <button key={src + n} type="button" className="lb-thumb" aria-current={n === i ? 'true' : undefined} aria-label={`Show photo ${n + 1}`} onClick={() => setI(n)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaSrc(src)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </dialog>
  );
}
