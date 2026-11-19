'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { mediaSrc } from '@/lib/format';
import { getBrowserClient } from '@/lib/supabase/browser';
import { deleteRow, friendly, persist, reorderRows, setPublished, type Row } from '@/lib/admin/api';
import { Icon } from './Icon';
import { FormDialog } from './FormDialog';
import { SECTIONS, type ListSection, type ListSectionKey } from './sections';
import { ErrorBox, useUI } from './ui';
import { useDragSort } from './useDragSort';

/** Searchable, filterable list with add / edit / delete / reorder / show-hide. */
/** Pastel tint per section (DESIGN_SYSTEM.md hue convention). */
const HUES: Partial<Record<ListSectionKey, string>> = {
  events: 'blue', officers: 'purple', ministries: 'amber', services: 'teal', milestones: 'rose',
  resources: 'blue', giving_methods: 'green',
};

export function ListPanel({ section, compact, initialFilters }: { section: ListSectionKey; compact?: boolean; initialFilters?: Record<string, string> }) {
  const sec = SECTIONS[section] as ListSection;
  const ui = useUI();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters ?? {});
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [busyId, setBusyId] = useState<Row['id'] | null>(null);

  const load = useCallback(async () => {
    let query = getBrowserClient().from(sec.table).select('*');
    const order = sec.sortable ? [['sort_order'], ['created_at']] as const : sec.order ?? [['created_at']];
    for (const [col, opts] of order) query = query.order(col, (opts as { ascending?: boolean }) ?? { ascending: true });
    const { data, error } = await query;
    if (error) { setLoadError(friendly(error)); return; }
    setLoadError(null);
    setRows(sec.clientSort ? [...(data as Row[])].sort(sec.clientSort) : (data as Row[]));
  }, [sec]);
  useEffect(() => { void load(); }, [load]);

  const filtered = !!q || Object.values(filters).some(Boolean);
  const visible = useMemo(() => (rows ?? []).filter((r) => {
    for (const [k, v] of Object.entries(filters)) if (v && String(r[k]) !== v) return false;
    if (!q) return true;
    return sec.search.some((k) => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase()));
  }), [rows, filters, q, sec.search]);

  const save = async (values: Record<string, unknown>, images: Parameters<typeof persist>[0]['images']) => {
    const row = editing === 'new' ? null : editing;
    if (!row && sec.sortable) values.sort_order = (rows ?? []).reduce((m, x) => Math.max(m, Number(x.sort_order) || 0), 0) + 10;
    await persist({ table: sec.table, id: row?.id, values, original: row, fields: sec.fields, images });
    ui.toast(row ? 'Changes saved. The website is updated.' : 'Added. It now appears on the website.');
    await load();
  };

  const remove = async (r: Row) => {
    const name = sec.row(r).title || sec.singular;
    const ok = await ui.confirm({ title: `Delete “${name}”?`, body: `This removes it from the website${r.image_url ? ', along with its photo' : ''}. This can't be undone.` });
    if (!ok) return;
    try { await deleteRow(sec.table, r); ui.toast("Deleted. It's no longer on the website."); await load(); }
    catch (err) { ui.toast(friendly(err), 'error'); }
  };

  const toggle = async (r: Row, on: boolean) => {
    setBusyId(r.id);
    try {
      await setPublished(sec.table, r.id, on);
      setRows((all) => (all ?? []).map((x) => (x.id === r.id ? { ...x, published: on } : x)));
      ui.toast(on ? 'Now visible on the website.' : 'Hidden from the website.');
    } catch (err) { ui.toast(friendly(err), 'error'); }
    setBusyId(null);
  };

  /* Drag to reorder (press and hold on touch; arrow keys on the grip handle) */
  const [orderNote, setOrderNote] = useState('');
  const saveOrder = async (next: Row[]) => {
    if (!rows) return;
    try {
      setRows(await reorderRows(sec.table, rows, next));
      setOrderNote(`Order saved. ${next.slice(0, 3).map((r) => sec.row(r).title).join(', ')}${next.length > 3 ? '…' : ''}`);
    } catch (err) { ui.toast(friendly(err), 'error'); void load(); }
  };
  const sort = useDragSort(visible, saveOrder);
  const list = sec.sortable ? sort.order : visible;

  const addButton = (
    <button type="button" className="btn btn-navy" onClick={() => setEditing('new')}>
      <Icon name="plus" size="sm" /> Add {sec.singular}
    </button>
  );

  return (
    <>
      {compact ? (
        <div className="panel-head"><div><h2>{sec.title}</h2></div>{addButton}</div>
      ) : (
        <div className="toolbar">
          <div className="search">
            <Icon name="search" size="sm" />
            <input type="search" placeholder={`Search ${sec.title.toLowerCase()}`} aria-label={`Search ${sec.title.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {sec.filters?.map((f) => (
            <select key={f.key} aria-label={f.label} value={filters[f.key] ?? ''} onChange={(e) => setFilters((x) => ({ ...x, [f.key]: e.target.value }))}>
              <option value="">{f.label}</option>
              {f.options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          ))}
          <select aria-label="Filter by visibility" value={filters.published ?? ''} onChange={(e) => setFilters((x) => ({ ...x, published: e.target.value }))}>
            <option value="">Visible &amp; hidden</option>
            <option value="true">Visible only</option>
            <option value="false">Hidden only</option>
          </select>
          {addButton}
        </div>
      )}

      {loadError ? (
        <ErrorBox>Couldn&apos;t load {sec.title.toLowerCase()}. {loadError}</ErrorBox>
      ) : !rows ? (
        <div className="rows" aria-busy="true"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
      ) : !rows.length ? (
        <div className="empty">
          <Icon name={sec.icon} />
          <h3>No {sec.title.toLowerCase()} yet</h3>
          <p>Add the first one and it will appear on the website.</p>
          {addButton}
        </div>
      ) : (
        <>
          <p className="count-note">
            {filtered ? `Showing ${visible.length} of ${rows.length}` : `${rows.length} ${rows.length === 1 ? 'item' : 'items'}`}
            {sec.sortable && visible.length > 1 && <span className="sort-hint"> · Drag to change the order on the website</span>}
          </p>
          <p className="sr-only" aria-live="polite">{orderNote}</p>
          {!visible.length ? (
            <div className="empty"><Icon name="search" /><h3>Nothing matches</h3><p>Try a different search or filter.</p></div>
          ) : (
            <div className="rows" data-hue={HUES[section] ?? 'blue'}>
              {list.map((r) => {
                const v = sec.row(r);
                const badges = (v.badges ?? []).filter((b): b is [string, 'sky' | 'gold' | 'green' | 'gray' | 'warn'] => !!b);
                if (r.published === false) badges.unshift(['Hidden from website', 'gray']);
                return (
                  <article key={String(r.id)} className={`row${sec.sortable ? ' sortable' : ''}${r.published === false ? ' is-hidden' : ''}`} {...(sec.sortable ? sort.itemProps(r.id) : {})}>
                    {sec.sortable && (
                      <button type="button" className="icon-btn grip row-grip" title="Drag to reorder" aria-label={`Reorder ${v.title}: use the arrow keys, or drag`} {...sort.gripProps(r.id)}>
                        <Icon name="grip" size="sm" />
                      </button>
                    )}
                    <div className="row-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {v.image ? <img src={mediaSrc(v.image)} alt="" loading="lazy" /> : <Icon name={v.icon} />}
                    </div>
                    <div className="row-body">
                      <h3>{v.title || 'Untitled'}</h3>
                      {v.sub && <p>{v.sub}</p>}
                      {badges.length > 0 && <div className="badges">{badges.map(([t, k]) => <span key={t} className={`badge ${k}`}>{t}</span>)}</div>}
                    </div>
                    <div className="row-actions">
                      {'published' in r && (
                        <label className="switch-row" title="Show on the website">
                          <input type="checkbox" checked={Boolean(r.published)} disabled={busyId === r.id} onChange={(e) => toggle(r, e.target.checked)} />
                          <span className="switch" aria-hidden="true" />
                          <span>Visible<span className="sr-only">: {v.title}</span></span>
                        </label>
                      )}
                      <button type="button" className="icon-btn" aria-label={`Edit ${v.title}`} title="Edit" onClick={() => setEditing(r)}><Icon name="edit" /></button>
                      <button type="button" className="icon-btn danger" aria-label={`Delete ${v.title}`} title="Delete" onClick={() => remove(r)}><Icon name="trash" /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {editing && (
        <FormDialog
          title={editing === 'new' ? `Add ${sec.singular}` : `Edit ${sec.singular}`}
          fields={sec.fields}
          initial={editing === 'new' ? sec.defaults : editing}
          validate={sec.validate}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
