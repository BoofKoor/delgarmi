export type NavLink = { href: string; label: string };

/** Header navigation from bp-lg (desktop). */
export const MAIN_NAV: NavLink[] = [
  { href: '/#services', label: 'خدمات' },
  { href: '/how-we-vet', label: 'روش انتخاب مراکز' },
  { href: '/cities', label: 'شهرها' },
  { href: '/faq', label: 'سؤال‌های پرتکرار' },
];

/** The phone menu, under the four services. */
export const MENU_NAV: NavLink[] = [
  { href: '/how-we-vet', label: 'روش انتخاب مراکز' },
  { href: '/cities', label: 'شهرها' },
  { href: '/faq', label: 'سؤال‌های پرتکرار' },
  { href: '/track', label: 'پیگیری درخواست' },
  { href: '/contact', label: 'تماس با ما' },
];

/**
 * Footer links in two columns (design system v8): the site's pages, then the information pages.
 * The four services are in the menu and on the home page, so the footer does not repeat them.
 */
export const FOOTER_NAV: NavLink[] = [
  { href: '/how-we-vet', label: 'روش انتخاب مراکز' },
  { href: '/cities', label: 'شهرها' },
  { href: '/faq', label: 'سؤال‌های پرتکرار' },
  { href: '/track', label: 'پیگیری درخواست' },
  { href: '/about', label: 'درباره‌ی ما' },
  { href: '/contact', label: 'تماس با ما' },
  { href: '/privacy', label: 'حریم خصوصی' },
  { href: '/terms', label: 'قوانین' },
];
