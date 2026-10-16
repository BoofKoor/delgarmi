import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { Crumbs } from '@/components/site/Crumbs';
import { Flow } from '@/components/site/Flow';
import { Ic } from '@/components/site/Ic';
import { StickyCta } from '@/components/site/StickyCta';
import { SERVICES } from '@/content/services';
import { getCities, getCity, type CityDetail } from '@/lib/api';

type Props = { params: Promise<{ slug: string }> };

// Only cities with a page address have a page; /cities/<code> is not a page.
const findCity = cache(async (slug: string): Promise<CityDetail | null> => {
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) return null;
  const city = await getCity(slug);
  return city?.slug === slug ? city : null;
});

/** In-person services switched on in this city (online therapy does not count). */
function inPersonActive(city: CityDetail) {
  return city.services.filter((s) => s.in_person);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = await findCity((await params).slug);
  if (!city) return {};
  const active = inPersonActive(city).length > 0;
  return {
    title: `مراقب سالمند، پرستار در منزل و پرستار کودک در ${city.name}`,
    description: active
      ? `درخواست مراقب سالمند، پرستار در منزل، پرستار کودک و روان‌درمانگر از مراکز دارای مجوز ${city.name}. بدون ثبت‌نام، با پیگیری تا شروع کار.`
      : `خدمات حضوری دلگرمی هنوز در ${city.name} فعال نیست؛ درخواست در لیست انتظار ثبت می‌شود. روان‌درمانی آنلاین همین حالا فعال است.`,
    alternates: { canonical: `/cities/${city.slug}` },
    // A page that can only say «not yet» stays out of search results until a service starts here.
    robots: active ? undefined : { index: false, follow: true },
  };
}

export default async function CityPage({ params }: Props) {
  const city = await findCity((await params).slug);
  if (!city) notFound();
  const neighbours = (await getCities()).filter((c) => c.province === city.province && c.slug && c.slug !== city.slug);
  const active = inPersonActive(city);
  const requestHref = `/request?city=${city.code}`;

  return (
    <>
      <div className="container">
        <Crumbs items={[{ label: 'شهرها', href: '/cities' }, { label: city.name }]} />
      </div>
      <section className="page-head" aria-labelledby="city-title">
        <div className="container">
          <h1 id="city-title">دلگرمی در {city.name}</h1>
          <p className="lead">
            {active.length
              ? `در ${city.name} درخواست شما به مرکزی دارای مجوز در همین شهر سپرده می‌شود و همکار دلگرمی تا شروع کار پیگیری می‌کند.`
              : `هنوز در ${city.name} مرکز همکار نداریم. درخواستتان در لیست انتظار ثبت می‌شود و با فعال شدن ${city.name} پیامک می‌گیرید. روان‌درمانی آنلاین همین حالا فعال است.`}
          </p>
          <div className="svc-actions" id="city-actions">
            <Link className="dg-btn dg-btn--primary dg-btn--lg" href={requestHref}>ثبت درخواست در {city.name}</Link>
          </div>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="status-title">
        <div className="container">
          <div className="section-head">
            <h2 className="h-section" id="status-title">خدمت‌ها در {city.name}</h2>
            <p>استان {city.province}</p>
          </div>
          <ul className="svc-status">
            {city.services.map((svc) => {
              const content = SERVICES[svc.slug];
              if (!content) return null;
              const state = svc.online ? (svc.in_person ? 'آنلاین و حضوری' : 'آنلاین') : svc.in_person ? 'فعال' : 'لیست انتظار';
              const on = svc.online || svc.in_person;
              return (
                <li key={svc.slug}>
                  <div className="top">
                    <h3><Ic icon={content.icon} />{content.name}</h3>
                    <span className={on ? 'state state--on' : 'state state--wait'}>{state}</span>
                  </div>
                  <p>{content.text}</p>
                  <div className="links">
                    <Link href={`/request?service=${svc.slug}&city=${city.code}`} aria-label={`درخواست ${content.name} در ${city.name}`}>درخواست</Link>
                    <Link href={`/services/${svc.slug}`} aria-label={`درباره‌ی ${content.name}`}>درباره‌ی این خدمت</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="flow-title">
        <div className="container">
          <div className="section-head">
            <h2 className="h-section" id="flow-title">بعد از درخواست</h2>
            <p>
              {active.length
                ? `از بین مراکز دارای مجوز ${city.name}، مرکزی را پیدا می‌کنیم که همین خدمت را دارد.`
                : 'لیست انتظار یعنی درخواستتان ثبت و نگه داشته می‌شود. وقتی شهر فعال شد پیامک می‌گیرید و درخواست بدون ثبت دوباره بررسی می‌شود.'}{' '}
              <Link href="/how-we-vet">چطور مراکز را انتخاب می‌کنیم</Link>
            </p>
          </div>
          <Flow />
        </div>
      </section>

      {neighbours.length ? (
        <section className="section section--flush" aria-labelledby="near-title">
          <div className="container">
            <h2 className="h-card" id="near-title" style={{ marginBottom: 'var(--space-4)' }}>شهرهای دیگر استان {city.province}</h2>
            <nav className="city-links" aria-labelledby="near-title">
              {neighbours.map((c) => <Link key={c.code} href={`/cities/${c.slug}`}>{c.name}</Link>)}
            </nav>
          </div>
        </section>
      ) : null}
      <StickyCta href={requestHref} label={`ثبت درخواست در ${city.name}`} after="city-actions" />
    </>
  );
}
