import { fa } from '@/lib/digits';

export type FlowStep = { title: string; text: string };

export const DEFAULT_FLOW: FlowStep[] = [
  { title: 'ثبت درخواست', text: 'چند سؤال درباره‌ی نیازتان، زمان و شهر.' },
  { title: 'تماس همکار دلگرمی', text: 'جزئیات را می‌پرسیم و به سؤال‌هایتان جواب می‌دهیم.' },
  { title: 'معرفی مرکز', text: 'مرکزی دارای مجوز در شهر شما که همین خدمت را دارد.' },
  { title: 'شروع کار', text: 'مرکز زمان و هزینه را پیش از شروع با شما قطعی می‌کند.' },
];

/** The four steps after a request, as numbered cards. */
export function Flow({ steps = DEFAULT_FLOW }: { steps?: FlowStep[] }) {
  return (
    <ol className="flow">
      {steps.map((step, i) => (
        <li key={step.title}>
          <span className="n" aria-hidden="true">{fa(i + 1)}</span>
          <div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
