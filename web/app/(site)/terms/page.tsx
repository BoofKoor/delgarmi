import type { Metadata } from 'next';
import Link from 'next/link';
import { Fact, Pending } from '@/components/site/Missing';
import { TextPage } from '@/components/site/TextPage';

export const metadata: Metadata = {
  title: 'قوانین',
  description: 'نقش دلگرمی و مرکز ارائه‌دهنده‌ی خدمت، هزینه، لغو درخواست و رسیدگی به شکایت.',
  alternates: { canonical: '/terms' },
};

const TOC = [
  { id: 'role', label: 'نقش دلگرمی و مرکز' },
  { id: 'price', label: 'هزینه' },
  { id: 'cancel', label: 'لغو' },
  { id: 'your-data', label: 'اطلاعاتی که می‌دهید' },
  { id: 'emergency', label: 'اورژانس' },
  { id: 'complaints', label: 'رسیدگی به شکایت' },
  { id: 'details', label: 'مشخصات' },
];

export default function TermsPage() {
  return (
    <TextPage title="قوانین استفاده" crumb="قوانین" lead="دلگرمی درخواست شما را به مرکزی دارای مجوز معرفی می‌کند؛ خدمت را همان مرکز ارائه می‌دهد." toc={TOC}>
        <Pending policy="legal" block>
          <div className="prose">
            <h2 id="role">نقش دلگرمی و مرکز</h2>
            <ul>
              <li>دلگرمی درخواست شما را ثبت می‌کند، با شما تماس می‌گیرد و شما را به یک مرکز دارای مجوز در شهرتان معرفی می‌کند.</li>
              <li>خدمت (مراقبت، پرستاری، نگهداری از کودک یا جلسه‌ی روان‌درمانی) را مرکز ارائه می‌دهد؛ با مجوز خودش و طبق قراری که با شما می‌گذارد.</li>
              <li>کار مراقب، پرستار یا درمانگر زیر نظر همان مرکز است.</li>
            </ul>

            <h2 id="price">هزینه</h2>
            <Pending policy="price" block>
              <ul>
                <li>مبلغ خدمت را مرکز تعیین می‌کند و پیش از شروع کار با شما قطعی می‌کند. تا آن موقع تعهدی ندارید.</li>
                <li>ثبت درخواست در دلگرمی برای شما هزینه‌ای ندارد.</li>
              </ul>
            </Pending>

            <h2 id="cancel">لغو</h2>
            <p><Pending policy="cancel">تا پیش از شروع کار می‌توانید درخواست را لغو کنید؛ کافی است با پشتیبانی تماس بگیرید.</Pending></p>

            <h2 id="your-data">اطلاعاتی که می‌دهید</h2>
            <ul>
              <li>اطلاعات درخواست باید درست باشد، و شماره‌ی موبایل متعلق به خودتان یا کسی باشد که از طرفش درخواست می‌دهید.</li>
              <li>اینکه اطلاعات با چه کسی به اشتراک گذاشته می‌شود در صفحه‌ی <Link href="/privacy">حریم خصوصی</Link> آمده است.</li>
            </ul>

            <h2 id="emergency">اورژانس</h2>
            <p>دلگرمی خدمت اورژانسی نیست. در شرایط اورژانسی با <a href="tel:115">اورژانس ۱۱۵</a> تماس بگیرید، و اگر در بحران روحی هستید یا به آسیب زدن به خودتان فکر می‌کنید، با <a href="tel:123">اورژانس اجتماعی ۱۲۳</a>.</p>

            <h2 id="complaints">رسیدگی به شکایت</h2>
            <p><Pending policy="replace">اگر از خدمت مرکز راضی نبودید، به پشتیبانی خبر دهید. موضوع را با مرکز پیگیری می‌کنیم، نتیجه را به شما می‌گوییم و اگر لازم باشد مرکز دیگری را پیشنهاد می‌کنیم.</Pending></p>

            <h2 id="details">مشخصات</h2>
            <ul>
              <li>نام حقوقی: <Fact name="legalName" /></li>
              <li>نشانی: <Fact name="address" /></li>
            </ul>
          </div>
        </Pending>
    </TextPage>
  );
}
