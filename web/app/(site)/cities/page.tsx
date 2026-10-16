import type { Metadata } from 'next';
import Link from 'next/link';
import { CityCheck } from '@/components/site/CityCheck';
import { Crumbs } from '@/components/site/Crumbs';
import { SERVICES } from '@/content/services';
import { getCities, type CityItem } from '@/lib/api';

export const metadata: Metadata = {
  title: 'شهرها',
  description: 'روان‌درمانی آنلاین در همه‌ی ایران فعال است. ببینید خدمات حضوری دلگرمی در کدام شهرها فعال است.',
  alternates: { canonical: '/cities' },
};

const collator = new Intl.Collator('fa');

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
          <CityCheck id="cities-city" />
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="active-title">
        <div className="container">
          <h2 className="h-section" id="active-title" style={{ marginBottom: 'var(--space-4)' }}>شهرهایی که خدمت حضوری دارند</h2>
          {active.length ? (
            <ul className="avail-cities">
              {active.map((c) => (
                <li key={c.code}>
                  {c.slug ? <Link href={`/cities/${c.slug}`}>{c.name}</Link> : <strong>{c.name}</strong>}
                  <span className="small">: {c.active.map((slug) => SERVICES[slug]?.name).filter(Boolean).join('، ')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">خدمات حضوری هنوز در هیچ شهری شروع نشده است. درخواست شما در لیست انتظار شهرتان ثبت می‌شود.</p>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="all-title">
        <div className="container">
          <div className="section-head">
            <h2 className="h-section" id="all-title">شهرها به تفکیک استان</h2>
            <p>شهر شما اینجا نیست؟ اسمش را در کادر بالا بنویسید.</p>
          </div>
          <div className="provinces">
            {provinces.map(([province, list]) => (
              <div key={province}>
                <h3>استان {province}</h3>
                <nav className="city-links" aria-label={`شهرهای استان ${province}`}>
                  {list.map((c) => <Link key={c.code} href={`/cities/${c.slug}`}>{c.name}</Link>)}
                </nav>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
