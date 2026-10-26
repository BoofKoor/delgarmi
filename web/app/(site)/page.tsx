import { ArrowLeft, BadgeCheck, CalendarDays, FileBadge, Lock, PhoneCall, ShieldCheck } from 'lucide-react';
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
import { ProcessSteps, ServiceCard, StatusBadge, StatusTimeline } from '@/components/ui';
import { FACTS } from '@/content/facts';
import { HOME_FAQ } from '@/content/faq';
import { PROCESS } from '@/content/process';
import { SERVICE_LIST } from '@/content/services';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = { alternates: { canonical: '/' } };

/** The sample tracking page: two steps done, one under way, two to come. */
const SAMPLE_PATH = ['done', 'done', 'current', 'todo', 'todo'] as const;

export default function Home() {
  // Pofak is on this page for the hero title, the step numbers and the closing title.
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
            <p className="hero-lead">کسی را که برای مراقبت لازم دارید، از مراکز دارای مجوز پیدا می‌کنیم و تا شروع کار کنارتان هستیم.</p>
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
          <li className="trust-item"><Ic icon={Lock} /><strong>اطلاعاتتان فقط برای یک مرکز</strong><span>جز همکاران دلگرمی و مرکزی که معرفی می‌شود، کسی اطلاعات شما را نمی‌بیند.</span></li>
        </ul>
      </section>

      <section className="section" id="services" aria-labelledby="services-title">
        <div className="container">
          <div className="section-head">
            <h2 className="h-section" id="services-title">خدمات دلگرمی</h2>
            <p>هر چهار خدمت را مراکز دارای مجوز ارائه می‌دهند. درباره‌ی هر کدام بیشتر بخوانید یا همان‌جا درخواست بدهید.</p>
          </div>
          {/* Phones: compact rows (the tiles above already lead to the form); wider screens: cards. */}
          <ul className="dg-service-list service-grid">
            {SERVICE_LIST.map((s) => (
              <li key={s.slug}>
                <ServiceCard href={`/services/${s.slug}`} image={s.card.src} alt={s.card.alt} title={s.name} text={s.text} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section band" id="how" aria-labelledby="how-title">
        <div className="container how-grid">
          <div>
            <div className="section-head">
              <h2 className="h-section" id="how-title">از ثبت درخواست تا شروع کار</h2>
              <p>شما فقط درخواست را ثبت می‌کنید. پیدا کردن مرکز و پیگیری با ماست.</p>
            </div>
            <ProcessSteps steps={PROCESS} display />
          </div>
          <figure className="track-card" aria-label="نمونه‌ی صفحه‌ی پیگیری درخواست">
            <p className="track-label">نمونه‌ی صفحه‌ی پیگیری</p>
            <div className="track-top">
              <div>
                <strong>درخواست <span className="num">۱۰۴۵۸۲</span></strong>
                <span className="small">مراقبت سالمند، اصفهان</span>
              </div>
              <StatusBadge status="matching" />
            </div>
            <div className="track-bar" aria-hidden="true">
              {SAMPLE_PATH.map((state, i) => <span key={i} className={`is-${state}`} />)}
            </div>
            <div className="track-timeline">
              <StatusTimeline
                items={[
                  { title: 'جدید', meta: 'سه‌شنبه ۲۱ مهر، ساعت ۱۰:۲۴', state: 'done' },
                  { title: 'در حال تماس', meta: 'ساعت ۱۰:۴۰، جزئیات تلفنی کامل شد', state: 'done' },
                  { title: 'در حال پیدا کردن مرکز', meta: 'مراکز دارای مجوز اصفهان بررسی می‌شوند', state: 'current' },
                  { title: 'معرفی به مرکز', state: 'todo' },
                  { title: 'در حال ارائه‌ی خدمت', state: 'todo' },
                ]}
              />
            </div>
            <figcaption className="track-caption">نمونه؛ شماره ساختگی است. وضعیت درخواستتان را با شماره‌ی موبایل خودتان می‌بینید.</figcaption>
          </figure>
        </div>
      </section>

      <section className="section vetting" id="vetting" aria-labelledby="vet-title">
        <div className="container">
          <Rays />
          <div className="section-head">
            <h2 className="h-section" id="vet-title">فقط مراکز دارای مجوز</h2>
            <p>کسی که به خانه‌ی شما می‌آید از طرف یک مرکز رسمی می‌آید. پیش از همکاری با هر مرکز، این‌ها را بررسی می‌کنیم.</p>
          </div>
          <ul className="vet-grid">
            <li className="vet-item">
              <Ic icon={FileBadge} />
              <div>
                <h3>مجوز از مرجع خودش</h3>
                <p><Pending policy="licences">مراکز پرستاری در منزل از دانشگاه علوم پزشکی، مراکز مراقبت از بهزیستی و روان‌درمانگران از سازمان نظام روان‌شناسی و مشاوره مجوز دارند.</Pending></p>
              </div>
            </li>
            <li className="vet-item">
              <Ic icon={CalendarDays} />
              <div>
                <h3>اعتبار مجوز را دنبال می‌کنیم</h3>
                <p>تاریخ انقضای هر مجوز را ثبت می‌کنیم و مرکزی را که مجوزش تمدید نشده باشد معرفی نمی‌کنیم.</p>
              </div>
            </li>
            <li className="vet-item">
              <Ic icon={ShieldCheck} />
              <div>
                <h3>قرارداد با هر مرکز</h3>
                <p>درخواست شما را فقط به مرکزی می‌سپاریم که با دلگرمی قرارداد دارد.</p>
              </div>
            </li>
          </ul>
          <p className="vet-more"><Link className="more-link" href="/how-we-vet">بیشتر درباره‌ی روش انتخاب مراکز<Ic icon={ArrowLeft} /></Link></p>
        </div>
      </section>

      <section className="section" id="coverage" aria-labelledby="cov-title">
        <div className="container cover-grid">
          <div className="cover-copy">
            <h2 className="h-section" id="cov-title">دلگرمی در شهر شما فعال است؟</h2>
            <p>روان‌درمانی آنلاین در همه‌ی ایران فعال است. خدمات حضوری فقط در شهرهایی است که مرکز همکار داریم؛ در بقیه‌ی شهرها درخواست در لیست انتظار می‌ماند و با فعال شدن شهر پیامک می‌گیرید.</p>
            <CityCheck id="home-city" />
          </div>
          <figure className="cover-photo">
            <img src="/images/coverage.webp" width={800} height={1000} alt="زن و مرد سالمند در اتاق خانه‌ای قدیمی، کنار کرسی و سفره‌ی عید" loading="lazy" decoding="async" />
          </figure>
        </div>
      </section>

      <section className="section band" id="faq" aria-labelledby="faq-title">
        <div className="container faq-grid">
          <div className="section-head">
            <h2 className="h-section" id="faq-title">سؤال‌های پرتکرار</h2>
            <p>جواب سؤالتان اینجا نبود؟ همکار ما بعد از ثبت درخواست تماس می‌گیرد و می‌توانید همه‌چیز را بپرسید.</p>
          </div>
          <div>
            <FaqList items={HOME_FAQ} />
            <p className="more-row"><Link className="more-link" href="/faq">همه‌ی سؤال‌ها<Ic icon={ArrowLeft} /></Link></p>
          </div>
        </div>
      </section>

      <section className="section" id="closing" aria-labelledby="closing-title">
        <div className="container">
          <div className="closing">
            <Rays />
            <h2 className="font-display" id="closing-title">چند سؤال کوتاه، بقیه‌اش با ما</h2>
            <p>درخواست را ثبت کنید؛ همکار دلگرمی تماس می‌گیرد و تا شروع کار کنارتان است.</p>
            <div className="actions">
              <Link className="dg-btn dg-btn--primary dg-btn--lg" href="/request">ثبت درخواست</Link>
              <PhoneLink className="dg-btn dg-btn--secondary dg-btn--lg" withIcon label="تماس با پشتیبانی" button />
            </div>
          </div>
        </div>
      </section>
      <StickyCta href="/request" label="ثبت درخواست" after="quick-services" hideWhile={['closing']} />
    </>
  );
}
