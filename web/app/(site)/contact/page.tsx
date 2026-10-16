import { Clock, MapPin, Phone, PhoneCall } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Ic } from '@/components/site/Ic';
import { Fact, PhoneLink } from '@/components/site/Missing';
import { PageHead } from '@/components/site/PageHead';

export const metadata: Metadata = {
  title: 'تماس با ما',
  description: 'تلفن پشتیبانی، ساعت کاری و نشانی دلگرمی. برای درخواست مراقب، فرم درخواست سریع‌ترین راه است.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <PageHead
        title="تماس با دلگرمی"
        crumb="تماس با ما"
        lead="برای درخواست مراقب، پرستار یا جلسه‌ی روان‌درمانی، فرم درخواست سریع‌ترین راه است: چند سؤال کوتاه، و همکار ما خودش تماس می‌گیرد."
      >
        <div className="svc-actions">
          <Link className="dg-btn dg-btn--primary dg-btn--lg" href="/request">ثبت درخواست</Link>
        </div>
      </PageHead>
      <div className="container">
        <ul className="contact-list">
          <li><Ic icon={Phone} /><strong>تلفن پشتیبانی</strong><span><PhoneLink /></span></li>
          <li><Ic icon={Clock} /><strong>ساعت کاری</strong><span><Fact name="hours" /></span></li>
          <li><Ic icon={PhoneCall} /><strong>بعد از ثبت درخواست</strong><span><Fact name="callback" /></span></li>
          <li><Ic icon={MapPin} /><strong>نشانی</strong><span><Fact name="address" /></span></li>
        </ul>
        <div className="prose" style={{ marginTop: 'var(--space-12)' }}>
          <h2>پیگیری درخواست</h2>
          <p>اگر درخواست ثبت کرده‌اید، وضعیتش را در <Link href="/track">صفحه‌ی پیگیری</Link> ببینید.</p>
          <h2>شکایت یا پیشنهاد</h2>
          <p>اگر از مرکز یا مراقب معرفی‌شده راضی نیستید، با پشتیبانی تماس بگیرید. موضوع را با مرکز پیگیری می‌کنیم و نتیجه را به شما می‌گوییم. پیشنهادهایتان را هم با همین شماره به ما بگویید.</p>
        </div>
      </div>
    </>
  );
}
