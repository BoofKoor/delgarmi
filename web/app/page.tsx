import Link from 'next/link';
import { preload } from 'react-dom';
import { LogoMark } from '@/components/ui';
import './soon.css';

// Placeholder until the real home page lands in milestone 2.
export default function Home() {
  preload('/fonts/PofakVF.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  return (
    <main id="main" className="soon container">
      <LogoMark size={112} />
      <h1 className="soon-name font-display">دلگرمی</h1>
      <p className="soon-tag">مراقبت از عزیزانتان، با خیال راحت</p>
      <p className="soon-note">سایت در حال ساخت است.</p>
      <Link href="/design-system">کامپوننت‌های سیستم طراحی</Link>
    </main>
  );
}
