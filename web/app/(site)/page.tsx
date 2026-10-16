import { BadgeCheck, CalendarDays, FileBadge, Lock, PhoneCall, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { preload } from 'react-dom';
import { CityCheck } from '@/components/site/CityCheck';
import { FaqList } from '@/components/site/FaqList';
import { Ic } from '@/components/site/Ic';
import { JsonLd } from '@/components/site/JsonLd';
import { Pending, PhoneLink } from '@/components/site/Missing';
import { Rays } from '@/components/site/Rays';
import { StickyCta } from '@/components/site/StickyCta';
import { ServiceCard, StatusBadge, StatusTimeline } from '@/components/ui';
import { FACTS } from '@/content/facts';
import { HOME_FAQ } from '@/content/faq';
import { SERVICE_LIST } from '@/content/services';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function Home() {
  // Pofak is only on this page (hero title, step numbers, closing title).
  preload('/fonts/PofakVF.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': `${SITE_URL}/#org`,
              name: 'دلگرمی',
              url: SITE_URL,
              logo: `${SITE_URL}/icon.svg`,
              ...(FACTS.phone ? { telephone: FACTS.phone.tel } : {}),
              ...(FACTS.legalName ? { legalName: FACTS.legalName } : {}),
            },
            { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: 'دلگرمی', url: SITE_URL, inLanguage: 'fa-IR', publisher: { '@id': `${SITE_URL}/#org` } },
          ],
        }}
      />

      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1 className="hero-title font-display" id="hero-title">مراقبت از عزیزانتان،<br /> با خیال راحت</h1>
            <p className="hero-lead">کسی را که برای مراقبت لازم دارید، از مراکز دارای مجوز شهرتان پیدا می‌کنیم و تا شروع کار کنارتان هستیم.</p>
            <h2 className="hero-ask" id="ask">چه کمکی لازم دارید؟</h2>
            <ul className="quick-services" id="quick-services" aria-labelledby="ask">
              {SERVICE_LIST.map((s) => (
                <li key={s.slug}>
                  <Link className="qs" href={`/request?service=${s.slug}`}>
                    <Ic icon={s.icon} />
                    <span>{s.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="hero-note"><Ic icon={Lock} /> بدون ثبت‌نام؛ چند سؤال کوتاه و تأیید شماره‌ی موبایل.</p>
          </div>
          <figure className="hero-figure">
            <div className="slab" aria-hidden="true" />
            <img
              src="/images/hero.webp"
              width={1000}
              height={1250}
              alt="مادربزرگی با روسری سبز که سبزه‌ی عید را در دست دارد و کنار پنجره‌ی خانه‌اش نشسته است"
              fetchPriority="high"
            />
            <Rays rise />
          </figure>
        </div>
      </section>

      <section className="trust" aria-label="چرا دلگرمی">
        <ul className="container trust-list">
          <li className="trust-item"><Ic icon={BadgeCheck} /><strong>فقط مراکز دارای مجوز</strong><span>مجوز هر مرکز را پیش از همکاری بررسی می‌کنیم.</span></li>
          <li className="trust-item"><Ic icon={PhoneCall} /><strong>همراهتان تا شروع کار</strong><span>همکار دلگرمی تماس می‌گیرد و درخواست را پیگیری می‌کند.</span></li>
          <li className="trust-item"><Ic icon={Lock} /><strong>اطلاعاتتان فقط برای یک مرکز</strong><span>جز مرکزی که معرفی می‌شود، کسی اطلاعات شما را نمی‌بیند.</span></li>
        </ul>
      </section>

      <section className="section" id="services" aria-labelledby="services-title">
        <div className="container">
          <div className="section-head">
            <h2 className="h-section" id="services-title">خدمات دلگرمی</h2>
            <p>هر چهار خدمت را مراکز دارای مجوز ارائه می‌دهند. خدمتی را که لازم دارید انتخاب کنید تا درباره‌اش بیشتر بخوانید یا همان‌جا درخواست بدهید.</p>
          </div>
          <div className="service-grid">
            {SERVICE_LIST.map((s) => (
              <ServiceCard key={s.slug} href={`/services/${s.slug}`} image={s.card.src} alt={s.card.alt} title={s.name} text={s.text} />
            ))}
          </div>
        </div>
      </section>

      <section className="section band" id="how" aria-labelledby="how-title">
        <div className="container how-grid">
          <div>
            <div className="section-head">
              <h2 className="h-section" id="how-title">از ثبت درخواست تا شروع کار</h2>
              <p>شما فقط درخواست را ثبت می‌کنید. پیدا کردن مرکز و هماهنگی‌ها با ماست.</p>
            </div>
            <ol className="steps-list">
              {[
                ['درخواست را ثبت می‌کنید', 'چند سؤال درباره‌ی نیاز، زمان و شهر. ثبت‌نام لازم نیست.'],
                ['با شما تماس می‌گیریم', 'همکار دلگرمی جزئیات را می‌پرسد و به سؤال‌هایتان جواب می‌دهد.'],
                ['مرکز مناسب را پیدا می‌کنیم', 'از بین مراکز دارای مجوز شهر شما، مرکزی که همین خدمت را دارد.'],
                ['مرکز با شما هماهنگ می‌کند', 'زمان شروع و هزینه را مرکز پیش از شروع کار با شما قطعی می‌کند.'],
              ].map(([title, text], i) => (
                <li key={title}>
                  <span className="step-num font-display" aria-hidden="true">{i + 1}</span>
                  <div><h3>{title}</h3><p>{text}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <figure className="track-card" aria-label="نمونه‌ی صفحه‌ی پیگیری درخواست">
            <div className="track-top">
              <div>
                <strong>درخواست <span className="num">۱۰۴۵۸۲</span></strong>
                <span className="small">مراقبت سالمند، اصفهان</span>
              </div>
              <StatusBadge status="matching" />
            </div>
            <StatusTimeline
              items={[
                { title: 'جدید', meta: 'سه‌شنبه ۲۱ مهر، ساعت ۱۰:۲۴', state: 'done' },
                { title: 'در حال تماس', meta: 'ساعت ۱۰:۴۰، جزئیات تلفنی کامل شد', state: 'done' },
                { title: 'در حال پیدا کردن مرکز', meta: 'مراکز دارای مجوز اصفهان بررسی می‌شوند', state: 'current' },
                { title: 'معرفی به مرکز', state: 'todo' },
                { title: 'در حال ارائه‌ی خدمت', state: 'todo' },
              ]}
            />
            <figcaption className="track-caption">نمونه‌ی صفحه‌ی پیگیری. وضعیت درخواست را هر وقت خواستید با کد پیگیری ببینید.</figcaption>
          </figure>
        </div>
      </section>

      <section className="section vetting" id="vetting" aria-labelledby="vet-title">
        <Rays />
        <div className="container">
          <div className="section-head">
            <h2 className="h-section" id="vet-title">فقط مراکز دارای مجوز</h2>
            <p>کسی که به خانه‌ی شما می‌آید از طرف یک مرکز رسمی می‌آید. پیش از همکاری با هر مرکز، این‌ها را بررسی می‌کنیم.</p>
          </div>
          <div className="vet-grid">
            <div className="vet-item">
              <Ic icon={FileBadge} />
              <h3>مجوز از مرجع خودش</h3>
              <p><Pending policy="licences">مراکز پرستاری در منزل از دانشگاه علوم پزشکی، مراکز مراقبت از بهزیستی و روان‌درمانگران از سازمان نظام روان‌شناسی پروانه دارند.</Pending></p>
            </div>
            <div className="vet-item">
              <Ic icon={CalendarDays} />
              <h3>اعتبار مجوز را دنبال می‌کنیم</h3>
              <p>تاریخ انقضای هر مجوز ثبت می‌شود. مرکزی که مجوزش تمدید نشده باشد معرفی نمی‌شود.</p>
            </div>
            <div className="vet-item">
              <Ic icon={ShieldCheck} />
              <h3>قرارداد با هر مرکز</h3>
              <p>درخواست شما فقط به مرکزی سپرده می‌شود که با دلگرمی قرارداد دارد.</p>
            </div>
          </div>
          <p className="vet-more"><Link href="/how-we-vet">بیشتر درباره‌ی روش انتخاب مراکز</Link></p>
        </div>
      </section>

      <section className="section" id="coverage" aria-labelledby="cov-title">
        <div className="container cover-grid">
          <div className="cover-copy">
            <h2 className="h-section" id="cov-title">در شهر شما فعال است؟</h2>
            <p>روان‌درمانی آنلاین در همه‌جای ایران فعال است. خدمات حضوری را در شهرهایی ارائه می‌دهیم که مرکز همکار داریم. اگر شهرتان هنوز در فهرست نیست، درخواستتان در لیست انتظار ثبت می‌شود و با فعال شدن شهر پیامک می‌گیرید.</p>
            <CityCheck id="home-city" />
          </div>
          <figure className="cover-photo">
            <img src="/images/coverage.webp" width={800} height={1000} alt="زن و مرد سالمند در اتاق خانه‌ای قدیمی، کنار کرسی و سفره‌ی عید" loading="lazy" decoding="async" />
          </figure>
        </div>
      </section>

      <section className="section section--flush" id="faq" aria-labelledby="faq-title">
        <div className="container faq-grid">
          <div className="section-head">
            <h2 className="h-section" id="faq-title">سؤال‌های پرتکرار</h2>
            <p>جواب سؤالتان اینجا نبود؟ <Link href="/faq">همه‌ی سؤال‌ها</Link> را ببینید؛ همکاران ما هم بعد از ثبت درخواست تماس می‌گیرند و می‌توانید همه‌چیز را بپرسید.</p>
          </div>
          <FaqList items={HOME_FAQ} />
        </div>
      </section>

      <section className="container" id="closing" aria-labelledby="closing-title">
        <div className="closing">
          <Rays />
          <h2 className="font-display" id="closing-title">چند سؤال کوتاه، بقیه‌اش با ما</h2>
          <p>درخواست را ثبت کنید؛ همکار دلگرمی تماس می‌گیرد و تا شروع کار کنارتان است.</p>
          <div className="actions">
            <Link className="dg-btn dg-btn--primary dg-btn--lg" href="/request">ثبت درخواست</Link>
            <PhoneLink className="dg-btn dg-btn--secondary dg-btn--lg" withIcon label="تماس با پشتیبانی" />
          </div>
        </div>
      </section>
      <StickyCta href="/request" label="ثبت درخواست" after="quick-services" hideWhile={['closing']} />
    </>
  );
}
