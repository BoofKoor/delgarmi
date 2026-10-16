import { NotFoundBody } from '@/components/site/NotFoundBody';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import '@/styles/site.css';

/** Addresses that match no route at all: same header and footer as the rest of the site. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1}><NotFoundBody /></main>
      <SiteFooter />
    </>
  );
}
