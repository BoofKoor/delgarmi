import { STATUS_LABELS, type Status } from '@/lib/statuses';

/** The status name is always written out; colour only helps. */
export function StatusBadge({ status }: { status: Status }) {
  return <span className={`dg-badge dg-badge--${status}`}>{STATUS_LABELS[status]}</span>;
}
