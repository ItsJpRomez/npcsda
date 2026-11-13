import { DAYS, MANILA_OFFSET_MS, hm, timeRange } from './format';
import type { Service } from './types';

const DAY_MS = 86400 * 1000;
const toMs = (t: string) => {
  const [h, m] = hm(t).split(':').map(Number);
  return (h * 60 + m) * 60000;
};

export interface NextService {
  service: Service;
  startsAt: number;   // timestamp of the next start
  live: Service | null;
  when: string;       // "Friday · 7:00 – 9:00 PM"
}

/** The service happening now (if any) and the next one to start, in Manila time. */
export function findNextService(services: Service[], now = Date.now()): NextService | null {
  const local = now + MANILA_OFFSET_MS;            // Manila clock expressed as UTC
  const midnight = local - (local % DAY_MS);       // Manila midnight today
  const today = new Date(local).getUTCDay();
  let next: { service: Service; startsAt: number } | null = null;
  let live: Service | null = null;
  for (const sv of services) {
    const offsetDays = (sv.day_of_week - today + 7) % 7;
    let startAt = midnight + offsetDays * DAY_MS + toMs(sv.start_time) - MANILA_OFFSET_MS;
    const endAt = midnight + offsetDays * DAY_MS + toMs(sv.end_time) - MANILA_OFFSET_MS;
    if (now >= startAt && now < endAt && !live) live = sv;
    if (startAt <= now) startAt += 7 * DAY_MS;
    if (!next || startAt < next.startsAt) next = { service: sv, startsAt: startAt };
  }
  if (!next) return null;
  const sv = next.service;
  return { ...next, live, when: `${DAYS[sv.day_of_week]} · ${timeRange(sv.start_time, sv.end_time)}` };
}
