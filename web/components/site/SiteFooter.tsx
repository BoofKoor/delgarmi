import { Clock } from 'lucide-react';
import Link from 'next/link';
import { FACTS } from '@/content/facts';
import { FOOTER_NAV } from '@/content/nav';
import { fa } from '@/lib/digits';
import { d2j, tehranToday } from '@/lib/jalali';
import { Brand } from './Brand';
import { Fact, PhoneLink } from './Missing';

/** Design system v8 Footer: about 600px on a phone; links in two columns, contact full width beside the trust badge. */
export function SiteFooter() {
  const year = d2j(tehranToday()).jy;
  return (
    <footer className="dg-footer">
      <div className="container">
        <div className="dg-footer-grid">
          <div className="dg-footer-about">
            <Brand />
            <p>درخواست مراقب سالمند، پرستار در منزل، پرستار کودک و روان‌درمانگر از مراکز دارای مجوز؛ روان‌درمانی آنلاین در همه‌ی ایران.</p>
          </div>
          <nav aria-label="پیوندهای پانویس">
            <ul className="dg-footer-links">
              {FOOTER_NAV.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
            </ul>
          </nav>
          <div className="dg-footer-contact">
            <div>
              <PhoneLink className="dg-footer-row" withIcon />
              <p className="dg-footer-row"><Clock aria-hidden="true" focusable="false" strokeWidth={1.75} /><span><Fact name="hours" /></span></p>
            </div>
            <div className="dg-enamad" role="img" aria-label="جای نماد اعتماد الکترونیکی" title="جای خالی: نماد اعتماد الکترونیکی (اینماد)">جای نماد اعتماد</div>
          </div>
        </div>
        <div className="dg-footer-bottom">
          <p>© {fa(year)} {FACTS.legalName ?? 'دلگرمی'}. همه‌ی حقوق محفوظ است.</p>
          <p>delgarmi.com</p>
        </div>
      </div>
    </footer>
  );
}
