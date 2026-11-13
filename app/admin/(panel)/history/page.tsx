export const metadata = { title: 'Church history · Admin · NPC SDA Church' };

import { ListPanel } from '@/components/admin/ListPanel';
import { SinglePanel } from '@/components/admin/SinglePanel';

export default function Page() {
  return <SinglePanel section="history" after={<section className="panel"><ListPanel section="milestones" compact /></section>} />;
}
