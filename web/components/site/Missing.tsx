import { Phone as PhoneIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { FACTS, FACT_PLACEHOLDERS, PENDING_POLICIES, type FactName, type PolicyKey } from '@/content/facts';
import { cx } from '@/lib/cx';

/**
 * Marks text that stands in for a fact or a decision we do not have yet. The marker is meant
 * to be seen on the test site; content/facts.ts lists what is still open.
 */
export function Missing({ what, children, block = false }: { what: string; children: ReactNode; block?: boolean }) {
  const Tag = block ? 'div' : 'span';
  return (
    <Tag className={cx('missing', block && 'missing--block')} data-missing={what} title={`هنوز قطعی نیست: ${what}`}>
      {children}
      <span className="vh"> (هنوز قطعی نیست: {what})</span>
    </Tag>
  );
}

/** A policy answer that is still a draft: shown marked until its key leaves PENDING_POLICIES. */
export function Pending({ policy, children, block = false }: { policy?: PolicyKey; children: ReactNode; block?: boolean }) {
  if (!policy) return <>{children}</>;
  return <Missing what={PENDING_POLICIES[policy]} block={block}>{children}</Missing>;
}

/** One of the team's facts as plain text, or its marked placeholder. */
export function Fact({ name }: { name: Exclude<FactName, 'phone'> }) {
  const value = FACTS[name];
  if (value) return <>{value}</>;
  const { what, sample } = FACT_PLACEHOLDERS[name];
  return <Missing what={what}>{sample}</Missing>;
}

/** The support number as a tap-to-call link, or its marked placeholder. */
export function PhoneLink({ className, withIcon = false, label }: { className?: string; withIcon?: boolean; label?: ReactNode }) {
  const icon = withIcon ? <PhoneIcon className="ic" strokeWidth={1.75} aria-hidden="true" focusable="false" /> : null;
  const phone = FACTS.phone;
  if (phone) {
    return (
      <a className={className} href={`tel:${phone.tel}`}>
        {icon}
        {label ?? <span className="num">{phone.display}</span>}
      </a>
    );
  }
  const { what, sample } = FACT_PLACEHOLDERS.phone;
  return (
    <Missing what={what}>
      <span className={className}>
        {icon}
        {label ?? <span className="num">{sample}</span>}
      </span>
    </Missing>
  );
}
