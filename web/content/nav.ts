export type NavLink = { href: string; label: string };

/** Header navigation (desktop) and the first part of the phone menu. */
export const MAIN_NAV: NavLink[] = [
  { href: '/#services', label: 'خدمات' },
  { href: '/how-we-vet', label: 'چطور انتخاب می‌کنیم' },
  { href: '/cities', label: 'شهرها' },
  { href: '/faq', label: 'سؤال‌های پرتکرار' },
];

export const MENU_NAV: NavLink[] = [
  { href: '/#services', label: 'خدمات' },
  { href: '/how-we-vet', label: 'چطور مراکز را انتخاب می‌کنیم' },
  { href: '/cities', label: 'شهرها' },
  { href: '/faq', label: 'سؤال‌های پرتکرار' },
  { href: '/track', label: 'پیگیری درخواست' },
  { href: '/contact', label: 'تماس با ما' },
];

export const FOOTER_NAV: NavLink[] = [
  { href: '/how-we-vet', label: 'چطور مراکز را انتخاب می‌کنیم' },
  { href: '/cities', label: 'شهرها' },
  { href: '/track', label: 'پیگیری درخواست' },
  { href: '/faq', label: 'سؤال‌های پرتکرار' },
  { href: '/about', label: 'درباره‌ی ما' },
  { href: '/contact', label: 'تماس با ما' },
  { href: '/privacy', label: 'حریم خصوصی' },
  { href: '/terms', label: 'قوانین' },
];
