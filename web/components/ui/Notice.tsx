import { CircleCheck, CircleX, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

export type NoticeTone = 'info' | 'warning' | 'success' | 'danger';

const ICON: Record<NoticeTone, LucideIcon> = { info: Info, warning: TriangleAlert, success: CircleCheck, danger: CircleX };

/**
 * Title says what happened, the sentence says what to do. Never disappears on its own.
 * `live` (default) announces it when it appears; set it to false for a notice that is simply
 * part of the page. `icon` replaces the tone's own icon where another one says more (a clock
 * for the waiting list).
 */
export function Notice({ tone = 'info', title, children, className, live = true, icon }: { tone?: NoticeTone; title: ReactNode; children?: ReactNode; className?: string; live?: boolean; icon?: LucideIcon }) {
  const Icon = icon ?? ICON[tone];
  return (
    <div className={cx('dg-notice', tone !== 'info' && `dg-notice--${tone}`, className)} role={live ? (tone === 'danger' ? 'alert' : 'status') : undefined}>
      <span className="dg-notice-icon" aria-hidden="true"><Icon focusable="false" strokeWidth={1.75} /></span>
      <div className="dg-notice-body">
        <span className="dg-notice-title">{title}</span>
        {children ? <span>{children}</span> : null}
      </div>
    </div>
  );
}
