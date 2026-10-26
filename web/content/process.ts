import type { ProcessStep } from '@/components/ui/ProcessSteps';
import type { ServiceSlug } from './services';

/**
 * The four steps after a request: one text on the home page, every service page and «ثبت شد»
 * (design system v8, ProcessSteps). Only therapy names steps 3 and 4 its own way.
 */
export const PROCESS: readonly ProcessStep[] = [
  { title: 'ثبت درخواست', text: 'چند سؤال کوتاه درباره‌ی نیاز، زمان و شهر؛ ثبت‌نام لازم نیست.' },
  { title: 'تماس همکار دلگرمی', text: 'جزئیات را می‌پرسیم و به سؤال‌هایتان جواب می‌دهیم.' },
  { title: 'معرفی مرکز دارای مجوز', text: 'مرکزی در شهر شما که همین خدمت را دارد.' },
  { title: 'هماهنگی و شروع کار', text: 'مرکز زمان شروع و هزینه را با شما قطعی می‌کند؛ تا آن موقع تعهدی ندارید.' },
];

const THERAPY: readonly ProcessStep[] = [
  PROCESS[0],
  PROCESS[1],
  { title: 'معرفی درمانگر', text: 'درمانگری دارای پروانه که با همین گروه کار کرده است.' },
  { title: 'جلسه‌ی اول', text: 'مرکز زمان و هزینه‌ی جلسه را با شما قطعی می‌کند؛ تا آن موقع تعهدی ندارید.' },
];

export function processFor(service?: ServiceSlug | null): readonly ProcessStep[] {
  return service === 'therapy' ? THERAPY : PROCESS;
}
