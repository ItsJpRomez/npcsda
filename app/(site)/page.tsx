import { IconSprite } from '@/components/Icon';
import { RevealObserver } from '@/components/site/Interactive';
import { SiteHeader } from '@/components/site/SiteHeader';
import {
  About, BuildingFund, Events, Footer, GallerySection, Giving, Hero, Ministries, Officers, Resources, Services, Visit,
} from '@/components/site/Sections';
import { getSiteContent } from '@/lib/content';

/* The page is cached and rebuilt in the background at most every 5 minutes.
   Saving in the Admin Panel refreshes it straight away (app/admin/actions.ts). */
export const revalidate = 300;

export default async function HomePage() {
  const c = await getSiteContent();
  const now = Date.now();
  return (
    <>
      <IconSprite />
      <RevealObserver />
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader shortName={c.info.short_name || c.info.name} />
      <main id="main">
        <Hero c={c} />
        <Services c={c} />
        <About c={c} />
        <Events c={c} now={now} />
        <Ministries c={c} />
        <Resources c={c} />
        <BuildingFund c={c} />
        <Giving c={c} />
        <GallerySection c={c} />
        <Officers c={c} />
        <Visit c={c} />
      </main>
      <Footer c={c} year={new Date(now).getFullYear()} />
    </>
  );
}
