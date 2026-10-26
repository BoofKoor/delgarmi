'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { MENU_NAV } from '@/content/nav';
import { SERVICE_LIST } from '@/content/services';
import { Brand } from './Brand';

/**
 * The phone menu (design system v8 MobileMenu): a full-screen native modal dialog, so focus
 * stays inside and Esc closes it. It repeats the header row, with «بستن» where «منو» was, then
 * the four services, the other pages and the request button at the bottom.
 */
export function MobileMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => dialog.current?.close();

  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        className="dg-btn dg-btn--ghost menu-open"
        type="button"
        aria-haspopup="dialog"
        aria-controls="menu"
        aria-expanded={open}
        onClick={() => { dialog.current?.showModal(); setOpen(true); }}
      >
        <Menu aria-hidden="true" focusable="false" strokeWidth={1.75} />
        منو
      </button>
      <dialog ref={dialog} className="dg-menu" id="menu" aria-label="منو" onClose={() => setOpen(false)}>
        <div className="dg-menu-head">
          <div className="container dg-header-inner">
            <Brand onClick={close} />
            <div className="dg-header-actions">
              <button className="dg-btn dg-btn--ghost" type="button" aria-expanded="true" aria-controls="menu" onClick={close}>
                <X aria-hidden="true" focusable="false" strokeWidth={1.75} />
                بستن
              </button>
            </div>
          </div>
        </div>
        <nav className="dg-menu-nav container" aria-label="منوی اصلی">
          <h2 className="dg-menu-title" id="menu-services">خدمات</h2>
          <ul className="dg-menu-services" aria-labelledby="menu-services">
            {SERVICE_LIST.map((s) => {
              const href = `/services/${s.slug}`;
              return (
                <li key={s.slug}>
                  <Link href={href} onClick={close} aria-current={href === pathname ? 'page' : undefined}>
                    <s.icon aria-hidden="true" focusable="false" strokeWidth={1.75} />
                    {s.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ul>
            {MENU_NAV.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={close} aria-current={link.href === pathname ? 'page' : undefined}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="dg-bar">
          <Link className="dg-btn dg-btn--primary" href="/request" onClick={close}>ثبت درخواست</Link>
        </div>
      </dialog>
    </>
  );
}
