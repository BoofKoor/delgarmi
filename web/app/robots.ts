import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { SITE_URL } from '@/lib/site';

const PUBLIC_HOSTS = new Set(['delgarmi.com', 'www.delgarmi.com']);

/** Only the public domain may be crawled; the test server and anything else say no to all. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = ((await headers()).get('host') ?? '').toLowerCase().replace(/:\d+$/, '');
  if (!PUBLIC_HOSTS.has(host)) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/request', '/track'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
