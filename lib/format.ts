/* Formatting helpers shared by the website and the Admin Panel.
   The church runs on Manila time (UTC+8, no daylight saving). */

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const MANILA_OFFSET_MS = 8 * 3600 * 1000;

/** "08:30:00" → "08:30" */
export const hm = (t: string | null | undefined): string => String(t ?? '').slice(0, 5);

const parts = (t: string) => hm(t).split(':').map(Number) as [number, number];
const period = (h: number, m: number) => (h < 12 ? 'AM' : h === 12 && m === 0 ? 'NN' : 'PM');
const clock = (t: string) => {
  const [h, m] = parts(t);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`;
};

/** "14:00" → "2:00 PM", "12:00" → "12:00 NN" */
export function timeLabel(t: string | null | undefined): string {
  if (!t) return '';
  const [h, m] = parts(t);
  return `${clock(t)} ${period(h, m)}`;
}

/** "19:00","21:00" → "7:00 – 9:00 PM"; "10:30","12:00" → "10:30 AM – 12:00 NN" */
export function timeRange(a: string, b: string): string {
  const [h1, m1] = parts(a);
  const [h2, m2] = parts(b);
  const p1 = period(h1, m1);
  const p2 = period(h2, m2);
  return p1 === p2 && p1 !== 'NN' ? `${clock(a)} – ${clock(b)} ${p2}` : `${timeLabel(a)} – ${timeLabel(b)}`;
}

export const manila = (iso: string, opts: Intl.DateTimeFormatOptions): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', ...opts }).format(new Date(iso));
export const manilaHM = (iso: string): string => manila(iso, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export const sameManilaDay = (a: string, b: string): boolean => manila(a, { dateStyle: 'short' }) === manila(b, { dateStyle: 'short' });

/** ISO timestamp → value for <input type="datetime-local"> in Manila time */
export const toLocalInput = (iso: string | null | undefined): string =>
  iso ? new Date(Date.parse(iso) + MANILA_OFFSET_MS).toISOString().slice(0, 16) : '';
/** <input type="datetime-local"> value (Manila time) → ISO timestamp */
export const fromLocalInput = (v: string): string | null => (v ? new Date(`${v}:00+08:00`).toISOString() : null);

export const fmtDate = (iso: string | null | undefined, withTime = true): string =>
  iso
    ? new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
      }).format(new Date(iso))
    : '';

export const peso = (n: number | string | null | undefined): string =>
  '₱' + Number(n || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 });

/** 09123456789 → "0912 345 6789" */
export function fmtPhone(p: string | null | undefined): string {
  const d = String(p ?? '').replace(/\D/g, '');
  return /^09\d{9}$/.test(d) ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : String(p ?? '');
}

export const telHref = (p: string) => 'tel:' + p.replace(/[^\d+]/g, '');
export const mapsUrl = (q: string) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q).replace(/%20/g, '+');
export const mapsEmbed = (q: string) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;

/** Only allow http(s), mailto, tel, in-page anchors and site paths in links. */
export function safeUrl(u: string | null | undefined): string {
  const s = String(u ?? '').trim();
  if (!s) return '';
  if (/^(https?:|mailto:|tel:)/i.test(s) || s.startsWith('#') || s.startsWith('/')) return s;
  return '';
}
export const isExternal = (u: string) => /^https?:/i.test(u);

/** Image URLs: Supabase links stay as they are; built-in images become site paths. */
export function mediaSrc(u: string | null | undefined): string {
  if (!u) return '';
  if (/^(https?:|data:|blob:)/i.test(u)) return u;
  return '/' + u.replace(/^\/+/, '');
}

/** Split text on blank lines into paragraphs. */
export const paragraphs = (text: string | null | undefined): string[] =>
  String(text ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

/** Initials for an officer without a photo. */
export function initials(name: string | null, position: string): string {
  const src = (name || position || '').replace(/^(Ptr|Pastor|Elder|Bro|Sis|Dr|Mr|Mrs|Ms)\.?\s+/i, '');
  const words = src.split(/\s+/).filter(Boolean);
  return (words.length === 1 ? words[0].slice(0, 2) : words.slice(0, 2).map((w) => w[0]).join('')).toUpperCase();
}
