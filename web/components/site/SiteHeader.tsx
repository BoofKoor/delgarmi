import Link from 'next/link';
import { Brand } from './Brand';
import { MainNav } from './MainNav';
import { MobileMenu } from './MobileMenu';
import { ScrollShadow } from './ScrollShadow';

/** Design system v8 Header: page colour, no corners, a shadow once the page scrolls; 56px on phones. */
export function SiteHeader() {
  return (
    <header className="dg-header" id="site-header">
      <div className="container dg-header-inner">
        <Brand />
        <MainNav />
        <div className="dg-header-actions">
          <Link className="dg-btn dg-btn--ghost header-wide" href="/track">پیگیری درخواست</Link>
          <Link className="dg-btn dg-btn--primary header-wide" href="/request">ثبت درخواست</Link>
          <MobileMenu />
        </div>
      </div>
      <ScrollShadow />
    </header>
  );
}
