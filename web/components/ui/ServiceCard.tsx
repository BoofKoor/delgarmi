import Link from 'next/link';

export type ServiceCardProps = {
  href: string;
  image: string;
  alt: string;
  title: string;
  text: string;
  linkText?: string;
};

/** The whole card is one link to the service page. */
export function ServiceCard({ href, image, alt, title, text, linkText = 'جزئیات و درخواست ←' }: ServiceCardProps) {
  return (
    <Link className="dg-service" href={href}>
      <img src={image} alt={alt} width={800} height={600} loading="lazy" decoding="async" />
      <div className="dg-service-body">
        <h3 className="dg-service-title">{title}</h3>
        <p className="dg-service-text">{text}</p>
        <span className="dg-service-link">{linkText}</span>
      </div>
    </Link>
  );
}
