'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { LogoMark } from '@/components/ui';
import { MENU_NAV } from '@/content/nav';
import { PhoneLink } from './Missing';

/** The phone menu: a native modal dialog, so focus stays inside and Esc closes it. */
export function MobileMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const close = () => dialog.current?.close();

  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        className="menu-btn"
        type="button"
        aria-label="باز کردن منو"
        aria-haspopup="dialog"
        aria-controls="menu"
        onClick={() => dialog.current?.showModal()}
      >
        <Menu className="ic" strokeWidth={1.75} aria-hidden="true" focusable="false" />
      </button>
      <dialog
        ref={dialog}
        className="menu-sheet"
        id="menu"
        aria-label="منو"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="sheet-head">
          <Link className="brand" href="/" onClick={close} aria-label="دلگرمی، صفحه‌ی اصلی">
            <LogoMark className="brand-mark" size={44} />
            <span className="brand-name font-display" aria-hidden="true">دلگرمی</span>
          </Link>
          <button className="menu-btn" type="button" aria-label="بستن منو" onClick={close}>
            <X className="ic" strokeWidth={1.75} aria-hidden="true" focusable="false" />
          </button>
        </div>
        <nav aria-label="منوی موبایل">
          {MENU_NAV.map((link) => (
            <Link key={link.href} href={link.href} onClick={close} aria-current={link.href === pathname ? 'page' : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="sheet-foot">
          <Link className="dg-btn dg-btn--primary dg-btn--lg" href="/request" onClick={close}>ثبت درخواست</Link>
          <PhoneLink className="dg-btn dg-btn--secondary" withIcon label="تماس با پشتیبانی" button />
        </div>
      </dialog>
    </>
  );
}
