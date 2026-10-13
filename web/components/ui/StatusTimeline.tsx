import { Check } from 'lucide-react';

export type TimelineItem = { title: string; meta?: string; state: 'done' | 'current' | 'todo' };

const SPOKEN = { done: '(انجام شد)', current: '(وضعیت فعلی)', todo: '' } as const;

/** The path of one request: done, current, still to come. */
export function StatusTimeline({ items }: { items: readonly TimelineItem[] }) {
  return (
    <ol className="dg-timeline">
      {items.map((item) => (
        <li key={item.title} className={`is-${item.state}`} aria-current={item.state === 'current' ? 'step' : undefined}>
          <span className="dg-timeline-dot">
            {item.state === 'done' ? <Check aria-hidden="true" focusable="false" strokeWidth={1.75} /> : null}
          </span>
          <div>
            <span className="dg-timeline-title">
              {item.title}
              {SPOKEN[item.state] ? <span className="vh"> {SPOKEN[item.state]}</span> : null}
            </span>
            {item.meta ? <span className="dg-timeline-meta">{item.meta}</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
