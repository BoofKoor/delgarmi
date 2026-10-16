import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

export type NoticeTone = 'info' | 'warning' | 'success' | 'danger';

const GLYPH: Record<NoticeTone, ReactNode> = {
  info: 'i',
  warning: '!',
  success: <Check aria-hidden="true" focusable="false" size={16} strokeWidth={3} />,
  danger: '!',
};

/**
 * Title says what happened, the sentence says what to do. Never disappears on its own.
 * `live` (default) announces it when it appears; set it to false for a notice that is simply
 * part of the page.
 */
export function Notice({ tone = 'info', title, children, className, live = true }: { tone?: NoticeTone; title: ReactNode; children?: ReactNode; className?: string; live?: boolean }) {
  return (
    <div className={cx('dg-notice', tone !== 'info' && `dg-notice--${tone}`, className)} role={live ? (tone === 'danger' ? 'alert' : 'status') : undefined}>
      <span className="dg-notice-icon" aria-hidden="true">{GLYPH[tone]}</span>
      <div className="dg-notice-body">
        <span className="dg-notice-title">{title}</span>
        {children ? <span>{children}</span> : null}
      </div>
    </div>
  );
}
