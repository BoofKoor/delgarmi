/** The public address; canonical links and structured data point here, also on the test server. */
export const SITE_URL = 'https://delgarmi.com';
export const SITE_NAME = 'دلگرمی';

/** Link-preview fields every page shares; a page that sets its own openGraph spreads these in. */
export const BASE_OG = { siteName: SITE_NAME, locale: 'fa_IR', type: 'website' } as const;
