export const metadata = { title: 'Ministries · Admin · NPC SDA Church' };

import { ListPanel } from '@/components/admin/ListPanel';
import { SECTIONS } from '@/components/admin/sections';

export default function Page() {
  const intro = SECTIONS.ministries.intro;
  return (
    <>
      {intro && <p className="page-intro">{intro}</p>}
      <ListPanel section="ministries" />
    </>
  );
}
