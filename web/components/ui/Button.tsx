import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';

/**
 * primary: the one main action of a view · secondary: going back, side actions · on-photo · text:
 * a small action next to text («ویرایش») · ghost: header actions (منو، خروج).
 */
type Variant = 'primary' | 'secondary' | 'on-photo' | 'text' | 'ghost';
type Size = 'md' | 'lg';

function classes(variant: Variant, size: Size, loading: boolean, icon: boolean, extra?: string) {
  return cx('dg-btn', `dg-btn--${variant}`, size === 'lg' && 'dg-btn--lg', icon && 'dg-btn--icon', loading && 'dg-btn--loading', extra);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** A square icon-only button: give it an aria-label. */
  icon?: boolean;
  /** Shows the spinner and blocks repeat clicks; the label stays. */
  loading?: boolean;
};

export function Button({ variant = 'primary', size = 'md', icon = false, loading = false, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={classes(variant, size, loading, icon, className)} aria-busy={loading || undefined} {...rest} />;
}

export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant; size?: Size; icon?: boolean };

/** Same look as Button, for going to another page. */
export function ButtonLink({ href, variant = 'primary', size = 'md', icon = false, className, ...rest }: ButtonLinkProps) {
  const cls = classes(variant, size, false, icon, className);
  if (/^(https?:|tel:|mailto:)/.test(href)) return <a href={href} className={cls} {...rest} />;
  return <Link href={href} className={cls} {...rest} />;
}
