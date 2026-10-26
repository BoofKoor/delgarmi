import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { fa } from '@/lib/digits';

export type ProcessStep = { title: string; text: ReactNode; state?: 'done' | 'current' | 'todo' };

/**
 * The four steps after a request, with one text everywhere (content/process.ts). `display`:
 * the home page's Pofak numbers in brand-coral; elsewhere a tint-coral circle. With `state`
 * on the steps («ثبت شد»): done in green with a check, the current one outlined, the rest white.
 */
export function ProcessSteps({ steps, display = false, columns = false, heading = 'h3', className }: { steps: readonly ProcessStep[]; display?: boolean; columns?: boolean; heading?: 'h3' | 'h4'; className?: string }) {
  const H = heading;
  return (
    <ol className={cx('dg-process', display && 'dg-process--display', columns && 'dg-process--cols', className)}>
      {steps.map((step, i) => (
        <li key={step.title} className={step.state ? `is-${step.state}` : undefined} aria-current={step.state === 'current' ? 'step' : undefined}>
          <span className="dg-process-n" aria-hidden="true">
            {step.state === 'done' ? <Check focusable="false" /> : fa(i + 1)}
          </span>
          <div>
            <H className="dg-process-title">
              {step.title}
              {step.state === 'done' ? <span className="vh"> (انجام شد)</span> : null}
            </H>
            <p className="dg-process-text">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
