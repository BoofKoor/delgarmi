import { Baby, Check, Clock, HeartHandshake, MapPin, MessageCircleHeart, Minus, Stethoscope, Video, type LucideIcon } from 'lucide-react';
import type { PolicyKey } from './facts';

/**
 * The four services, in this order everywhere. The design system fixes their names, so the site
 * takes them from here and its service pages are static; which service is active in which city
 * comes from the API (the panel).
 */
export const SERVICE_SLUGS = ['elderly-care', 'home-nursing', 'child-care', 'therapy'] as const;
export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export function isServiceSlug(value: unknown): value is ServiceSlug {
  return typeof value === 'string' && (SERVICE_SLUGS as readonly string[]).includes(value);
}

export type Photo = { src: string; alt: string; width: number; height: number };
export type Choice = { title: string; meta: string; text: string; href: string };
export type Link = { href: string; label: string };
export type FaqItem = { q: string; a: string; pending?: PolicyKey; link?: Link };

export type ServiceContent = {
  slug: ServiceSlug;
  name: string;
  /** One line on the home card. */
  text: string;
  icon: LucideIcon;
  /** Available online in every city; in person only where switched on (therapy). */
  onlineEverywhere?: boolean;
  /** Overrides for steps 3 and 4 of the after-request flow. */
  flow?: { title: string; text: string }[];
  /** Photo on the home card and in «خدمات دیگر». */
  card: Photo;
  /** One line under the name in «خدمات دیگر». */
  short: string;
  title: string;
  /** Pofak is allowed on the child-care page only (design system). */
  displayTitle?: boolean;
  metaTitle: string;
  description: string;
  lead: string;
  checks: string[];
  cta: string;
  photo: Photo;
  /** Link preview in messengers (public/images/og). */
  og: { width: number; height: number };
  /** Shown under the hero, e.g. «not for emergencies». */
  warning?: { title: string; text: string; numbers: { label: string; tel: string }[] };
  /** `metaIcon` goes before each card's second line when that line is about time. */
  choices: { title: string; intro: string; metaIcon?: LucideIcon; items: Choice[] };
  scope: {
    title: string;
    intro: string;
    /** «yes» items are ticked in green; «other» items point elsewhere; «plain» is neutral. */
    /** In `note`, the words of `link.label` become the link. */
    columns: { title: string; items: string[]; icon: LucideIcon; tone: 'yes' | 'other' | 'plain'; note?: string; link?: Link }[];
    photo?: Photo;
    pending?: PolicyKey;
  };
  /** An extra short section, e.g. how the nanny is chosen. */
  more?: { title: string; paragraphs: string[]; pending?: PolicyKey };
  faq: FaqItem[];
};

const request = (slug: ServiceSlug, extra = '') => `/request?service=${slug}${extra}`;

