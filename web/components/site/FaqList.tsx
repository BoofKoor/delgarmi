import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import type { FaqItem } from '@/content/services';
import { Pending } from './Missing';

/** Design system v8 Accordion: details and summary, no script; each row at least 56px. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="dg-accordion">
      {items.map((item) => (
        <details key={item.q}>
          <summary>
            <span>{item.q}</span>
            <ChevronDown aria-hidden="true" focusable="false" strokeWidth={1.75} />
          </summary>
          <div className="dg-accordion-answer">
            <p><Pending policy={item.pending}>{item.a}</Pending></p>
            {item.link ? <p className="faq-more"><Link href={item.link.href}>{item.link.label}</Link></p> : null}
          </div>
        </details>
      ))}
    </div>
  );
}

/** FAQPage structured data for a list of questions (drafts included: the page shows them too). */
export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
  };
}
