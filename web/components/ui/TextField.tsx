import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '@/lib/cx';

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string;
  label: ReactNode;
  /** The format and what happens next («۱۱ رقم، با ۰۹ شروع می‌شود»); examples never go inside the field. */
  help?: ReactNode;
  /** Shown after the user leaves the field or presses «مرحله‌ی بعد», never while typing. */
  error?: ReactNode;
  /** Numbers such as a mobile number: left-to-right, aligned right. */
  ltr?: boolean;
  /** Extra class on the input itself, e.g. `dg-otp` for the code field. */
  inputClassName?: string;
  /** More ids that describe the field (a line elsewhere on the screen). */
  describedBy?: string;
  /** To move the cursor into the field. */
  inputRef?: Ref<HTMLInputElement>;
};

export function TextField({ id, label, help, error, ltr = false, className, inputClassName, describedBy: extra, inputRef, ...input }: TextFieldProps) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helpId, extra].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cx('dg-field', Boolean(error) && 'dg-field--error', className)}>
      <label className="dg-label" htmlFor={id}>{label}</label>
      <input ref={inputRef} id={id} className={cx('dg-input', ltr && 'dg-input--ltr', inputClassName)} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...input} />
      {error ? <span className="dg-error" id={errorId}>{error}</span> : null}
      {help ? <span className="dg-help" id={helpId}>{help}</span> : null}
    </div>
  );
}
