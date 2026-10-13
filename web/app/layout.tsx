import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { preload } from 'react-dom';
import tokens from '@/design/tokens.json';
import '@/styles/tokens.css';
import '@/design/components.css';
import '@/styles/base.css';

const pageColor = tokens.color.tokens.find((t) => t.name === 'surface-page')?.value;

export const metadata: Metadata = {
  title: { default: 'دلگرمی | مراقبت از عزیزانتان، با خیال راحت', template: '%s | دلگرمی' },
  description: 'درخواست مراقب سالمند، پرستار در منزل، پرستار کودک و روان‌درمانگر از مراکز دارای مجوز، در همه‌ی ایران.',
};

export const viewport: Viewport = { themeColor: pageColor, width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: ReactNode }) {
  preload('/fonts/IRANYekanXVFaNumVF.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
