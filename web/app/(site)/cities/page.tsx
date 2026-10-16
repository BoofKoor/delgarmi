import { ChevronDown } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CityCheck } from '@/components/site/CityCheck';
import { Crumbs } from '@/components/site/Crumbs';
import { Ic } from '@/components/site/Ic';
import { SERVICES, isServiceSlug } from '@/content/services';
import { getCities, type CityItem } from '@/lib/api';
import { fa } from '@/lib/digits';

export const metadata: Metadata = {
  title: 'شهرها',
  description: 'روان‌درمانی آنلاین در همه‌ی ایران فعال است. ببینید خدمات حضوری دلگرمی در کدام شهرها فعال است.',
  alternates: { canonical: '/cities' },
};

const collator = new Intl.Collator('fa');

/** In a city, an active therapy means in-person sessions: online ones run everywhere. */
function activeName(slug: string) {
  if (slug === 'therapy') return 'روان‌درمانی حضوری';
  return isServiceSlug(slug) ? SERVICES[slug].name : null;
}

export default async function CitiesPage() {
  const cities = await getCities();
  const active = cities.filter((c) => c.active.length > 0);
  const byProvince = new Map<string, CityItem[]>();
  for (const c of cities) {
    if (!c.slug) continue;
    byProvince.set(c.province, [...(byProvince.get(c.province) ?? []), c]);
  }
  const provinces = [...byProvince.entries()].sort(([a], [b]) => collator.compare(a, b));

  return (
    <>
      <div className="container">
        <Crumbs items={[{ label: 'شهرها' }]} />
      </div>
      <section className="page-head" aria-labelledby="cities-title">
        <div className="container">
          <h1 id="cities-title">دلگرمی در کدام شهرها فعال است؟</h1>
          <p className="lead">روان‌درمانی آنلاین در همه‌ی ایران فعال است. خدمات حضوری در شهرهایی فعال است که مرکز همکار داریم؛ در بقیه‌ی شهرها درخواست در لیست انتظار ثبت می‌شود و وقتی دلگرمی در شهرتان فعال شد پیامک می‌گیرید.</p>
          <CityCheck id="cities-city" level={2} />
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="active-title">
        <div className="container">
          <div className="section-head section-head--sub">
            <h2 className="h-card" id="active-title">شهرهایی که خدمت حضوری دارند</h2>
          </div>
          {active.length ? (
            <ul className="active-cities">
              {active.map((c) => (
                <li className="city-card" key={c.code}>
                  <h3>{c.slug ? <Link href={`/cities/${c.slug}`}>{c.name}</Link> : c.name}</h3>
                  <p className="province">استان {c.province}</p>
                  <ul className="badges" aria-label={`خدمت‌های حضوری ${c.name}`}>
                    {c.active.map((slug) => {
                      const name = activeName(slug);
                      return name ? <li className="dg-badge dg-badge--in-service" key={slug}>{name}</li> : null;
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">خدمات حضوری هنوز در هیچ شهری شروع نشده است. درخواست شما در لیست انتظار شهرتان ثبت می‌شود.</p>
          )}
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="all-title">
        <div className="container">
          <div className="section-head section-head--sub">
            <h2 className="h-card" id="all-title">شهرها به تفکیک استان</h2>
            <p>شهر شما اینجا نیست؟ اسمش را در کادر بالای صفحه بنویسید.</p>
            {active.length ? <p className="legend">شهرهایی که خدمت حضوری دارند</p> : null}
          </div>
          <div className="provinces">
            {provinces.map(([province, list]) => (
              <details key={province}>
                <summary>
                  <span>استان {province} <span className="count">{fa(list.length)} شهر</span></span>
                  <Ic icon={ChevronDown} />
                </summary>
                <nav className="city-links" aria-label={`شهرهای استان ${province}`}>
                  {list.map((c) => (
                    <Link key={c.code} href={`/cities/${c.slug}`} className={c.active.length ? 'is-active' : undefined}>
                      {c.name}
                      {c.active.length ? <span className="vh"> (خدمت حضوری دارد)</span> : null}
                    </Link>
                  ))}
                </nav>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
