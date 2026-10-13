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

/** One form question: a fieldset whose legend is the question itself. */
export function QuestionGroup({ legend, hideLegend = false, optional = false, why, error, errorId, className, children }: QuestionGroupProps) {
  return (
    <fieldset className={cx('dg-group', Boolean(error) && 'dg-group--error', className)}>
      <legend className={hideLegend ? 'vh' : undefined}>
        {legend}
        {optional ? <> <span className="dg-optional">(اختیاری)</span></> : null}
      </legend>
      {children}
      {why ? (
        <p className="dg-why">
          <Info aria-hidden="true" focusable="false" strokeWidth={1.75} />
          <span>{why}</span>
        </p>
      ) : null}
      {error ? <p className="dg-error" id={errorId}>{error}</p> : null}
    </fieldset>
  );
}
