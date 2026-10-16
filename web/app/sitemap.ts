import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { SERVICE_SLUGS } from '@/content/services';
import { getCities } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

const PAGES = ['/', ...SERVICE_SLUGS.map((s) => `/services/${s}`), '/how-we-vet', '/cities', '/faq', '/about', '/contact', '/privacy', '/terms'];

/** Every public page, plus the pages of cities where an in-person service is active
 * (the others are noindex until then). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // per request: the city list changes in the panel
  const pages = PAGES.map((path) => ({ url: new URL(path, SITE_URL).href }));
  try {
    const cities = (await getCities()).filter((c) => c.slug && c.active.length > 0);
    return [...pages, ...cities.map((c) => ({ url: `${SITE_URL}/cities/${c.slug}` }))];
  } catch (error) {
    console.error('sitemap: city list unavailable', error);
    return pages;
  }
}
