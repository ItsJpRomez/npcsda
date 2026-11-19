'use client';

import { useState } from 'react';
import type { Album, Photo as PhotoRow } from '@/lib/types';
import { Photo, Placeholder } from './Media';

/* Mosaic pattern for the "All photos" view: first tile big, some tall or wide. */
const SPANS = ['g-big', 'g-tall', '', '', 'g-wide', '', '', 'g-wide', ''];

export function Gallery({ albums, photos }: { albums: Album[]; photos: PhotoRow[] }) {
  const [album, setAlbum] = useState('');
  const used = albums.filter((a) => photos.some((p) => p.album_id === a.id));
  const list = album ? photos.filter((p) => p.album_id === album) : photos;
  const mosaic = !album && list.length >= 5;

  return (
    <>
      {used.length >= 2 && (
        <div className="chips" role="group" aria-label="Photo albums">
          {[{ id: '', name: 'All photos' }, ...used].map((a) => (
            <button key={a.id} type="button" className="chip" aria-pressed={album === a.id} onClick={() => setAlbum(a.id)}>{a.name}</button>
          ))}
        </div>
      )}
      {list.length ? (
        <div className="gallery">
          {list.map((p, i) => (
            <figure key={p.id} className={`g-item ${mosaic ? SPANS[i % SPANS.length] : ''}`}>
              {p.image_url
                ? <Photo src={p.image_url} alt={p.description || p.caption || 'Church photo'} />
                : <Placeholder index={i} icon={p.icon} label={`Photo placeholder: ${p.caption || 'church life'}`} />}
              {p.caption && <figcaption>{p.caption}</figcaption>}
            </figure>
          ))}
        </div>
      ) : <p className="empty-note">Photos are coming soon.</p>}
    </>
  );
}
