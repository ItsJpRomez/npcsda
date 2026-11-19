export const metadata = { title: 'Hero verses · Admin · NPC SDA Church' };

import { ListPanel } from '@/components/admin/ListPanel';
import { SECTIONS } from '@/components/admin/sections';

export default function Page() {
  const intro = SECTIONS.verses.intro;
  return (
    <>
      {intro && <p className="page-intro">{intro}</p>}
      <ListPanel section="verses" />
    </>
  );
}
