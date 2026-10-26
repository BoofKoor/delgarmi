import type { Metadata } from 'next';
import { connection } from 'next/server';
import { RequestForm } from '@/components/request/RequestForm';
import { PhoneLink } from '@/components/site/Missing';
import { PageHead } from '@/components/site/PageHead';
import { Notice } from '@/components/ui';
import { isServiceSlug } from '@/content/services';
import { asCityItem, getCity, getForm, getServiceHints, type CityItem } from '@/lib/api';
import { linkedAnswers } from '@/lib/form';

export const metadata: Metadata = { title: 'ثبت درخواست', robots: { index: false, follow: true } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * The four-step request form. The questions come from the API (api/catalog/form.json), which
 * checks the answers against the same file. Links bring the service, the option picked on its
 * page and the city; anything that is not a real service, option or city is ignored.
 */
export default async function RequestPage({ searchParams }: Props) {
  const params = await searchParams;
  const one = (key: string) => (typeof params[key] === 'string' ? params[key] : undefined);
  await connection();

  const loaded = await Promise.all([getForm(), getServiceHints()]).catch(() => null);
  if (!loaded) {
    return (
      <>
        <PageHead title="ثبت درخواست" lead="چند سؤال کوتاه درباره‌ی نیاز، زمان و شهر؛ بعد همکار دلگرمی تماس می‌گیرد." />
        <div className="container page-body">
          <div className="soon-box">
            <Notice tone="danger" title="فرم درخواست الان باز نشد">
              چند لحظه بعد صفحه را دوباره باز کنید، یا با پشتیبانی تماس بگیرید.
            </Notice>
            <div className="actions">
              <PhoneLink className="dg-btn dg-btn--primary dg-btn--lg" withIcon label="تماس با پشتیبانی" button />
            </div>
          </div>
        </div>
      </>
    );
  }
  const [def, hints] = loaded;

  const serviceKey = one('service');
  const service = isServiceSlug(serviceKey) ? serviceKey : null;
  const linked = service ? linkedAnswers(def.services[service], { type: one('type'), task: one('task'), hours: one('hours'), for: one('for') }) : {};

  let city: CityItem | null = null;
  const cityKey = one('city');
  if (cityKey && /^\d{1,12}$/.test(cityKey)) {
    const detail = await getCity(cityKey).catch(() => null);
    city = detail ? asCityItem(detail) : null;
  }

  return <RequestForm def={def} service={service} linked={linked} city={city} hints={hints} />;
}
