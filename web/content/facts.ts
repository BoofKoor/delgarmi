/**
 * Facts only the Delgarmi team can give. While a value is null the site shows a marked
 * placeholder (components/site/Missing.tsx), so nothing made up reaches a visitor unmarked.
 * Fill a value here and every page that uses it updates.
 */

export type Phone = { display: string; tel: string };

export const FACTS: {
  phone: Phone | null;
  hours: string | null;
  callback: string | null;
  legalName: string | null;
  address: string | null;
} = {
  /** Support line, e.g. { display: '۰۳۱ ۱۲۳۴ ۵۶۷۸', tel: '+983112345678' } */
  phone: null,
  /** Team hours, including nights and holidays, e.g. 'شنبه تا پنجشنبه، ۹ تا ۲۰' */
  hours: null,
  /** How soon the team calls after a request; only a promise the team can always keep. */
  callback: null,
  /** Registered company name, for the footer, about and terms. */
  legalName: null,
  /** Postal address for the contact page. */
  address: null,
};

export type FactName = keyof typeof FACTS;

/** What each placeholder is called, and the sample text it shows meanwhile. */
export const FACT_PLACEHOLDERS: Record<FactName, { what: string; sample: string }> = {
  phone: { what: 'شماره‌ی پشتیبانی', sample: '۰۳۱ ۰۰۰۰ ۰۰۰۰' },
  hours: { what: 'ساعت کاری تیم', sample: 'شنبه تا پنجشنبه، ۹ تا ۲۰' },
  callback: { what: 'زمان تماس بعد از ثبت درخواست', sample: 'در ساعت کاری، معمولاً همان روز' },
  legalName: { what: 'نام حقوقی شرکت', sample: 'شرکت …' },
  address: { what: 'نشانی دفتر', sample: 'اصفهان، …' },
};

/**
 * Text that is still a draft or still to be confirmed. The site shows it with a small tag
 * («پیش‌نویس» or «نیاز به تأیید») until it is settled: then delete the key here, and TypeScript
 * lists every place that pointed at it.
 */
export const PENDING_POLICIES = {
  price: { tag: 'پیش‌نویس', what: 'سیاست هزینه و پرداخت' },
  replace: { tag: 'پیش‌نویس', what: 'سیاست جایگزینی مراقب' },
  cancel: { tag: 'پیش‌نویس', what: 'سیاست لغو درخواست' },
  licences: { tag: 'نیاز به تأیید', what: 'مرجع مجوز' },
  scope: { tag: 'نیاز به تأیید', what: 'این فهرست را مراکز باید تأیید کنند' },
  meeting: { tag: 'پیش‌نویس', what: 'آشنایی با پرستار پیش از شروع' },
  online: { tag: 'پیش‌نویس', what: 'روش برگزاری جلسه‌ی آنلاین' },
  legal: { tag: 'پیش‌نویس', what: 'این متن بازبینی حقوقی لازم دارد' },
} as const;

export type PolicyKey = keyof typeof PENDING_POLICIES;
