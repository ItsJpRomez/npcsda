import type { Metadata } from 'next';
import './site.css';

export const metadata: Metadata = {
  title: 'NPC Seventh-day Adventist Church · Quezon City',
  description: 'NPC (Napocor) Seventh-day Adventist Church in Pasong Tamo, Quezon City. Service times, events, ministries, and how to visit us.',
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
