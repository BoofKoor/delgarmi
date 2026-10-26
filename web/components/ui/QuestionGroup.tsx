import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

export type QuestionGroupProps = {
  legend: ReactNode;
  /** Visually hide the legend when the screen title already asks the question. */
  hideLegend?: boolean;
  optional?: boolean;
  /** One sentence under a sensitive question saying why we ask. */
  why?: ReactNode;
  error?: ReactNode;
  /** id of the error line; put it in aria-describedby of every input in the group. */
  errorId?: string;
  className?: string;
  children: ReactNode;
};

/**
 * One form question: a fieldset whose legend is the question itself. With an error, a red bar
 * runs beside the whole question and the message sits right under the question, above the
 * options, so it is never pushed under the bottom bar on a phone (design system v8).
 */
export function QuestionGroup({ legend, hideLegend = false, optional = false, why, error, errorId, className, children }: QuestionGroupProps) {
  return (
    <div className={cx('dg-group', Boolean(error) && 'dg-group--error', className)}>
      <fieldset>
        <legend className={hideLegend ? 'vh' : undefined}>
          {legend}
          {optional ? <> <span className="dg-optional">(اختیاری)</span></> : null}
        </legend>
        {error ? <p className="dg-error" id={errorId}>{error}</p> : null}
        {children}
        {why ? (
          <p className="dg-why">
            <Info aria-hidden="true" focusable="false" strokeWidth={1.75} />
            <span>{why}</span>
          </p>
        ) : null}
      </fieldset>
    </div>
  );
}
