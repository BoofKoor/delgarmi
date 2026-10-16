'use client';

import { useEffect } from 'react';

/** Gives the sticky header its shadow once the page has scrolled. */
export function ScrollShadow() {
  useEffect(() => {
    const header = document.getElementById('site-header');
    if (!header) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return null;
}
