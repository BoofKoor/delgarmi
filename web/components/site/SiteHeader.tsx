import Link from 'next/link';
import { LogoMark } from '@/components/ui';
import { MainNav } from './MainNav';
import { MobileMenu } from './MobileMenu';
import { ScrollShadow } from './ScrollShadow';

export function SiteHeader() {
  return (
    <header className="site-header" id="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="دلگرمی، صفحه‌ی اصلی">
          <LogoMark className="brand-mark" size={44} />
          <span className="brand-name font-display" aria-hidden="true">دلگرمی</span>
        </Link>
        <MainNav />
        <div className="header-actions">
          <Link className="header-link track-link" href="/track">پیگیری درخواست</Link>
          <Link className="dg-btn dg-btn--primary header-cta" href="/request">ثبت درخواست</Link>
          <MobileMenu />
        </div>
      </div>
      <ScrollShadow />
    </header>
  );
}
