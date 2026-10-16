import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqList, faqJsonLd } from '@/components/site/FaqList';
import { JsonLd } from '@/components/site/JsonLd';
import { PageHead } from '@/components/site/PageHead';
import { FAQ_GROUPS } from '@/content/faq';
import { SERVICE_LIST } from '@/content/services';

export const metadata: Metadata = {
  title: 'سؤال‌های پرتکرار',
  description: 'هزینه، زمان پیدا شدن مراقب، جایگزینی مراقب، لغو درخواست، شهرها و اطلاعات شما: جواب سؤال‌های پرتکرار درباره‌ی دلگرمی.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ_GROUPS.flatMap((g) => g.items))} />
      <PageHead title="سؤال‌های پرتکرار" lead="جواب سؤالتان اینجا نبود؟ بعد از ثبت درخواست همکار ما تماس می‌گیرد و می‌توانید همه‌چیز را بپرسید." />
      <div className="container">
        <div className="faq-groups">
          {FAQ_GROUPS.map((group, i) => (
            <section key={group.title} aria-labelledby={`faq-group-${i}`}>
              <h2 className="h-card" id={`faq-group-${i}`}>{group.title}</h2>
              <FaqList items={group.items} />
            </section>
          ))}
          <section aria-labelledby="faq-services">
            <h2 className="h-card" id="faq-services">سؤال‌های هر خدمت</h2>
            <nav className="city-links" aria-labelledby="faq-services">
              {SERVICE_LIST.map((s) => <Link key={s.slug} href={`/services/${s.slug}#svc-faq`}>{s.name}</Link>)}
            </nav>
          </section>
        </div>
      </div>
    </>
  );
}
