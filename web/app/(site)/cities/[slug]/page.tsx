import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { Crumbs } from '@/components/site/Crumbs';
import { Ic } from '@/components/site/Ic';
import { StickyCta } from '@/components/site/StickyCta';
import { SERVICES, isServiceSlug } from '@/content/services';
import { getCities, getCity, type CityDetail } from '@/lib/api';
import { ProcessSteps } from '@/components/ui';
import { PROCESS } from '@/content/process';

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

/** «الف، ب و ج» */
function joinFa(items: string[]) {
  return items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join('، ')} و ${items.at(-1)}`;
}

function activeNames(city: CityDetail) {
  return joinFa(inPersonActive(city).map((s) => (s.slug === 'therapy' ? 'روان‌درمانی حضوری' : isServiceSlug(s.slug) ? SERVICES[s.slug].name : s.name)));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = await findCity((await params).slug);
  if (!city) return {};
  const active = inPersonActive(city).length > 0;
  return {
    title: `مراقب سالمند، پرستار در منزل و پرستار کودک در ${city.name}`,
    description: active
      ? `درخواست ${activeNames(city)} از مراکز دارای مجوز ${city.name}؛ بدون ثبت‌نام، با پیگیری تا شروع کار. روان‌درمانی آنلاین هم فعال است.`
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
          <p className="eyebrow">استان {city.province}</p>
          <p className="lead">
            {active.length
              ? `در ${city.name} برای ${activeNames(city)}، درخواست شما به مرکزی دارای مجوز در همین شهر سپرده می‌شود و همکار دلگرمی تا شروع کار پیگیری می‌کند.`
              : `هنوز در ${city.name} مرکز همکار نداریم. درخواستتان در لیست انتظار ثبت می‌شود و وقتی دلگرمی در ${city.name} فعال شد پیامک می‌گیرید. روان‌درمانی آنلاین همین حالا فعال است.`}
          </p>
          <div className="svc-actions" id="city-actions">
            <Link className="dg-btn dg-btn--primary dg-btn--lg" href={requestHref}>ثبت درخواست در {city.name}</Link>
          </div>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="status-title">
        <div className="container">
          <div className="section-head section-head--sub">
            <h2 className="h-card" id="status-title">خدمات دلگرمی در {city.name}</h2>
            <p>برای خدمتی که هنوز در {city.name} فعال نیست هم می‌توانید درخواست بدهید؛ در لیست انتظار ثبت می‌شود.</p>
          </div>
          <ul className="svc-status">
            {city.services.map((svc) => {
              if (!isServiceSlug(svc.slug)) return null;
              const content = SERVICES[svc.slug];
              const state = svc.online ? (svc.in_person ? 'آنلاین و حضوری' : 'آنلاین') : svc.in_person ? 'فعال' : 'لیست انتظار';
              const on = svc.online || svc.in_person;
              return (
                <li key={svc.slug}>
                  <div className="top">
                    <h3><Ic icon={content.icon} />{content.name}</h3>
                    <span className={on ? 'dg-badge dg-badge--in-service' : 'dg-badge dg-badge--waitlist'}>{state}</span>
                  </div>
                  <p>{content.text}</p>
                  <div className="links">
                    <Link className="dg-btn dg-btn--secondary" href={`/request?service=${svc.slug}&city=${city.code}`}>
                      {on ? 'ثبت درخواست' : 'ثبت در لیست انتظار'}
                      <span className="vh"> {on ? '' : 'برای '}{content.name} در {city.name}</span>
                    </Link>
                    <Link href={`/services/${svc.slug}`}>درباره‌ی این خدمت<span className="vh"> ({content.name})</span></Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="flow-title">
        <div className="container">
          <div className="section-head section-head--sub">
            <h2 className="h-card" id="flow-title">بعد از درخواست</h2>
            <p>
              {active.length
                ? `از بین مراکز دارای مجوز ${city.name}، مرکزی را پیدا می‌کنیم که همین خدمت را دارد.`
                : 'لیست انتظار یعنی درخواستتان ثبت و نگه داشته می‌شود. وقتی دلگرمی در شهرتان فعال شد پیامک می‌گیرید و همکار ما تماس می‌گیرد؛ لازم نیست دوباره درخواست ثبت کنید.'}{' '}
              <Link href="/how-we-vet">چطور مراکز را انتخاب می‌کنیم</Link>
            </p>
          </div>
          <ProcessSteps steps={PROCESS} columns />
        </div>
      </section>

      {neighbours.length ? (
        <section className="section section--flush" aria-labelledby="near-title">
          <div className="container">
            <div className="section-head section-head--sub">
              <h2 className="h-card" id="near-title">شهرهای دیگر استان {city.province}</h2>
            </div>
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
