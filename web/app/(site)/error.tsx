'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="page-head" aria-labelledby="err-title">
      <div className="container">
        <h1 id="err-title">این صفحه الان باز نشد</h1>
        <p className="lead">مشکل از ماست، نه از شما. چند لحظه بعد دوباره امتحان کنید.</p>
        <div className="svc-actions">
          <button className="dg-btn dg-btn--primary dg-btn--lg" type="button" onClick={() => retry()}>دوباره امتحان کنید</button>
          <Link className="dg-btn dg-btn--secondary dg-btn--lg" href="/">صفحه‌ی اصلی</Link>
        </div>
      </div>
    </section>
  );
}
