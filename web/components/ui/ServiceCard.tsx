import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { cx } from '@/lib/cx';

export type ServiceCardProps = {
  href: string;
  image: string;
  alt: string;
  title: string;
  text: string;
  linkText?: string;
  /** Always a compact row (72px photo, name, one line, arrow); inside `.dg-service-list` cards become rows on phones only. */
  row?: boolean;
  /** On a white band: page colour and a soft line instead of the shadow. */
  quiet?: boolean;
  /** Where the photo sits in a square crop. */
  focus?: string;
};

/** The whole card is one link to the service page. */
export function ServiceCard({ href, image, alt, title, text, linkText = 'جزئیات و درخواست ←', row = false, quiet = false, focus }: ServiceCardProps) {
  return (
    <Link className={cx('dg-service', row && 'dg-service--row', quiet && 'dg-service--quiet')} href={href}>
      <img src={image} alt={alt} width={800} height={600} loading="lazy" decoding="async" style={focus ? { objectPosition: focus } : undefined} />
      <div className="dg-service-body">
        <h3 className="dg-service-title">{title}</h3>
        <p className="dg-service-text">{text}</p>
        <span className="dg-service-link">{linkText}</span>
      </div>
      <ChevronLeft className="dg-service-go" aria-hidden="true" focusable="false" strokeWidth={1.75} />
    </Link>
  );
}
