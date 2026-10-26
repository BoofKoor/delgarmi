'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cx } from '@/lib/cx';
import { typingWithKeyboard, watchTyping } from '@/lib/keyboard';

/**
 * Phones and tablets (design system v8 StickyBar, 72px): once the page's main button (`after`)
 * has scrolled away, the same action sticks to the bottom of the screen; it steps aside while
 * any `hideWhile` section is on screen, and while someone types (the keyboard is up).
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
    const update = () => {
      const passed = anchor.getBoundingClientRect().bottom < 0;
      setShown(passed && !typingWithKeyboard() && !watched.some((el) => onScreen.get(el)));
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) onScreen.set(entry.target, entry.isIntersecting);
      update();
    });
    watched.forEach((el) => observer.observe(el));
    window.addEventListener('scroll', update, { passive: true });
    const stopWatching = watchTyping(update);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
      stopWatching();
    };
  }, [after, hideKey]);

  return (
    <div className={cx('dg-bar dg-bar--page', shown && 'is-shown')} data-sticky={after}>
      <Link className="dg-btn dg-btn--primary" href={href}>{label}</Link>
    </div>
  );
}
