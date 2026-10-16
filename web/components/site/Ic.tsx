import type { LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';

/** A Lucide icon at the design system's stroke (1.75). Decorative: the text beside it speaks. */
export function Ic({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return <Icon className={cx('ic', className)} strokeWidth={1.75} aria-hidden="true" focusable="false" />;
}
