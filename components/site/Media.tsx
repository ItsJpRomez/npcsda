/* Photos and their placeholder tiles (server-safe, no client JS). */
import type { CSSProperties } from 'react';
import { mediaSrc } from '@/lib/format';
import { Icon } from '../Icon';

const TONES: [string, string][] = [
  ['#0b3a5c', '#159bd7'], ['#12403c', '#1d9aa8'], ['#6b4e0f', '#c9a227'], ['#5a2a3c', '#b4657c'],
  ['#2b2f5e', '#5a67c9'], ['#1f4d2e', '#4f9a5f'], ['#102a43', '#3a6a96'], ['#6a3a12', '#d08a3c'],
];

/** Coloured tile with an icon, shown until a real photo is uploaded. */
export function Placeholder({ index, icon, label }: { index: number; icon?: string | null; label: string }) {
  const [a, b] = TONES[index % TONES.length];
  return (
    <div className="ph" style={{ '--tone-a': a, '--tone-b': b } as CSSProperties} role="img" aria-label={label}>
      <Icon name={icon || 'camera'} className="ph-icon" />
    </div>
  );
}

/** Plain <img> so photos from Supabase Storage work without extra image-host config. */
export function Photo({ src, alt, eager }: { src: string; alt: string; eager?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={mediaSrc(src)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}
