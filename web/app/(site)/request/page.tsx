import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { PhoneLink } from '@/components/site/Missing';
import { PageHead } from '@/components/site/PageHead';
import { Notice } from '@/components/ui';
import { SERVICES, isServiceSlug } from '@/content/services';
import { getCity, type CityDetail } from '@/lib/api';

export const metadata: Metadata = { title: 'ثبت درخواست', robots: { index: false, follow: true } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Stand-in until the four-step form (milestone 3). It repeats what the visitor picked, so the
 * links that bring them here (service, option, city) can be checked already. */
export default async function RequestPage({ searchParams }: Props) {
  const params = await searchParams;
  const one = (key: string) => (typeof params[key] === 'string' ? params[key] : undefined);
  const serviceKey = one('service');
  const service = isServiceSlug(serviceKey) ? SERVICES[serviceKey] : null;
  // The option a service page links with (…&type=night): the same key and value.
  const option = service?.choices.items.find((c) => {
    const query = new URLSearchParams(c.href.split('?')[1]);
    return ['type', 'task', 'hours', 'for'].some((k) => query.has(k) && query.get(k) === one(k));
  });
  const cityKey = one('city');
  let city: CityDetail | null = null;
  if (cityKey && /^\d{1,12}$/.test(cityKey)) {
    await connection();
    // Without the API the page still offers the phone number.
    city = await getCity(cityKey).catch(() => null);
  }
  const picked = [
    service ? { k: 'خدمت', v: service.name } : null,
    option ? { k: 'نوع', v: option.title } : null,
    city ? { k: 'شهر', v: `${city.name}، استان ${city.province}` } : null,
  ].filter((x): x is { k: string; v: string } => x !== null);

  return (
    <>
      <PageHead title="ثبت درخواست" lead="چند سؤال کوتاه درباره‌ی نیاز، زمان و شهر؛ بعد همکار دلگرمی تماس می‌گیرد." />
      <div className="container page-body">
        <div className="soon-box">
          {picked.length ? (
            <dl className="picked">
              {picked.map((p) => (
                <div key={p.k}><dt>{p.k}</dt><dd>{p.v}</dd></div>
              ))}
            </dl>
          ) : null}
          <Notice title="فرم آنلاین درخواست به‌زودی همین‌جاست" live={false}>
            چهار مرحله‌ی کوتاه و تأیید شماره‌ی موبایل؛ بدون ثبت‌نام. تا آن موقع با پشتیبانی تماس بگیرید.
          </Notice>
          <div className="actions">
            <PhoneLink className="dg-btn dg-btn--primary dg-btn--lg" withIcon label="تماس با پشتیبانی" button />
            {service ? <Link className="dg-btn dg-btn--secondary dg-btn--lg" href={`/services/${service.slug}`}>بازگشت به {service.name}</Link> : null}
          </div>
        </div>
      </div>
    </>
  );
}
