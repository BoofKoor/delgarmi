import { RAYS } from '@/components/ui/Logo';
import { cx } from '@/lib/cx';

/**
 * The logo's four rays beside the top corner of a photo or panel: at most once per section,
 * never over text. `rise` draws them in one after another (only on the home hero).
 * The viewBox origin is the point the rays converge on, so CSS can place that point exactly.
 */
export function Rays({ rise = false, className }: { rise?: boolean; className?: string }) {
  return (
    <svg className={cx('rays', rise && 'rise', className)} viewBox="-14 -97 106 134" aria-hidden="true" focusable="false">
      <g transform="translate(-146 -98)">
        {RAYS.map((d) => <path key={d} d={d} />)}
      </g>
    </svg>
  );
}