export const SERVICES: Record<ServiceSlug, ServiceContent> = {
  'elderly-care': {
    slug: 'elderly-care',
    og: { width: 1200, height: 630 },
    name: 'مراقبت سالمند',
    text: 'همراه و مراقب آموزش‌دیده، ساعتی یا شبانه‌روزی.',
    icon: HeartHandshake,
    card: { src: '/images/card-elderly.webp', alt: 'دست سالمند روی دست جوان‌تر، کنار پنجره‌ای با نرده‌ی مشبک', width: 800, height: 600 },
    short: 'ساعتی، روزانه، شبانه یا شبانه‌روزی',
    title: 'مراقبت سالمند در خانه',
    metaTitle: 'مراقبت سالمند در منزل',
    description: 'مراقب سالمند آموزش‌دیده از مراکز دارای مجوز، ساعتی، روزانه، شبانه یا شبانه‌روزی. درخواست بدون ثبت‌نام، با پیگیری تا شروع کار.',
    lead: 'مراقب آموزش‌دیده برای همراهی و کمک در کارهای روزانه، در خانه‌ی خود عزیزتان. ساعتی، روزانه، شبانه یا شبانه‌روزی.',
    checks: ['فقط از مراکز دارای مجوز', 'مراقب خانم یا آقا؛ ترجیحتان را می‌پرسیم', 'وضعیت درخواست را در صفحه‌ی پیگیری می‌بینید، از ثبت تا شروع کار'],
    cta: 'درخواست مراقب سالمند',
    photo: { src: '/images/service-hero.webp', alt: 'پدربزرگی کنار دو نوه‌اش در اتاق خانه، کنار کرسی با سبزه‌ی عید', width: 1200, height: 800 },
    choices: {
      title: 'چه نوع مراقبتی لازم دارید؟',
      metaIcon: Clock,
      intro: 'اگر مطمئن نیستید، یکی را انتخاب کنید. همکار ما در تماس کمک می‌کند بهترین گزینه را پیدا کنید.',
      items: [
        { title: 'ساعتی', meta: 'چند ساعت در روز، چند روز در هفته', text: 'وقتی بیشتر روز کسی کنار عزیزتان هست و فقط برای ساعت‌هایی همراه لازم دارد.', href: request('elderly-care', '&type=hourly') },
        { title: 'روزانه', meta: 'از صبح تا عصر', text: 'وقتی اعضای خانواده سر کار هستند و عزیزتان نباید تمام روز تنها بماند.', href: request('elderly-care', '&type=day') },
        { title: 'شبانه', meta: 'از شب تا صبح', text: 'وقتی شب‌ها برای رفتن به دستشویی یا خوردن دارو کمک لازم است، یا عزیزتان بی‌خواب است.', href: request('elderly-care', '&type=night') },
        { title: 'شبانه‌روزی', meta: 'مراقب در خانه می‌ماند', text: 'وقتی عزیزتان در بیشتر کارها کمک لازم دارد یا بستری است.', href: request('elderly-care', '&type=live-in') },
      ],
    },
    scope: {
      title: 'مراقب سالمند چه کارهایی انجام می‌دهد؟',
      intro: 'مراقب سالمند برای همراهی و کارهای روزانه است. کارهای بالینی را پرستار انجام می‌دهد.',
      columns: [{
        tone: 'yes', icon: Check,
        title: 'کارهای مراقب',
        items: [
          'کمک در غذا خوردن و آماده کردن غذای ساده',
          'کمک در حمام، لباس پوشیدن و نظافت شخصی',
          'کمک در راه رفتن و جابه‌جایی',
          'یادآوری داروها طبق برنامه‌ی پزشک',
          'همراهی در خانه و بیرون، مثل رفتن به مطب',
        ],
      },
      {
        tone: 'other', icon: Stethoscope,
        title: 'این‌ها پرستار لازم دارد',
        items: ['تزریق و سرم', 'پانسمان زخم', 'سوند و مراقبت بعد از ترخیص'],
        note: 'برای این کارها پرستاری در منزل را درخواست کنید. اگر هر دو را لازم دارید، در تماس بگویید.',
        link: { href: '/services/home-nursing', label: 'پرستاری در منزل' },
      }],
      photo: { src: '/images/caregiver.webp', alt: 'زن سالمندی با چادر سفید گلدار که لبخند می‌زند', width: 800, height: 1000 },
      pending: 'scope',
    },
    faq: [
      { q: 'می‌توانم مراقب خانم یا آقا انتخاب کنم؟', a: 'بله. در فرم درخواست ترجیحتان را می‌پرسیم و مرکزی را انتخاب می‌کنیم که بتواند همین را معرفی کند.' },
      { q: 'مراقب کارهای بالینی مثل تزریق هم انجام می‌دهد؟', a: 'خیر. برای تزریق، سرم و پانسمان، پرستاری در منزل را درخواست کنید.' },
      { q: 'هزینه‌ی مراقبت چطور تعیین می‌شود؟', a: 'مرکز پیش از شروع کار، هزینه را بر اساس نوع مراقبت، ساعت‌ها و شهر اعلام می‌کند.', pending: 'price' },
      { q: 'اگر مراقب مناسب نبود چه می‌شود؟', a: 'به ما خبر دهید. از مرکز می‌خواهیم مراقب دیگری معرفی کند، یا مرکز دیگری را پیشنهاد می‌کنیم.', pending: 'replace' },
    ],
  },

  'home-nursing': {
    slug: 'home-nursing',
    og: { width: 800, height: 420 },
    name: 'پرستاری در منزل',
    text: 'تزریق، سرم، پانسمان و مراقبت بعد از ترخیص.',
    icon: Stethoscope,
    card: { src: '/images/card-nursing.webp', alt: 'گوشی پزشکی و فشارسنج روی ملافه‌ی تخت', width: 800, height: 600 },
    short: 'تزریق، سرم، پانسمان',
    title: 'پرستاری در منزل',
    metaTitle: 'پرستاری در منزل: تزریق، سرم و پانسمان',
    description: 'پرستار از مراکز پرستاری در منزل دارای مجوز دانشگاه علوم پزشکی، برای تزریق، سرم، پانسمان، سوند و مراقبت بعد از ترخیص در خانه‌ی شما.',
    lead: 'پرستار از مرکز پرستاری دارای مجوز برای تزریق، سرم، پانسمان و مراقبت بعد از ترخیص، در خانه‌ی خودتان. برای یک بار یا یک دوره‌ی درمان.',
    checks: ['فقط از مراکز دارای مجوز دانشگاه علوم پزشکی', 'کارهای بالینی طبق دستور پزشک', 'پرستار خانم یا آقا؛ ترجیحتان را می‌پرسیم'],
    cta: 'درخواست پرستار',
    photo: { src: '/images/card-nursing.webp', alt: 'گوشی پزشکی و فشارسنج روی ملافه‌ی تخت', width: 800, height: 600 },
    warning: {
      title: 'پرستاری در منزل برای شرایط اورژانسی نیست',
      text: 'اگر حال بیمار ناگهان بد شده، منتظر پرستار نمانید و همین حالا تماس بگیرید:',
      numbers: [{ label: 'اورژانس ۱۱۵', tel: '115' }],
    },
    choices: {
      title: 'چه خدمتی لازم دارید؟',
      intro: 'اگر چند کار لازم است، در فرم همه را انتخاب کنید. همکار ما جزئیات را در تماس می‌پرسد.',
      items: [
        { title: 'تزریق', meta: 'عضلانی، وریدی یا زیرجلدی', text: 'تزریق دارو در خانه طبق نسخه، برای یک بار یا یک دوره.', href: request('home-nursing', '&task=injection') },
        { title: 'سرم', meta: 'وصل سرم طبق دستور پزشک', text: 'وصل کردن سرم در خانه و مراقبت از بیمار در زمان تزریق آن.', href: request('home-nursing', '&task=iv') },
        { title: 'پانسمان', meta: 'زخم جراحی، زخم بستر و زخم‌های دیگر', text: 'تمیز کردن و پانسمان زخم و آموزش مراقبت از آن به خانواده.', href: request('home-nursing', '&task=dressing') },
        { title: 'مراقبت بعد از ترخیص', meta: 'بعد از جراحی یا بستری', text: 'وقتی بیمار به خانه برگشته و چند روز مراقبت پرستاری لازم دارد.', href: request('home-nursing', '&task=post-discharge') },
      ],
    },
    scope: {
      title: 'پرستار چه کارهایی انجام می‌دهد؟',
      intro: 'پرستار کارهای بالینی را طبق دستور پزشک انجام می‌دهد. همراهی و کارهای روزانه کار مراقب سالمند است.',
      columns: [{
        tone: 'yes', icon: Check,
        title: 'کارهای پرستار',
        items: [
          'تزریق و وصل سرم طبق نسخه',
          'پانسمان و مراقبت از زخم',
          'گذاشتن و تعویض سوند',
          'کنترل فشار خون، قند و علائم حیاتی',
          'آموزش مراقبت به خانواده',
        ],
      },
      {
        tone: 'other', icon: HeartHandshake,
        title: 'این‌ها مراقب سالمند لازم دارد',
        items: ['همراهی و کمک در کارهای روزانه', 'کمک در حمام، غذا خوردن و جابه‌جایی', 'ماندن شبانه یا شبانه‌روزی کنار بیمار'],
        note: 'برای این کارها مراقبت سالمند را درخواست کنید. اگر هر دو را لازم دارید، در تماس بگویید.',
        link: { href: '/services/elderly-care', label: 'مراقبت سالمند' },
      }],
      pending: 'scope',
    },
    more: {
      title: 'دستور پزشک لازم است؟',
      paragraphs: [
        'بله، برای تزریق، سرم و بیشتر کارهای بالینی لازم است؛ پرستار فقط طبق دستور کتبی پزشک کار می‌کند. نسخه یا دستور پزشک را آماده نگه دارید.',
        'حتی اگر دستور پزشک ندارید، درخواست بدهید؛ در تماس راهنمایی‌تان می‌کنیم.',
      ],
    },
    faq: [
      { q: 'برای تزریق دستور پزشک لازم است؟', a: 'بله. پرستار تزریق و سرم را فقط طبق نسخه یا دستور کتبی پزشک انجام می‌دهد.' },
      { q: 'پرستار چقدر زود می‌آید؟', a: 'به شهر و ساعت درخواست بستگی دارد. همکار ما در تماس زمان تقریبی را می‌گوید. اگر حال بیمار بد است، با اورژانس ۱۱۵ تماس بگیرید.' },
      { q: 'هزینه چطور تعیین می‌شود؟', a: 'مرکز پیش از شروع کار، هزینه را بر اساس نوع خدمت، تعداد دفعات و شهر اعلام می‌کند.', pending: 'price' },
      { q: 'می‌توانم پرستار خانم یا آقا انتخاب کنم؟', a: 'بله. در فرم درخواست ترجیحتان را می‌پرسیم و مرکزی را انتخاب می‌کنیم که بتواند همین را معرفی کند.' },
    ],
  },

  'child-care': {
    slug: 'child-care',
    og: { width: 800, height: 420 },
    name: 'پرستار کودک',
    text: 'نگهداری از کودک در خانه، چند ساعت، تمام روز یا شبانه‌روزی.',
    icon: Baby,
    card: { src: '/images/card-child.webp', alt: 'کودکی خندان که سرش را به صورت زنی با روسری سبز تکیه داده است', width: 800, height: 600 },
    short: 'چند ساعت تا شبانه‌روزی',
    title: 'پرستار کودک، با دلِ آسوده',
    displayTitle: true,
    metaTitle: 'پرستار کودک در منزل',
    description: 'پرستار کودک از مراکز دارای مجوز برای نگهداری از کودک در خانه‌ی شما؛ چند ساعت در روز، تمام روز یا شبانه‌روزی.',
    lead: 'پرستار آموزش‌دیده برای نگهداری از کودک در خانه‌ی خودتان؛ چند ساعت در روز، تمام روز یا شبانه‌روزی.',
    checks: ['فقط از مراکز دارای مجوز', 'پرستار متناسب با سن فرزندتان', 'وضعیت درخواست را در صفحه‌ی پیگیری می‌بینید، از ثبت تا شروع کار'],
    cta: 'درخواست پرستار کودک',
    photo: { src: '/images/card-child.webp', alt: 'کودکی خندان که سرش را به صورت زنی با روسری سبز تکیه داده است', width: 800, height: 600 },
    choices: {
      title: 'چه ساعت‌هایی پرستار لازم دارید؟',
      metaIcon: Clock,
      intro: 'اگر هنوز مطمئن نیستید، نزدیک‌ترین را انتخاب کنید؛ در تماس دقیق‌ترش می‌کنیم.',
      items: [
        { title: 'چند ساعت در روز', meta: 'مثلاً عصرها یا وقتی بیرون هستید', text: 'برای ساعت‌هایی که سر کار یا بیرون از خانه هستید.', href: request('child-care', '&hours=few') },
        { title: 'تمام روز', meta: 'از صبح تا عصر', text: 'وقتی تمام روز سر کار هستید و کودک در خانه می‌ماند.', href: request('child-care', '&hours=day') },
        { title: 'شبانه‌روزی', meta: 'پرستار در خانه می‌ماند', text: 'وقتی کسی را لازم دارید که شب‌ها هم کنار کودک بماند، مثلاً برای نوزاد.', href: request('child-care', '&hours=live-in') },
      ],
    },
    scope: {
      title: 'پرستار کودک چه کارهایی انجام می‌دهد؟',
      intro: 'پرستار کودک فقط برای خود کودک است: نگهداری، غذا، خواب و بازی.',
      columns: [{
        tone: 'yes', icon: Check,
        title: 'کارهای پرستار کودک',
        items: [
          'نگهداری از کودک و بازی با او',
          'آماده کردن غذای کودک و غذا دادن',
          'حمام، تعویض پوشک و خواباندن',
          'همراهی تا مدرسه، مهدکودک یا پارک',
        ],
      },
      {
        tone: 'other', icon: Minus,
        title: 'این‌ها جزو کار پرستار کودک نیست',
        items: ['نظافت خانه و آشپزی برای همه‌ی خانواده', 'مراقبت پزشکی از کودک بیمار'],
        note: 'برای تزریق یا مراقبت پزشکی از کودک، پرستاری در منزل را درخواست کنید.',
        link: { href: '/services/home-nursing', label: 'پرستاری در منزل' },
      }],
      pending: 'scope',
    },
    more: {
      title: 'پرستار چطور انتخاب می‌شود؟',
      paragraphs: [
        'سن کودکان، ساعت‌ها و ترجیح شما را به مرکز می‌گوییم و از آن می‌خواهیم پرستاری معرفی کند که با کودکانی هم‌سن فرزندانتان کار کرده است؛ برای نوزاد، پرستاری با تجربه‌ی نگهداری از نوزاد.',
        'پیش از شروع کار می‌توانید با پرستار آشنا شوید و سؤال‌هایتان را بپرسید.',
      ],
      pending: 'meeting',
    },
    faq: [
      { q: 'می‌توانم پیش از شروع با پرستار آشنا شوم؟', a: 'بله. زمان آشنایی را مرکز با شما هماهنگ می‌کند.', pending: 'meeting' },
      { q: 'برای نوزاد هم پرستار پیدا می‌شود؟', a: 'بله. در فرم سن کودکان را می‌پرسیم و از مرکز می‌خواهیم پرستاری با تجربه‌ی نگهداری از نوزاد معرفی کند.' },
      { q: 'هزینه چطور تعیین می‌شود؟', a: 'مرکز پیش از شروع کار، هزینه را بر اساس ساعت‌ها، تعداد کودکان و شهر اعلام می‌کند.', pending: 'price' },
      { q: 'اگر پرستار مناسب نبود چه می‌شود؟', a: 'به ما خبر دهید. از مرکز می‌خواهیم پرستار دیگری معرفی کند، یا مرکز دیگری را پیشنهاد می‌کنیم.', pending: 'replace' },
    ],
  },

  therapy: {
    slug: 'therapy',
    og: { width: 800, height: 420 },
    name: 'روان‌درمانی',
    text: 'جلسه‌ی آنلاین یا حضوری با درمانگر دارای پروانه.',
    icon: MessageCircleHeart,
    onlineEverywhere: true,
    flow: [
      { title: 'ثبت درخواست', text: 'نوع جلسه، برای چه کسی، و اگر خواستید موضوع.' },
      { title: 'تماس همکار دلگرمی', text: 'ترجیح‌هایتان را می‌پرسیم و به سؤال‌هایتان جواب می‌دهیم.' },
      { title: 'معرفی درمانگر', text: 'درمانگری دارای پروانه که با همین گروه کار کرده است.' },
      { title: 'جلسه‌ی اول', text: 'زمان و هزینه‌ی جلسه را پیش از شروع با شما قطعی می‌کنند.' },
    ],
    card: { src: '/images/card-therapy.webp', alt: 'دو استکان چای کنار هم روی میز', width: 800, height: 600 },
    short: 'آنلاین یا حضوری',
    title: 'روان‌درمانی، آنلاین یا حضوری',
    metaTitle: 'روان‌درمانی آنلاین و حضوری',
    description: 'جلسه با روان‌درمانگر دارای پروانه از سازمان نظام روان‌شناسی و مشاوره؛ آنلاین از هر جای ایران یا حضوری در شهرهایی که مرکز همکار داریم.',
    lead: 'جلسه با روان‌درمانگر دارای پروانه از سازمان نظام روان‌شناسی و مشاوره؛ آنلاین از هر جای ایران، یا حضوری در شهرهایی که مرکز همکار داریم.',
    checks: ['فقط درمانگر دارای پروانه', 'جلسه‌ی آنلاین از همه‌ی شهرها', 'موضوع جلسه را فقط درمانگر می‌بیند'],
    cta: 'درخواست جلسه',
    photo: { src: '/images/card-therapy.webp', alt: 'دو استکان چای کنار هم روی میز', width: 800, height: 600 },
    warning: {
      title: 'روان‌درمانی برای شرایط اورژانسی نیست',
      text: 'اگر در خطر فوری هستید یا به آسیب زدن به خودتان فکر می‌کنید، همین حالا تماس بگیرید:',
      numbers: [
        { label: 'اورژانس اجتماعی ۱۲۳ (شبانه‌روزی و رایگان)', tel: '123' },
        { label: 'اورژانس ۱۱۵', tel: '115' },
      ],
    },
    choices: {
      title: 'جلسه برای چه کسی است؟',
      intro: 'درمانگری معرفی می‌شود که با همین گروه کار کرده است. نوشتن موضوع در فرم اختیاری است.',
      items: [
        { title: 'فردی', meta: 'برای خودتان', text: 'برای اضطراب، غم طولانی، مشکل خواب، استرس کار یا هر موضوعی که ذهنتان را درگیر کرده است.', href: request('therapy', '&for=self') },
        { title: 'زوج', meta: 'برای شما و همسرتان', text: 'برای گفت‌وگوی بهتر، اختلاف‌های تکراری یا تصمیم‌های مهم زندگی مشترک.', href: request('therapy', '&for=couple') },
        { title: 'کودک و نوجوان', meta: 'با همراهی والدین', text: 'برای نگرانی‌های رفتاری، درسی یا عاطفی فرزندتان، با درمانگر کودک و نوجوان.', href: request('therapy', '&for=child') },
        { title: 'خانواده', meta: 'چند نفر از اعضای خانواده', text: 'وقتی مشکل به رابطه‌ی چند نفر در خانه برمی‌گردد.', href: request('therapy', '&for=family') },
      ],
    },
    scope: {
      title: 'جلسه‌ها آنلاین یا حضوری؟',
      intro: 'هر دو ممکن است؛ نوع جلسه را در فرم انتخاب می‌کنید.',
      columns: [{
        tone: 'plain', icon: Video,
        title: 'آنلاین',
        items: ['تماس تصویری، از هر جای ایران', 'بدون رفت‌وآمد، از خانه یا محل کار', 'در همه‌ی شهرها همین حالا فعال است'],
      },
      {
        tone: 'plain', icon: MapPin,
        title: 'حضوری',
        items: ['در مطب یا مرکز مشاوره، در شهر خودتان', 'فقط در شهرهایی که مرکز همکار داریم'],
        note: 'اگر جلسه‌ی حضوری در شهرتان هنوز فعال نیست، درخواستتان در لیست انتظار می‌ماند و تا آن موقع می‌توانید آنلاین شروع کنید.',
      }],
      pending: 'online',
    },
    more: {
      title: 'روان‌درمانگر یا روان‌پزشک؟',
      paragraphs: [
        'روان‌درمانگر با گفت‌وگو و تمرین کمک می‌کند و دارو تجویز نمی‌کند. اگر درمانگر تشخیص دهد که دارو هم لازم است، مراجعه به روان‌پزشک را پیشنهاد می‌کند.',
      ],
    },
    faq: [
      { q: 'جلسه‌ی آنلاین چطور برگزار می‌شود؟', a: 'با تماس تصویری در ساعتی که با درمانگر هماهنگ می‌کنید. اینترنت پایدار و جایی آرام کافی است.', pending: 'online' },
      { q: 'حرف‌هایم محرمانه می‌ماند؟', a: 'بله، جز در موارد استثنایی که قانون و اصول حرفه‌ای مشخص کرده‌اند، مثل خطر جدی برای جان شما یا دیگران. موضوعی را که در فرم می‌نویسید فقط درمانگری می‌بیند که معرفی می‌شود.' },
      { q: 'هزینه‌ی هر جلسه چقدر است؟', a: 'به درمانگر و نوع جلسه بستگی دارد. مرکز پیش از جلسه‌ی اول مبلغ را اعلام می‌کند.', pending: 'price' },
      { q: 'اگر با درمانگر راحت نبودم چه کنم؟', a: 'به ما خبر دهید. درمانگر دیگری معرفی می‌کنیم.', pending: 'replace' },
    ],
  },
};

export const SERVICE_LIST: ServiceContent[] = SERVICE_SLUGS.map((slug) => SERVICES[slug]);
