import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string;
  label: ReactNode;
  help?: ReactNode;
  /** Shown after the user leaves the field or presses «مرحله‌ی بعد», never while typing. */
  error?: ReactNode;
  /** Numbers such as a mobile number: left-to-right, aligned right. */
  ltr?: boolean;
};

export function TextField({ id, label, help, error, ltr = false, className, ...input }: TextFieldProps) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cx('dg-field', Boolean(error) && 'dg-field--error', className)}>
      <label className="dg-label" htmlFor={id}>{label}</label>
      <input id={id} className={cx('dg-input', ltr && 'dg-input--ltr')} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...input} />
      {help ? <span className="dg-help" id={helpId}>{help}</span> : null}
      {error ? <span className="dg-error" id={errorId}>{error}</span> : null}
    </div>
  );
}
