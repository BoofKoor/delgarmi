import type { InputHTMLAttributes, ReactNode } from 'react';

/** Consent and independent yes/no options. Never pre-checked for consent. */
export function Checkbox({ children, ...input }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { children: ReactNode }) {
  return (
    <label className="dg-check">
      <input type="checkbox" {...input} />
      <span>{children}</span>
    </label>
  );
}
