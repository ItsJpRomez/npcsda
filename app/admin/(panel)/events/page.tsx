export const metadata = { title: 'Events & news · Admin · NPC SDA Church' };

import { ListPanel } from '@/components/admin/ListPanel';
import { SECTIONS } from '@/components/admin/sections';

export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const kind = type === 'event' || type === 'announcement' ? type : '';
  const intro = SECTIONS.events.intro;
  return (
    <>
      {intro && <p className="page-intro">{intro}</p>}
      <ListPanel key={kind || 'all'} section="events" initialFilters={kind ? { kind } : undefined} />
    </>
  );
}
