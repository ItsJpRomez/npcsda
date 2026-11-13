'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { mediaSrc } from '@/lib/format';
import { getBrowserClient } from '@/lib/supabase/browser';
import { ACCEPT, MAX_MB, checkFile, deleteRow, friendly, moveRow, persist, publish, removeImage, setPublished, uploadImage, type Row } from '@/lib/admin/api';
import type { Album, Photo } from '@/lib/types';
import { Icon } from '../Icon';
import type { FieldDef } from './fields';
import { FormDialog } from './FormDialog';
import { ErrorBox, Modal, Spinner, useUI } from './ui';

interface Pending { file: File; url: string; caption: string }

export function GalleryManager() {
  const ui = useUI();
  const sb = getBrowserClient();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [albumFilter, setAlbumFilter] = useState('');
  const [visFilter, setVisFilter] = useState('');
  const [pending, setPending] = useState<Pending[]>([]);
  const [uploadAlbum, setUploadAlbum] = useState('');
  const [progress, setProgress] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [editing, setEditing] = useState<Photo | null>(null);
  const [albumsOpen, setAlbumsOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [a, p] = await Promise.all([
      sb.from('albums').select('*').order('sort_order').order('created_at'),
      sb.from('photos').select('*').order('sort_order').order('created_at'),
    ]);
    const err = a.error || p.error;
    if (err) { setLoadError(friendly(err)); return; }
    setAlbums(a.data as Album[]);
    setPhotos(p.data as Photo[]);
  }, [sb]);
  useEffect(() => { void load(); }, [load]);

  const albumName = (id: string | null) => albums.find((a) => a.id === id)?.name ?? 'No album';
  const filtered = !!(q || albumFilter || visFilter);
  const visible = useMemo(() => (photos ?? []).filter((p) => {
    if (albumFilter === 'none' ? p.album_id : albumFilter && p.album_id !== albumFilter) return false;
    if (visFilter && String(p.published) !== visFilter) return false;
    return !q || `${p.caption ?? ''} ${p.description ?? ''}`.toLowerCase().includes(q.toLowerCase());
  }), [photos, albumFilter, visFilter, q]);

  /* ---- choosing files ---- */
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const problems: string[] = [];
    const next: Pending[] = [];
    [...files].forEach((file) => {
      const p = checkFile(file);
      if (p) problems.push(p);
      else next.push({ file, url: URL.createObjectURL(file), caption: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') });
    });
    if (problems.length) ui.toast(problems.join(' '), 'error');
    setPending((all) => [...all, ...next]);
  };
  const clearPending = () => { pending.forEach((p) => URL.revokeObjectURL(p.url)); setPending([]); };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); };

  const upload = async () => {
    const start = (photos ?? []).reduce((m, p) => Math.max(m, p.sort_order || 0), 0);
    let done = 0;
    const failed: string[] = [];
    for (const [i, p] of pending.entries()) {
      setProgress(`Uploading ${i + 1} of ${pending.length}…`);
      let url: string | null = null;
      try {
        url = await uploadImage(p.file, 'gallery');
        const { error } = await sb.from('photos').insert({
          image_url: url, caption: p.caption.trim() || null, album_id: uploadAlbum || null, sort_order: start + (i + 1) * 10, published: true,
        });
        if (error) throw error;
        done++;
      } catch (err) {
        if (url) void removeImage(url);
        failed.push(`${p.file.name}: ${friendly(err)}`);
      }
    }
    setProgress(null);
    clearPending();
    if (done) { ui.toast(`${done} ${done === 1 ? 'photo' : 'photos'} added to the gallery.`); void publish(); }
    if (failed.length) ui.toast(`Some photos couldn't be uploaded. ${failed.join(' ')}`, 'error');
    await load();
  };

  /* ---- tile actions ---- */
  const toggle = async (p: Photo, on: boolean) => {
    try {
      await setPublished('photos', p.id, on);
      setPhotos((all) => (all ?? []).map((x) => (x.id === p.id ? { ...x, published: on } : x)));
      ui.toast(on ? 'Photo is now on the website.' : 'Photo hidden from the website.');
    } catch (err) { ui.toast(friendly(err), 'error'); }
  };
  const remove = async (p: Photo) => {
    if (!(await ui.confirm({ title: `Delete “${p.caption || 'this photo'}”?`, body: "The photo is removed from the gallery and deleted from storage. This can't be undone." }))) return;
    try { await deleteRow('photos', p as unknown as Row); ui.toast('Photo deleted.'); await load(); }
    catch (err) { ui.toast(friendly(err), 'error'); }
  };
  const move = async (p: Photo, dir: -1 | 1) => {
    if (!photos) return;
    try {
      const copy = photos.map((x) => ({ ...x })) as unknown as Row[];
      await moveRow('photos', copy, visible.map((v) => copy.find((c) => c.id === v.id)!), p.id, dir);
      setPhotos((copy as unknown as Photo[]).sort((a, b) => a.sort_order - b.sort_order));
    } catch (err) { ui.toast(friendly(err), 'error'); void load(); }
  };

  const photoFields: FieldDef[] = [
    { key: 'image_url', label: 'Photo', type: 'image', folder: 'gallery', full: true },
    { key: 'caption', label: 'Caption', type: 'text', full: true, placeholder: 'e.g. Baptism, March 2026' },
    { key: 'description', label: 'Description', type: 'textarea', full: true, help: "Also read aloud by screen readers for visitors who can't see the photo." },
    { key: 'album_id', label: 'Album', type: 'select', options: albums.map((a) => [a.id, a.name]), full: true },
    { key: 'published', label: 'Show on the website', type: 'checkbox', full: true },
  ];

  return (
    <>
      <p className="page-intro">Upload photos, sort them into albums, and choose which ones appear on the website. Tiles without a photo are placeholders: edit one to add its picture.</p>

      <section className="panel">
        <div className="panel-head"><div><h2>Upload photos</h2><p>JPG, PNG or WebP, up to {MAX_MB} MB each. You can pick several at once.</p></div></div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="up-album">Add to album</label>
            <select id="up-album" value={uploadAlbum} onChange={(e) => setUploadAlbum(e.target.value)}>
              <option value="">No album</option>
              {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
        <label
          className={`dropzone${over ? ' is-over' : ''}`} tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.current?.click(); } }}
          onDragEnter={(e) => { e.preventDefault(); setOver(true); }} onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)} onDrop={onDrop}
        >
          <Icon name="upload" />
          <strong>Choose photos or drag them here</strong>
          <span>Then add captions and click Upload.</span>
          <input ref={fileInput} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        </label>
        {pending.length > 0 && (
          <>
            <div className="pending">
              {pending.map((p, i) => (
                <div className="pending-item" key={p.url}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`Preview of ${p.file.name}`} />
                  <button type="button" className="icon-btn" aria-label={`Remove ${p.file.name}`} disabled={!!progress}
                    onClick={() => { URL.revokeObjectURL(p.url); setPending((all) => all.filter((_, j) => j !== i)); }}>
                    <Icon name="x" size="sm" />
                  </button>
                  <input type="text" value={p.caption} placeholder="Caption" aria-label={`Caption for ${p.file.name}`}
                    onChange={(e) => setPending((all) => all.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-light" onClick={clearPending} disabled={!!progress}>Cancel</button>
              <button type="button" className="btn btn-navy" onClick={upload} disabled={!!progress}>
                {progress ? <><Spinner /> {progress}</> : <><Icon name="upload" size="sm" /> Upload {pending.length} {pending.length === 1 ? 'photo' : 'photos'}</>}
              </button>
            </div>
          </>
        )}
      </section>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size="sm" />
          <input type="search" placeholder="Search captions" aria-label="Search photos by caption" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select aria-label="Filter by album" value={albumFilter} onChange={(e) => setAlbumFilter(e.target.value)}>
          <option value="">All albums</option>
          {albums.map((a) => <option key={a.id} value={a.id}>{a.name} ({(photos ?? []).filter((p) => p.album_id === a.id).length})</option>)}
          <option value="none">No album</option>
        </select>
        <select aria-label="Filter by visibility" value={visFilter} onChange={(e) => setVisFilter(e.target.value)}>
          <option value="">Visible &amp; hidden</option>
          <option value="true">Visible only</option>
          <option value="false">Hidden only</option>
        </select>
        <button type="button" className="btn btn-light" onClick={() => setAlbumsOpen(true)}><Icon name="folder" size="sm" /> Manage albums</button>
      </div>

      {loadError ? <ErrorBox>Couldn&apos;t load photos. {loadError}</ErrorBox> : !photos ? (
        <div className="tiles" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton tile" />)}</div>
      ) : (
        <>
          <p className="count-note" aria-live="polite">{photos.length ? (filtered ? `Showing ${visible.length} of ${photos.length} photos` : `${photos.length} photos`) : ''}</p>
          <div className="tiles">
            {!photos.length ? (
              <div className="empty" style={{ gridColumn: '1/-1' }}><Icon name="camera" /><h3>No photos yet</h3><p>Upload your first photos above.</p></div>
            ) : !visible.length ? (
              <div className="empty" style={{ gridColumn: '1/-1' }}><Icon name="search" /><h3>Nothing matches</h3><p>Try a different search or album.</p></div>
            ) : visible.map((p, i) => (
              <article key={p.id} className={`tile${p.published ? '' : ' is-hidden'}`}>
                <div className="tile-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image_url ? <img src={mediaSrc(p.image_url)} alt={p.description || p.caption || ''} loading="lazy" /> : <Icon name="image" />}
                </div>
                {!p.image_url ? <span className="badge warn ph-badge">Needs a photo</span> : !p.published && <span className="badge gray ph-badge">Hidden</span>}
                <div className="tile-body"><h3>{p.caption || 'No caption'}</h3><p>{albumName(p.album_id)}</p></div>
                <div className="tile-actions">
                  <label className="switch-row" title="Show on the website" style={{ minHeight: 38, gap: 8 }}>
                    <input type="checkbox" checked={p.published} onChange={(e) => toggle(p, e.target.checked)} />
                    <span className="switch" aria-hidden="true" />
                    <span className="sr-only">Show {p.caption || 'photo'} on the website</span>
                  </label>
                  <span className="spacer" />
                  <button type="button" className="icon-btn" aria-label="Move earlier" disabled={i === 0 || filtered} onClick={() => move(p, -1)}><Icon name="up" size="sm" /></button>
                  <button type="button" className="icon-btn" aria-label="Move later" disabled={i === visible.length - 1 || filtered} onClick={() => move(p, 1)}><Icon name="down" size="sm" /></button>
                  <button type="button" className="icon-btn" aria-label={`Edit ${p.caption || 'photo'}`} onClick={() => setEditing(p)}><Icon name="edit" size="sm" /></button>
                  <button type="button" className="icon-btn danger" aria-label={`Delete ${p.caption || 'photo'}`} onClick={() => remove(p)}><Icon name="trash" size="sm" /></button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {editing && (
        <FormDialog
          title="Edit photo" fields={photoFields} initial={editing as unknown as Record<string, unknown>} onClose={() => setEditing(null)}
          onSave={async (values, images) => {
            await persist({ table: 'photos', id: editing.id, values, original: editing as unknown as Record<string, unknown>, fields: photoFields, images });
            ui.toast('Photo saved. The gallery is updated.');
            await load();
          }}
        />
      )}
      <AlbumsDialog open={albumsOpen} onClose={() => setAlbumsOpen(false)} albums={albums} photos={photos ?? []} reload={load}
        onDeleted={(id) => { if (albumFilter === id) setAlbumFilter(''); if (uploadAlbum === id) setUploadAlbum(''); }} />
    </>
  );
}

function AlbumsDialog({ open, onClose, albums, photos, reload, onDeleted }: {
  open: boolean; onClose: () => void; albums: Album[]; photos: Photo[]; reload: () => Promise<void>; onDeleted: (id: string) => void;
}) {
  const ui = useUI();
  const sb = getBrowserClient();
  const [name, setName] = useState('');

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const { error } = await sb.from('albums').insert({ name: n, sort_order: albums.reduce((m, a) => Math.max(m, a.sort_order || 0), 0) + 10 });
    if (error) { ui.toast(friendly(error), 'error'); return; }
    setName('');
    ui.toast(`Album “${n}” created.`);
    void publish();
    await reload();
  };
  const rename = async (a: Album, value: string) => {
    const n = value.trim();
    if (!n || n === a.name) return;
    const { error } = await sb.from('albums').update({ name: n }).eq('id', a.id);
    if (error) { ui.toast(friendly(error), 'error'); return; }
    ui.toast('Album renamed.');
    void publish();
    await reload();
  };
  const remove = async (a: Album) => {
    if (!(await ui.confirm({ title: `Delete the album “${a.name}”?`, body: 'Its photos stay in the gallery under “No album”.' }))) return;
    const { error } = await sb.from('albums').delete().eq('id', a.id);
    if (error) { ui.toast(friendly(error), 'error'); return; }
    ui.toast('Album deleted.');
    onDeleted(a.id);
    void publish();
    await reload();
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="albums-title">
      <div className="dlg-head">
        <h2 id="albums-title">Albums</h2>
        <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
      </div>
      <div className="dlg-body">
        <p className="help" style={{ margin: '0 0 14px' }}>Rename an album and click away to save. Deleting an album keeps its photos (they move to “No album”).</p>
        <div className="album-rows">
          {albums.length ? albums.map((a) => (
            <div className="album-row" key={`${a.id}-${a.name}`}>
              <input type="text" defaultValue={a.name} aria-label="Album name" maxLength={80} onBlur={(e) => rename(a, e.target.value)} />
              <span className="count">{photos.filter((p) => p.album_id === a.id).length} photos</span>
              <button type="button" className="icon-btn danger" aria-label={`Delete album ${a.name}`} onClick={() => remove(a)}><Icon name="trash" size="sm" /></button>
            </div>
          )) : <p className="help">No albums yet.</p>}
        </div>
        <form className="album-row" noValidate onSubmit={add}>
          <input type="text" placeholder="New album name" aria-label="New album name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="btn btn-navy"><Icon name="plus" size="sm" /> Add</button>
        </form>
      </div>
      <div className="dlg-foot"><button type="button" className="btn btn-light" onClick={onClose}>Done</button></div>
    </Modal>
  );
}
