import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';

type Variant = 'primary' | 'secondary' | 'on-photo';
type Size = 'md' | 'lg';

function classes(variant: Variant, size: Size, loading: boolean, extra?: string) {
  return cx('dg-btn', `dg-btn--${variant}`, size === 'lg' && 'dg-btn--lg', loading && 'dg-btn--loading', extra);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Shows the spinner and blocks repeat clicks; change the label too («در حال ثبت»). */
  loading?: boolean;
};

export function Button({ variant = 'primary', size = 'md', loading = false, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={classes(variant, size, loading, className)} aria-busy={loading || undefined} {...rest} />;
}

export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant; size?: Size };

/** Same look as Button, for going to another page. */
export function ButtonLink({ href, variant = 'primary', size = 'md', className, ...rest }: ButtonLinkProps) {
  const cls = classes(variant, size, false, className);
  if (/^(https?:|tel:|mailto:)/.test(href)) return <a href={href} className={cls} {...rest} />;
  return <Link href={href} className={cls} {...rest} />;
}
