'use client';

import { useState } from 'react';
import type { Album, Photo as PhotoRow } from '@/lib/types';
import { Photo, Placeholder } from './Media';

const SIZES = ['g-hero', 'g-tall', '', '', 'g-wide', '', '', 'g-wide', 'g-wide'];

export function Gallery({ albums, photos }: { albums: Album[]; photos: PhotoRow[] }) {
  const [album, setAlbum] = useState('');
  const used = albums.filter((a) => photos.some((p) => p.album_id === a.id));
  const list = album ? photos.filter((p) => p.album_id === album) : photos;

  return (
    <>
      {used.length >= 2 && (
        <div className="gallery-filters" role="group" aria-label="Photo albums">
          {[{ id: '', name: 'All photos' }, ...used].map((a) => (
            <button key={a.id} type="button" className={`chip${album === a.id ? ' is-active' : ''}`} aria-pressed={album === a.id} onClick={() => setAlbum(a.id)}>
              {a.name}
            </button>
          ))}
        </div>
      )}
      <div className="gallery">
        {list.length ? list.map((p, i) => {
          const size = list.length >= 5 ? SIZES[i % SIZES.length] : i === 0 && list.length > 2 ? 'g-hero' : '';
          return (
            <figure key={p.id} className={`g-item ${size} reveal`}>
              {p.image_url
                ? <Photo src={p.image_url} alt={p.description || p.caption || 'Church photo'} />
                : <Placeholder index={i} icon={p.icon} label={`Photo placeholder: ${p.caption || 'church life'}`} />}
              {p.caption && <figcaption>{p.caption}</figcaption>}
            </figure>
          );
        }) : (
          <div className="cms-empty-wide"><p className="cms-empty">Photos are coming soon.</p></div>
        )}
      </div>
    </>
  );
}
