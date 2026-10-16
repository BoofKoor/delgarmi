import type { Metadata } from 'next';
import Link from 'next/link';
import { Fact, Missing, PhoneLink } from '@/components/site/Missing';
import { TextPage } from '@/components/site/TextPage';

export const metadata: Metadata = {
  title: 'درباره‌ی ما',
  description: 'دلگرمی خانواده‌ها را به مراکز دارای مجوز مراقبت سالمند، پرستاری در منزل، پرستار کودک و روان‌درمانی وصل می‌کند و تا شروع کار کنارشان است.',
  alternates: { canonical: '/about' },
};

const TOC = [
  { id: 'what', label: 'چه می‌کنیم' },
  { id: 'values', label: 'چه چیزهایی برایمان مهم است' },
  { id: 'details', label: 'مشخصات' },
];

export default function AboutPage() {
  return (
    <TextPage
      title="درباره‌ی دلگرمی"
      crumb="درباره‌ی ما"
      lead="دلگرمی برای خانواده‌هایی است که برای مراقبت از عزیزشان کمک لازم دارند و نمی‌دانند به چه کسی اعتماد کنند."
      toc={TOC}
    >
      <div className="prose">
        <h2 id="what">چه می‌کنیم</h2>
        <p>
          درخواست شما را ثبت می‌کنیم و با شما تماس می‌گیریم تا جزئیات را بپرسیم. بعد از بین مراکز دارای مجوز شهرتان مرکزی را پیدا می‌کنیم که همین خدمت را دارد و تا شروع کار کنارتان هستیم.
          چهار خدمت داریم: <Link href="/services/elderly-care">مراقبت سالمند</Link>، <Link href="/services/home-nursing">پرستاری در منزل</Link>، <Link href="/services/child-care">پرستار کودک</Link> و <Link href="/services/therapy">روان‌درمانی</Link>.
        </p>

        <h2 id="values">چه چیزهایی برایمان مهم است</h2>
        <ul>
          <li><strong>فقط مراکز دارای مجوز.</strong> مجوز هر مرکز را پیش از همکاری بررسی می‌کنیم و اعتبارش را دنبال می‌کنیم. <Link href="/how-we-vet">روش انتخاب مراکز</Link></li>
          <li><strong>اطلاعات شما فقط برای یک مرکز.</strong> جز همکاران دلگرمی و مرکزی که معرفی می‌شود، کسی اطلاعات شما را نمی‌بیند.</li>
          <li><strong>حرف راست.</strong> نظر، امتیاز یا آماری که واقعی نباشد منتشر نمی‌کنیم و فقط قولی می‌دهیم که بتوانیم به آن عمل کنیم.</li>
          <li><strong>هیچ درخواستی بی‌جواب نمی‌ماند.</strong> اگر در شهرتان هنوز مرکز همکار نداریم، همین را به شما می‌گوییم؛ درخواست در لیست انتظار می‌ماند و وقتی دلگرمی در شهرتان فعال شد خبرتان می‌کنیم.</li>
        </ul>

        <h2 id="details">مشخصات</h2>
        <ul>
          <li>نام حقوقی: <Fact name="legalName" /></li>
          <li>نشانی: <Fact name="address" /></li>
          <li>تلفن پشتیبانی: <PhoneLink /></li>
          <li>نماد اعتماد الکترونیکی: <Missing what="کد اینماد">بعد از ثبت</Missing></li>
        </ul>
      </div>
    </TextPage>
  );
}
