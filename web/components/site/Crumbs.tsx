import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Fragment } from 'react';
import { SITE_URL } from '@/lib/site';
import { JsonLd } from './JsonLd';

export type Crumb = { label: string; href?: string };

/** «خانه › خدمات › مراقبت سالمند», plus the same path for search engines. */
export function Crumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: 'خانه', href: '/' }, ...items];
  return (
    <>
      <nav className="crumbs" aria-label="مسیر صفحه">
        {all.map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 ? <ChevronLeft className="ic" strokeWidth={1.75} aria-hidden="true" focusable="false" /> : null}
            {item.href && i < all.length - 1 ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </Fragment>
        ))}
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
