'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cx } from '@/lib/cx';

/**
 * Phones only: once the page's main button (`after`) has scrolled away, the same action sticks
 * to the bottom of the screen; it steps aside while any `hideWhile` section is on screen.
 */
export function StickyCta({ href, label, after, hideWhile = [] }: { href: string; label: string; after: string; hideWhile?: string[] }) {
  const [shown, setShown] = useState(false);
  const hideKey = hideWhile.join(' ');

  useEffect(() => {
    const anchor = document.getElementById(after);
    if (!anchor) return;
    const watched = [anchor, ...hideKey.split(' ').filter(Boolean).map((id) => document.getElementById(id))].filter(
      (el): el is HTMLElement => el !== null,
    );
    const onScreen = new Map<Element, boolean>();
    // While someone types (the phone keyboard is up), the bar would cover suggestions.
    const typing = () => document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;
    const update = () => {
      const passed = anchor.getBoundingClientRect().bottom < 0;
      setShown(passed && !typing() && !watched.some((el) => onScreen.get(el)));
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) onScreen.set(entry.target, entry.isIntersecting);
      update();
    });
    watched.forEach((el) => observer.observe(el));
    window.addEventListener('scroll', update, { passive: true });
    // Focus has settled only after the focus events, so look a moment later.
    const later = () => window.setTimeout(update, 0);
    document.addEventListener('focusin', later);
    document.addEventListener('focusout', later);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
      document.removeEventListener('focusin', later);
      document.removeEventListener('focusout', later);
    };
  }, [after, hideKey]);

  return (
    <div className={cx('sticky-cta', shown && 'is-shown')} data-sticky={after}>
      <Link className="dg-btn dg-btn--primary dg-btn--lg" href={href}>{label}</Link>
    </div>
  );
}
