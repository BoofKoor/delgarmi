import type { Metadata } from 'next';
import { Missing, PhoneLink } from '@/components/site/Missing';
import { PageHead } from '@/components/site/PageHead';

export const metadata: Metadata = { title: 'پیگیری درخواست', robots: { index: false, follow: true } };

/** Stand-in until tracking ships with the request form. */
export default function TrackPage() {
  return (
    <>
      <PageHead title="پیگیری درخواست" lead="وضعیت درخواست را اینجا با شماره‌ی موبایل و یک کد پیامکی می‌بینید." />
      <div className="container">
        <div className="soon-box">
          <Missing what="صفحه‌ی پیگیری (مرحله‌ی ۵ ساخت)" block>
            <p>این صفحه بعد از فعال شدن فرم درخواست راه می‌افتد.</p>
          </Missing>
          <p>تا آن موقع برای پیگیری با پشتیبانی تماس بگیرید: <PhoneLink /></p>
        </div>
      </div>
    </>
  );
}
