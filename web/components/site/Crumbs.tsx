import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { SITE_URL } from '@/lib/site';
import { JsonLd } from './JsonLd';

export type Crumb = { label: string; href?: string };

/**
 * «خانه › خدمات › مراقبت سالمند» (design system v8 Breadcrumb: every link 48px high and at
 * least 44px wide), plus the same path for search engines.
 */
export function Crumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: 'خانه', href: '/' }, ...items];
  return (
    <>
      <nav className="dg-crumbs" aria-label="مسیر صفحه">
        <ol>
          {all.map((item, i) => (
            <li key={item.label}>
              {item.href && i < all.length - 1 ? (
                <>
                  <Link href={item.href}>{item.label}</Link>
                  <ChevronLeft aria-hidden="true" focusable="false" strokeWidth={1.75} />
                </>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: all.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.label,
            ...(item.href ? { item: new URL(item.href, SITE_URL).href } : {}),
          })),
        }}
      />
    </>
  );
}
