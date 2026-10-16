import { CircleDashed, Phone as PhoneIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { FACTS, FACT_PLACEHOLDERS, PENDING_POLICIES, type FactName, type PolicyKey } from '@/content/facts';
import { cx } from '@/lib/cx';

/*
 * Markers for what the team has not given yet (content/facts.ts). They follow the design system:
 * the amber tint with its status colour, pill corners, no text under 15px, and the content keeps
 * its own layout. A missing fact is highlighted sample text; a draft policy carries a small tag.
 */

/** A fact we do not have yet: the sample text, highlighted. */
export function Missing({ what, children }: { what: string; children: ReactNode }) {
  return (
    <>
      <span className="missing" title={`جای خالی: ${what}`}>{children}</span>
      <span className="vh"> (جای خالی: {what})</span>
    </>
  );
}

/**
 * Text that is still a draft. Inline, a small tag follows the text; as a block, the tag sits
 * above the content. Once the policy is confirmed, its key leaves PENDING_POLICIES.
 */
export function Pending({ policy, children, block = false }: { policy?: PolicyKey; children: ReactNode; block?: boolean }) {
  if (!policy) return <>{children}</>;
  const { tag, what } = PENDING_POLICIES[policy];
  if (block) {
    return (
      <div className="pending">
        <p className="pending-tag">
          <CircleDashed className="ic" strokeWidth={1.75} aria-hidden="true" focusable="false" />
          {tag}: {what}
        </p>
        {children}
      </div>
    );
  }
  // A no-break space keeps the tag with the last word when the line wraps.
  return (
    <>
      {children}&nbsp;<span className="pending-pill" title={`${tag}: ${what}`}>
        {tag}
        <span className="vh"> ({what})</span>
      </span>
    </>
  );
}

/** One of the team's facts as plain text, or its highlighted sample. */
export function Fact({ name }: { name: Exclude<FactName, 'phone'> }) {
  const value = FACTS[name];
  if (value) return <>{value}</>;
  const { what, sample } = FACT_PLACEHOLDERS[name];
  return <Missing what={what}>{sample}</Missing>;
}

/**
 * The support number: a tap-to-call link, or a button (`button`). Without a number the text form
 * shows the highlighted sample and the button form shows as not yet available (the design
 * system's disabled look).
 */
export function PhoneLink({ className, withIcon = false, label, button = false }: { className?: string; withIcon?: boolean; label?: ReactNode; button?: boolean }) {
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
  if (button) {
    return (
      <span className={cx(className, 'placeholder-btn')} title={`جای خالی: ${what}`}>
        {icon}
        {label ?? sample}
        <span className="vh"> (جای خالی: {what})</span>
      </span>
    );
  }
  return (
    <Missing what={what}>
      <span className={className}>
        {icon}
        {label ?? <span className="num">{sample}</span>}
      </span>
    </Missing>
  );
}
