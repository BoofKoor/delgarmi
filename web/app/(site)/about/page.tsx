import type { Metadata } from 'next';
import Link from 'next/link';
import { Fact, Missing, PhoneLink } from '@/components/site/Missing';
import { PageHead } from '@/components/site/PageHead';

export const metadata: Metadata = {
  title: 'درباره‌ی ما',
  description: 'دلگرمی خانواده‌ها را به مراکز دارای مجوز مراقبت سالمند، پرستاری در منزل، پرستار کودک و روان‌درمانی وصل می‌کند و تا شروع کار کنارشان است.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <PageHead
        title="درباره‌ی دلگرمی"
        crumb="درباره‌ی ما"
        lead="دلگرمی برای خانواده‌هایی است که برای مراقبت از عزیزشان کمک لازم دارند و نمی‌دانند به چه کسی اعتماد کنند."
      />
      <div className="container">
        <div className="prose">
          <h2>چه می‌کنیم</h2>
          <p>
            درخواست شما را می‌گیریم، تماس می‌گیریم و جزئیات را می‌پرسیم، از بین مراکز دارای مجوز شهرتان مرکزی را پیدا می‌کنیم که همین خدمت را دارد و تا شروع کار کنارتان هستیم.
            چهار خدمت داریم: <Link href="/services/elderly-care">مراقبت سالمند</Link>، <Link href="/services/home-nursing">پرستاری در منزل</Link>، <Link href="/services/child-care">پرستار کودک</Link> و <Link href="/services/therapy">روان‌درمانی</Link>.
          </p>

          <h2>چه چیزهایی برایمان مهم است</h2>
          <ul>
            <li><strong>فقط مراکز دارای مجوز.</strong> مجوز هر مرکز را پیش از همکاری بررسی می‌کنیم و اعتبارش را دنبال می‌کنیم. <Link href="/how-we-vet">چطور مراکز را انتخاب می‌کنیم</Link></li>
            <li><strong>اطلاعات شما فقط برای یک مرکز.</strong> جز همکاران دلگرمی و مرکزی که معرفی می‌شود، کسی اطلاعات شما را نمی‌بیند.</li>
            <li><strong>حرف راست.</strong> نظر، امتیاز یا آماری که واقعی نباشد منتشر نمی‌کنیم و فقط قولی می‌دهیم که بتوانیم نگه داریم.</li>
            <li><strong>هیچ درخواستی بی‌پاسخ نمی‌ماند.</strong> اگر در شهرتان هنوز مرکز همکار نداریم، درخواست در لیست انتظار می‌ماند و با فعال شدن شهر خبرتان می‌کنیم.</li>
          </ul>

          <h2>مشخصات</h2>
          <ul>
            <li>نام حقوقی: <Fact name="legalName" /></li>
            <li>نشانی: <Fact name="address" /></li>
            <li>تلفن پشتیبانی: <PhoneLink /></li>
            <li>نماد اعتماد الکترونیکی: <Missing what="کد اینماد">بعد از ثبت</Missing></li>
          </ul>
        </div>
      </div>
    </>
  );
}
