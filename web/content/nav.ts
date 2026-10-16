export type NavLink = { href: string; label: string };

/** Header navigation (desktop) and the first part of the phone menu. */
export const MAIN_NAV: NavLink[] = [
  { href: '/#services', label: 'خدمات' },
  { href: '/how-we-vet', label: 'روش انتخاب مراکز' },
  { href: '/cities', label: 'شهرها' },
  { href: '/faq', label: 'سؤال‌های پرتکرار' },
];

export const MENU_NAV: NavLink[] = [
  { href: '/#services', label: 'خدمات' },
  { href: '/how-we-vet', label: 'روش انتخاب مراکز' },
  { href: '/cities', label: 'شهرها' },
  { href: '/faq', label: 'سؤال‌های پرتکرار' },
  { href: '/track', label: 'پیگیری درخواست' },
  { href: '/contact', label: 'تماس با ما' },
];

/** Footer: two short columns instead of one long one. */
export const FOOTER_NAV: { title: string; links: NavLink[] }[] = [
  {
    title: 'دلگرمی',
    links: [
      { href: '/how-we-vet', label: 'روش انتخاب مراکز' },
      { href: '/cities', label: 'شهرها' },
      { href: '/faq', label: 'سؤال‌های پرتکرار' },
      { href: '/track', label: 'پیگیری درخواست' },
    ],
  },
  {
    title: 'اطلاعات',
    links: [
      { href: '/about', label: 'درباره‌ی ما' },
      { href: '/contact', label: 'تماس با ما' },
      { href: '/privacy', label: 'حریم خصوصی' },
      { href: '/terms', label: 'قوانین' },
    ],
  },
];
