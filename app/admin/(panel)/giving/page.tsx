export const metadata = { title: 'Tithes & offerings · Admin · NPC SDA Church' };

import { ListPanel } from '@/components/admin/ListPanel';
import { SinglePanel } from '@/components/admin/SinglePanel';

export default function Page() {
  return <SinglePanel section="giving" after={<section className="panel"><ListPanel section="giving_methods" compact /></section>} />;
}
