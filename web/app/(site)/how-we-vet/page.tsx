import type { Metadata } from 'next';
import Link from 'next/link';
import { Pending } from '@/components/site/Missing';
import { PageHead } from '@/components/site/PageHead';

export const metadata: Metadata = {
  title: 'چطور مراکز را انتخاب می‌کنیم',
  description: 'دلگرمی فقط با مراکزی کار می‌کند که از مرجع رسمی همان خدمت مجوز دارند. پیش و بعد از همکاری با هر مرکز چه چیزهایی را بررسی می‌کنیم.',
  alternates: { canonical: '/how-we-vet' },
};

export default function HowWeVetPage() {
  return (
    <>
      <PageHead
        title="چطور مراکز را انتخاب می‌کنیم"
        lead="کسی که به خانه‌ی شما می‌آید از طرف یک مرکز رسمی می‌آید. دلگرمی خودش مراقب یا پرستار نمی‌فرستد؛ درخواست شما را به مرکزی دارای مجوز در شهرتان می‌سپارد و تا شروع کار پیگیری می‌کند."
      />
      <div className="container">
        <div className="prose">
          <h2>هر خدمت، مجوز از مرجع خودش</h2>
          <table>
            <thead>
              <tr><th scope="col">خدمت</th><th scope="col">مجوز از</th></tr>
            </thead>
            <tbody>
              <tr><td>مراقبت سالمند</td><td><Pending policy="licences">سازمان بهزیستی</Pending></td></tr>
              <tr><td>پرستار کودک</td><td><Pending policy="licences">سازمان بهزیستی</Pending></td></tr>
              <tr><td>پرستاری در منزل</td><td>دانشگاه علوم پزشکی همان منطقه</td></tr>
              <tr><td>روان‌درمانی</td><td>سازمان نظام روان‌شناسی و مشاوره (پروانه‌ی درمانگر)</td></tr>
            </tbody>
          </table>
          <p className="muted">مجوز مراکز پرستاری در منزل را دانشگاه علوم پزشکی هر منطقه صادر می‌کند؛ برای همین هر مرکز تازه را جداگانه استعلام می‌کنیم.</p>

          <h2>پیش از همکاری چه چیزهایی را بررسی می‌کنیم</h2>
          <ul>
            <li>شماره و نوع مجوز، مرجع صادرکننده و تاریخ انقضای آن</li>
            <li>اینکه مجوز به نام همین مرکز و برای همین خدمت و همین شهر باشد</li>
            <li>نشانی و تلفن ثابت مرکز و نام مسئول فنی آن</li>
            <li>قرارداد کتبی با دلگرمی، از جمله برای حفظ اطلاعات خانواده‌ها</li>
          </ul>

          <h2>بعد از شروع همکاری</h2>
          <ul>
            <li>تاریخ انقضای هر مجوز را ثبت می‌کنیم و پیش از انقضا با مرکز پیگیری می‌کنیم. مرکزی را که مجوزش تمدید نشده باشد معرفی نمی‌کنیم.</li>
            <li>هر درخواست را تا شروع کار پیگیری می‌کنیم و نتیجه‌ی هر تماس ثبت می‌شود.</li>
            <li><Pending policy="replace">اگر از مرکز یا مراقب راضی نبودید، به ما خبر دهید. با مرکز صحبت می‌کنیم و اگر لازم باشد مرکز دیگری را پیشنهاد می‌کنیم.</Pending></li>
          </ul>

          <h2>کارهایی که دلگرمی نمی‌کند</h2>
          <ul>
            <li>مراقب یا پرستار استخدام نمی‌کنیم و خودمان کسی را به خانه‌ی شما نمی‌فرستیم؛ کار مراقب زیر نظر مرکز است.</li>
            <li><Pending policy="price">مبلغ خدمت را تعیین نمی‌کنیم؛ مرکز پیش از شروع کار آن را با شما قطعی می‌کند.</Pending></li>
            <li>نظر، امتیاز یا آماری که واقعی نباشد منتشر نمی‌کنیم.</li>
          </ul>

          <p className="actions" style={{ marginTop: 'var(--space-12)' }}>
            <Link className="dg-btn dg-btn--primary dg-btn--lg" href="/request">ثبت درخواست</Link>
            <Link className="dg-btn dg-btn--secondary dg-btn--lg" href="/faq">سؤال‌های پرتکرار</Link>
          </p>
        </div>
      </div>
    </>
  );
}
