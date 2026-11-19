/* Photos and their placeholder tiles (server-safe, no client JS). */
import type { CSSProperties } from 'react';
import { mediaSrc } from '@/lib/format';
import { Icon } from '../Icon';

const HUES = [210, 255, 160, 295, 10, 145, 55, 230];

/** Soft tinted tile with an icon, shown until a real photo is uploaded. */
export function Placeholder({ index, icon, label }: { index: number; icon?: string | null; label: string }) {
  const h = HUES[index % HUES.length];
  return (
    <div className="ph" style={{ '--h': h } as CSSProperties} role="img" aria-label={label}>
      <Icon name={icon || 'camera'} px={40} className="ph-icon" />
    </div>
  );
}

/** Plain <img> so photos from Supabase Storage work without extra image-host config. */
export function Photo({ src, alt, eager }: { src: string; alt: string; eager?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={mediaSrc(src)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}
