import Link from 'next/link';
import { SERVICE_LIST } from '@/content/services';

export function NotFoundBody() {
  return (
    <section className="page-head" aria-labelledby="nf-title">
      <div className="container">
        <h1 id="nf-title">این صفحه پیدا نشد</h1>
        <p className="lead">شاید نشانی اشتباه نوشته شده یا صفحه جابه‌جا شده است.</p>
        <div className="svc-actions">
          <Link className="dg-btn dg-btn--primary dg-btn--lg" href="/">صفحه‌ی اصلی</Link>
          <Link className="dg-btn dg-btn--secondary dg-btn--lg" href="/request">ثبت درخواست</Link>
        </div>
        <nav className="city-links" aria-label="خدمات" style={{ marginTop: 'var(--space-8)' }}>
          {SERVICE_LIST.map((s) => <Link key={s.slug} href={`/services/${s.slug}`}>{s.name}</Link>)}
        </nav>
      </div>
    </section>
  );
}
