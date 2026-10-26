import { ArrowLeft, Check, ChevronDown, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Crumbs } from '@/components/site/Crumbs';
import { FaqList, faqJsonLd } from '@/components/site/FaqList';
import { Ic } from '@/components/site/Ic';
import { JsonLd } from '@/components/site/JsonLd';
import { Pending } from '@/components/site/Missing';
import { Rays } from '@/components/site/Rays';
import { StickyCta } from '@/components/site/StickyCta';
import { Notice, ProcessSteps, ServiceCard } from '@/components/ui';
import { processFor } from '@/content/process';
import { SERVICES, SERVICE_LIST, SERVICE_SLUGS, isServiceSlug } from '@/content/services';
import { cx } from '@/lib/cx';
import { BASE_OG, SITE_URL } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

/** «برای این کارها پرستاری در منزل را…» with «پرستاری در منزل» as the link. */
function linkInside(text: string, link?: { href: string; label: string }) {
  const at = link ? text.indexOf(link.label) : -1;
  if (!link || at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <Link href={link.href}>{link.label}</Link>
      {text.slice(at + link.label.length)}
    </>
  );
}

/** A display title breaks after its comma, as the home title does: «پرستار کودک،⏎ با دلِ آسوده». */
function breakAfterComma(title: string, display?: boolean) {
  const at = title.indexOf('، ');
  if (!display || at < 0) return title;
  return <>{title.slice(0, at + 1)}<br /> {title.slice(at + 2)}</>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isServiceSlug(slug)) return {};
  const s = SERVICES[slug];
  return {
    title: s.metaTitle,
    description: s.description,
    alternates: { canonical: `/services/${slug}` },
    openGraph: { ...BASE_OG, title: `${s.metaTitle} | دلگرمی`, description: s.description, images: [{ url: `/images/og/${slug}.jpg`, ...s.og, alt: s.photo.alt }] },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  if (!isServiceSlug(slug)) notFound();
  const s = SERVICES[slug];
  const requestHref = `/request?service=${slug}`;
  const others = SERVICE_LIST.filter((o) => o.slug !== slug);

  // The sections under the hero alternate between white bands and the page colour.
  const sections: { id: string; node: (band: boolean) => ReactNode }[] = [
    {
      id: 'choices',
      node: (band) => (
        <section className={cx('section', band && 'band')} key="choices" aria-labelledby="choices-title">
          <div className="container">
            <div className="section-head">
              <h2 className="h-section" id="choices-title">{s.choices.title}</h2>
              <p>{s.choices.intro}</p>
            </div>
            <div className={cx('types-grid', s.choices.items.length === 3 ? 'types-grid--3' : 'types-grid--4')}>
              {s.choices.items.map((c) => (
                <article className="type-card" key={c.title}>
                  <h3>{c.title}</h3>
                  <span className="meta">{s.choices.metaIcon ? <Ic icon={s.choices.metaIcon} /> : null}{c.meta}</span>
                  <p>{c.text}</p>
                  <Link href={c.href} aria-label={`${c.title}: انتخاب و ادامه`}>انتخاب و ادامه<Ic icon={ArrowLeft} /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ),
    },
    {
      id: 'scope',
      node: (band) => (
        <section className={cx('section', band && 'band')} key="scope" aria-labelledby="scope-title">
          <div className={cx('container scope-grid', s.scope.photo && 'scope-grid--photo')}>
            <div>
              <div className="section-head">
                <h2 className="h-section" id="scope-title">{s.scope.title}</h2>
                <p>{s.scope.intro}</p>
              </div>
              <Pending policy={s.scope.pending} block>
                <div className="scope-cols">
                  {s.scope.columns.map((col) => (
                    <div className={cx('scope-col', col.tone === 'yes' && 'scope-col--yes')} key={col.title}>
                      <h3>{col.title}</h3>
                      <ul>
                        {col.items.map((item) => <li key={item}><Ic icon={col.icon} /><span>{item}</span></li>)}
                      </ul>
                      {col.note ? (
                        <Notice title={col.note.title} className="scope-note" live={false}>{linkInside(col.note.text, col.link)}</Notice>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Pending>
            </div>
            {s.scope.photo ? (
              <figure className="scope-photo">
                <img src={s.scope.photo.src} width={s.scope.photo.width} height={s.scope.photo.height} alt={s.scope.photo.alt} loading="lazy" decoding="async" />
              </figure>
            ) : null}
          </div>
        </section>
      ),
    },
    ...(s.more
      ? [{
          id: 'more',
          node: (band: boolean) => (
            <section className={cx('section', band && 'band')} key="more" aria-labelledby="more-title">
              <div className="container split">
                <h2 className="h-section" id="more-title">{s.more!.title}</h2>
                <div className="split-body">
                  <Pending policy={s.more!.pending} block>
                    {s.more!.paragraphs.map((p) => <p key={p}>{p}</p>)}
                  </Pending>
                </div>
              </div>
            </section>
          ),
        }]
      : []),
    {
      id: 'after',
      node: (band) => (
        <section className={cx('section', band && 'band')} key="after" aria-labelledby="flow-title">
          <div className="container">
            <div className="section-head">
              <h2 className="h-section" id="flow-title">بعد از درخواست</h2>
              <p>وضعیت هر مرحله را در صفحه‌ی پیگیری می‌بینید و با پیامک خبردار می‌شوید.</p>
            </div>
            <ProcessSteps steps={processFor(slug)} columns />
          </div>
        </section>
      ),
    },
    {
      id: 'faq',
      node: (band) => (
        <section className={cx('section', band && 'band')} key="faq" id="svc-faq" aria-labelledby="sfaq-title">
          <div className="container faq-grid">
            <div className="section-head">
              <h2 className="h-section" id="sfaq-title">سؤال‌های این خدمت</h2>
              <p>جواب سؤالتان اینجا نبود؟ سؤال‌های دیگر را ببینید یا در تماس از همکار ما بپرسید.</p>
            </div>
            <div>
              <FaqList items={s.faq} />
              <p className="more-row"><Link className="more-link" href="/faq">سؤال‌های دیگر<Ic icon={ArrowLeft} /></Link></p>
            </div>
          </div>
        </section>
      ),
    },
    {
      id: 'others',
      node: (band) => (
        <section className={cx('section', band && 'band')} key="others" aria-labelledby="others-title">
          <div className="container">
            <h2 className="h-section others-title" id="others-title">خدمات دیگر</h2>
            <ul className="others">
              {others.map((o) => (
                <li key={o.slug}>
                  <ServiceCard href={`/services/${o.slug}`} image={o.card.src} alt="" title={o.name} text={o.short} row quiet={band} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ),
    },
  ];

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: s.name,
          description: s.description,
          url: `${SITE_URL}/services/${slug}`,
          areaServed: { '@type': 'Country', name: 'ایران' },
          provider: { '@type': 'Organization', '@id': `${SITE_URL}/#org`, name: 'دلگرمی', url: SITE_URL },
        }}
      />
      <JsonLd data={faqJsonLd(s.faq)} />

      <div className="container">
        <Crumbs items={[{ label: 'خدمات', href: '/#services' }, { label: s.name }]} />
      </div>

      <section className="svc-hero" aria-labelledby="svc-title">
        <div className="container svc-hero-grid">
          <div>
            <h1 id="svc-title" className={cx(s.displayTitle && 'font-display')}>{breakAfterComma(s.title, s.displayTitle)}</h1>
            <p className="lead">{s.lead}</p>
            <ul className="check-list">
              {s.checks.map((c) => <li key={c}><Ic icon={Check} /><span>{c}</span></li>)}
            </ul>
            <div className="svc-actions" id="svc-actions">
              <Link className="dg-btn dg-btn--primary dg-btn--lg" href={requestHref}>{s.cta}</Link>
              <Link className="dg-btn dg-btn--text" href="#svc-faq">سؤال‌های این خدمت<Ic icon={ChevronDown} /></Link>
            </div>
            {s.warning ? (
              <Notice tone="warning" title={s.warning.title} className="svc-warning" live={false}>
                {s.warning.text}
                <span className="numbers">
                  {s.warning.numbers.map((n) => (
                    <a className="dg-btn dg-btn--secondary" key={n.tel} href={`tel:${n.tel}`}><Ic icon={Phone} />{n.label}</a>
                  ))}
                </span>
              </Notice>
            ) : null}
          </div>
          <figure className="svc-figure">
            <div className="slab" aria-hidden="true" />
            <img src={s.photo.src} width={s.photo.width} height={s.photo.height} alt={s.photo.alt} fetchPriority="high" />
            <Rays />
          </figure>
        </div>
      </section>

      {sections.map((section, i) => section.node(i % 2 === 0))}
      <StickyCta href={requestHref} label={s.cta} after="svc-actions" />
    </>
  );
}
