import { Phone, X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { FACTS } from '@/content/facts';
import { fa } from '@/lib/digits';
import { d2j, tehranToday } from '@/lib/jalali';
import { Brand } from './Brand';

/**
 * Design system v8 FlowShell, for the request form and «ثبت شد»: the logo, the support phone
 * (only once the number exists) and «خروج», a header that does not stick, and one line instead
 * of the site footer. Leaving keeps the answers on the device, as the form always does.
 */
export function FlowShell({ children }: { children: ReactNode }) {
  const year = d2j(tehranToday()).jy;
  return (
    <div className="dg-flow">
      <a className="skip" href="#main">رفتن به محتوای اصلی</a>
      <header className="container dg-flow-head">
        <Brand />
        {FACTS.phone ? (
          <a className="dg-btn dg-btn--ghost dg-btn--icon" href={`tel:${FACTS.phone.tel}`} aria-label="تماس با پشتیبانی">
            <Phone aria-hidden="true" focusable="false" strokeWidth={1.75} />
          </a>
        ) : null}
        <Link className="dg-btn dg-btn--ghost" href="/">
          <X aria-hidden="true" focusable="false" strokeWidth={1.75} />
          خروج
        </Link>
      </header>
      <main id="main" className="dg-flow-main" tabIndex={-1}>{children}</main>
      <footer className="container dg-flow-foot">
        <Link href="/privacy">حریم خصوصی</Link>
        <Link href="/terms">قوانین</Link>
        <span>© {fa(year)} {FACTS.legalName ?? 'دلگرمی'}</span>
      </footer>
    </div>
  );
}
