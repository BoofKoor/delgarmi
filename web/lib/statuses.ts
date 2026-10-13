/** Request statuses: the names are identical on the site, in SMS and in the team panel. */
export const STATUS_LABELS = {
  new: 'جدید',
  calling: 'در حال تماس',
  matching: 'در حال پیدا کردن مرکز',
  introduced: 'معرفی به مرکز',
  'in-service': 'در حال ارائه‌ی خدمت',
  done: 'پایان یافته',
  waitlist: 'لیست انتظار',
  cancelled: 'لغو شده',
} as const;

export type Status = keyof typeof STATUS_LABELS;
