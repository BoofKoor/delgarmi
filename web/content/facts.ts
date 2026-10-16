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
 * Answers that are policies the team and the partner centres still have to agree on.
 * They are shown as drafts (marked) until confirmed: then delete the key from here.
 */
export const PENDING_POLICIES = {
  price: 'سیاست هزینه و پرداخت',
  replace: 'سیاست جایگزینی مراقب',
  cancel: 'سیاست لغو درخواست',
  licences: 'مرجع مجوز هر خدمت',
  scope: 'فهرست کارها (تأیید مراکز)',
  meeting: 'آشنایی با پرستار پیش از شروع',
  online: 'روش برگزاری جلسه‌ی آنلاین',
  retention: 'مدت نگهداری اطلاعات',
  legal: 'بازبینی حقوقی متن',
} as const;

export type PolicyKey = keyof typeof PENDING_POLICIES;
