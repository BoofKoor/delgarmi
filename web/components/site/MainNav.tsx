'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MAIN_NAV } from '@/content/nav';

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav className="main-nav" aria-label="منوی اصلی">
      {MAIN_NAV.map((link) => (
        <Link key={link.href} href={link.href} aria-current={link.href === pathname ? 'page' : undefined}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
