import type { Metadata } from 'next';
import Link from 'next/link';
import { Missing, PhoneLink } from '@/components/site/Missing';
import { PageHead } from '@/components/site/PageHead';
import { SERVICES, SERVICE_LIST, isServiceSlug } from '@/content/services';

export const metadata: Metadata = { title: 'ثبت درخواست', robots: { index: false, follow: true } };

type Props = { searchParams: Promise<{ service?: string }> };

/** Stand-in until the four-step form (milestone 3); the links already carry ?service= and ?city=. */
export default async function RequestPage({ searchParams }: Props) {
  const { service } = await searchParams;
  const picked = isServiceSlug(service) ? SERVICES[service] : null;
  return (
    <>
      <PageHead title="ثبت درخواست" lead={picked ? `خدمتی که انتخاب کردید: ${picked.name}` : undefined} />
      <div className="container">
        <div className="soon-box">
          <Missing what="فرم درخواست (مرحله‌ی ۳ ساخت)" block>
            <p>فرم آنلاین درخواست به‌زودی همین‌جا فعال می‌شود: چهار مرحله‌ی کوتاه و تأیید شماره‌ی موبایل.</p>
          </Missing>
          <p>تا آن موقع می‌توانید با پشتیبانی تماس بگیرید: <PhoneLink /></p>
          <nav className="city-links" aria-label="خدمات">
            {SERVICE_LIST.map((s) => <Link key={s.slug} href={`/services/${s.slug}`}>{s.name}</Link>)}
          </nav>
        </div>
      </div>
    </>
  );
}
