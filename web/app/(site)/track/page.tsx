import type { Metadata } from 'next';
import { PhoneLink } from '@/components/site/Missing';
import { Notice } from '@/components/ui';
import { PageHead } from '@/components/site/PageHead';

export const metadata: Metadata = { title: 'پیگیری درخواست', robots: { index: false, follow: true } };

/** Stand-in until tracking ships with the request form. */
export default function TrackPage() {
  return (
    <>
      <PageHead title="پیگیری درخواست" lead="وضعیت درخواست را اینجا با شماره‌ی موبایل و یک کد پیامکی می‌بینید." />
      <div className="container page-body">
        <div className="soon-box">
          <Notice title="پیگیری آنلاین به‌زودی همین‌جاست" live={false}>
            این صفحه بعد از فعال شدن فرم درخواست راه می‌افتد.
          </Notice>
          <div className="actions">
            <PhoneLink className="dg-btn dg-btn--primary dg-btn--lg" withIcon label="تماس با پشتیبانی" button />
          </div>
        </div>
      </div>
    </>
  );
}
