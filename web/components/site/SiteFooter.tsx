import { Clock, Phone } from 'lucide-react';
import Link from 'next/link';
import { LogoMark } from '@/components/ui';
import { FACTS } from '@/content/facts';
import { FOOTER_NAV } from '@/content/nav';
import { SERVICE_LIST } from '@/content/services';
import { d2j, tehranToday } from '@/lib/jalali';
import { fa } from '@/lib/digits';
import { Ic } from './Ic';
import { Fact, Missing, PhoneLink } from './Missing';

export function SiteFooter() {
  const year = d2j(tehranToday()).jy;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <Link className="brand" href="/" aria-label="دلگرمی، صفحه‌ی اصلی">
              <LogoMark className="brand-mark" size={44} />
              <span className="brand-name font-display" aria-hidden="true">دلگرمی</span>
            </Link>
            <p>درخواست مراقب سالمند، پرستار در منزل، پرستار کودک و روان‌درمانگر از مراکز دارای مجوز؛ روان‌درمانی آنلاین در همه‌ی ایران.</p>
          </div>
          <nav className="footer-col" aria-labelledby="footer-services">
            <h2 id="footer-services">خدمات</h2>
            {SERVICE_LIST.map((s) => <Link key={s.slug} href={`/services/${s.slug}`}>{s.name}</Link>)}
          </nav>
          <nav className="footer-col" aria-labelledby="footer-delgarmi">
            <h2 id="footer-delgarmi">دلگرمی</h2>
            {FOOTER_NAV.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          </nav>
          <div className="footer-col footer-contact">
            <h2>تماس</h2>
            <div className="row"><Ic icon={Phone} /><PhoneLink className="footer-phone" /></div>
            <div className="row"><Ic icon={Clock} /><span><Fact name="hours" /></span></div>
            <Missing what="نماد اعتماد الکترونیکی (اینماد)" block>
              <div className="enamad">نماد اعتماد<br />الکترونیکی</div>
            </Missing>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {fa(year)} {FACTS.legalName ?? 'دلگرمی'}. همه‌ی حقوق محفوظ است.</span>
          <span>delgarmi.com</span>
        </div>
      </div>
    </footer>
  );
}
