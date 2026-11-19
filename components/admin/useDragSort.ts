'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

type Id = string | number;

/**
 * Drag-to-reorder for a grid or list.
 * - Mouse/pen: press on an item and drag; the others slide out of the way.
 * - Touch: press and hold for a moment, then drag (a quick swipe still scrolls the page).
 * - Keyboard: focus the item's grip handle and use the arrow keys.
 * `onCommit` gets the new order once, when the item is dropped (or after each key press).
 */
export function useDragSort<T extends { id: Id }>(items: T[], onCommit: (ordered: T[]) => void) {
  const [order, setOrder] = useState(items);
  const [dragId, setDragId] = useState<Id | null>(null);
  const els = useRef(new Map<Id, HTMLElement>());
  const rects = useRef<Map<Id, DOMRect> | null>(null);
  const live = useRef(order);
  const drag = useRef<{
    id: Id; pointerId: number; x: number; y: number; dx: number; dy: number;
    started: boolean; timer?: number; ghost?: HTMLElement; startOrder: T[];
  } | null>(null);

  // Follow the source list while nobody is dragging
  useEffect(() => { if (!drag.current) { setOrder(items); live.current = items; } }, [items]);

  /** Remember where every item is, so the next render can slide them from there. */
  const snapshot = () => {
    const m = new Map<Id, DOMRect>();
    els.current.forEach((el, id) => m.set(id, el.getBoundingClientRect()));
    rects.current = m;
  };
  const apply = useCallback((next: T[]) => { snapshot(); live.current = next; setOrder(next); }, []);

  // FLIP: items that moved slide smoothly into their new place
  useLayoutEffect(() => {
    const before = rects.current;
    rects.current = null;
    if (!before || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    els.current.forEach((el, id) => {
      const a = before.get(id);
      if (!a) return;
      const b = el.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) return;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform .22s cubic-bezier(.2,.7,.3,1)';
        el.style.transform = '';
      });
    });
  }, [order]);

  const moveTo = (id: Id, targetId: Id) => {
    const cur = live.current;
    const from = cur.findIndex((x) => x.id === id);
    const to = cur.findIndex((x) => x.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...cur];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    apply(next);
  };

  const stopScrollWhileDragging = (e: TouchEvent) => { if (drag.current?.started) e.preventDefault(); };

  const begin = () => {
    const d = drag.current;
    if (!d) return;
    const el = els.current.get(d.id);
    if (!el) return;
    d.started = true;
    const r = el.getBoundingClientRect();
    d.dx = d.x - r.left;
    d.dy = d.y - r.top;
    // A lifted copy follows the pointer; the real item stays in the grid as a placeholder
    // The copy sits inside an empty clone of the list container, so container-based styles
    // (e.g. a list's icon colours) still apply to it
    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.classList.add('drag-ghost');
    ghost.removeAttribute('data-sort-id');
    Object.assign(ghost.style, { width: `${r.width}px`, height: `${r.height}px`, margin: '0', transform: '' });
    const shell = (el.parentElement?.cloneNode(false) as HTMLElement | undefined) ?? document.createElement('div');
    shell.classList.add('drag-shell');
    shell.removeAttribute('aria-busy');
    Object.assign(shell.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, zIndex: '1000', pointerEvents: 'none' });
    shell.appendChild(ghost);
    document.body.appendChild(shell);
    d.ghost = shell;
    document.body.classList.add('is-sorting');
    navigator.vibrate?.(10);
    setDragId(d.id);
  };

  const onMove = (e: globalThis.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (!d.started) {
      const far = Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6;
      if (!far) return;
      if (e.pointerType === 'touch') { cancel(); return; } // moved before the hold finished: it's a scroll
      begin();
    }
    if (d.ghost) {
      d.ghost.style.left = `${e.clientX - d.dx}px`;
      d.ghost.style.top = `${e.clientY - d.dy}px`;
    }
    // Hit-test against where items will settle (offset* ignores the slide animation's transform);
    // testing what is drawn would hit an item mid-slide and swap it straight back.
    let target: Id | null = null;
    for (const [id, el] of els.current) {
      const parent = el.offsetParent as HTMLElement | null;
      const base = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };
      const left = base.left + el.offsetLeft - (parent?.scrollLeft ?? 0);
      const top = base.top + el.offsetTop - (parent?.scrollTop ?? 0);
      if (e.clientX >= left && e.clientX < left + el.offsetWidth && e.clientY >= top && e.clientY < top + el.offsetHeight) { target = id; break; }
    }
    if (target != null && target !== d.id) moveTo(d.id, target);
    // Scroll the page when dragging near the top or bottom edge
    const edge = 70;
    if (e.clientY < edge) window.scrollBy(0, -12);
    else if (e.clientY > window.innerHeight - edge) window.scrollBy(0, 12);
  };

  // Window listeners must be the same functions on add and remove, while always running the
  // latest handlers; these stable wrappers forward to whatever this render defined.
  const latest = useRef({ onMove, onUp: () => {}, onCancel: () => {}, touch: stopScrollWhileDragging });
  const L = useRef({
    move: (e: globalThis.PointerEvent) => latest.current.onMove(e),
    up: () => latest.current.onUp(),
    cancel: () => latest.current.onCancel(),
    touch: (e: TouchEvent) => latest.current.touch(e),
  }).current;

  const finish = (commit: boolean) => {
    const d = drag.current;
    drag.current = null;
    window.removeEventListener('pointermove', L.move);
    window.removeEventListener('pointerup', L.up);
    window.removeEventListener('pointercancel', L.cancel);
    window.removeEventListener('touchmove', L.touch);
    if (!d) return;
    clearTimeout(d.timer);
    d.ghost?.remove();
    document.body.classList.remove('is-sorting');
    setDragId(null);
    if (!d.started) return;
    const changed = live.current.some((x, i) => x.id !== d.startOrder[i]?.id);
    if (commit && changed) onCommit(live.current);
    else if (!commit) apply(d.startOrder);
  };
  const onUp = () => finish(true);
  const onCancel = () => finish(false);
  const cancel = () => finish(false);
  latest.current = { onMove, onUp, onCancel, touch: stopScrollWhileDragging };

  const onPointerDown = (id: Id) => (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || drag.current) return;
    // Buttons, switches and links inside the item keep working normally
    if ((e.target as Element).closest('button:not([data-grip]), input, label, a, select, textarea')) return;
    drag.current = { id, pointerId: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, started: false, startOrder: live.current };
    window.addEventListener('pointermove', L.move);
    window.addEventListener('pointerup', L.up);
    window.addEventListener('pointercancel', L.cancel);
    window.addEventListener('touchmove', L.touch, { passive: false });
    if (e.pointerType === 'touch') drag.current.timer = window.setTimeout(begin, 280);
    else e.preventDefault(); // no text selection while dragging with a mouse
  };

  useEffect(() => () => finish(false), []); // eslint-disable-line react-hooks/exhaustive-deps

  const onGripKey = (id: Id) => (e: KeyboardEvent<HTMLElement>) => {
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const cur = live.current;
    const i = cur.findIndex((x) => x.id === id);
    const j = i + step;
    if (i < 0 || j < 0 || j >= cur.length) return;
    const next = [...cur];
    [next[i], next[j]] = [next[j], next[i]];
    apply(next);
    onCommit(next);
    requestAnimationFrame(() => els.current.get(id)?.querySelector<HTMLElement>('[data-grip]')?.focus());
  };

  const itemProps = (id: Id) => ({
    'data-sort-id': String(id),
    ref: (el: HTMLElement | null) => { if (el) els.current.set(id, el); else els.current.delete(id); },
    onPointerDown: onPointerDown(id),
    'data-dragging': dragId === id ? 'true' : undefined,
  });
  const gripProps = (id: Id) => ({ 'data-grip': true, onKeyDown: onGripKey(id) });

  return { order, dragId, itemProps, gripProps };
}
