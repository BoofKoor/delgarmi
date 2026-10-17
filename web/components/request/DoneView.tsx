'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Fact, PhoneLink } from '@/components/site/Missing';
import { Button, StatusTimeline, type TimelineItem } from '@/components/ui';
import { fa } from '@/lib/digits';
import { formatMobile } from '@/lib/form';
import { DONE_KEY, myRequest, type MyRequest } from './api';

type View = { kind: 'loading' } | { kind: 'shown'; request: MyRequest } | { kind: 'unknown' };

/**
 * The «ثبت شد» page. It reads the request back from the server with the token the form kept in
 * this tab; later, or on another device, it shows the code and points to tracking instead.
 */
export function DoneView({ code }: { code: string | null }) {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [copied, setCopied] = useState<'yes' | 'no' | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let saved: { code?: string; token?: string } | null = null;
    try { saved = JSON.parse(window.sessionStorage.getItem(DONE_KEY) ?? 'null'); } catch { saved = null; }
    if (!code || !saved?.token || saved.code !== code) { setView({ kind: 'unknown' }); return; }
    myRequest(code, saved.token).then((r) => setView(r.ok && r.data[0] ? { kind: 'shown', request: r.data[0] } : { kind: 'unknown' }));
  }, [code]);

  useEffect(() => {
    if (view.kind !== 'loading') heading.current?.focus();
  }, [view.kind]);

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied('yes');
    } catch {
      setCopied('no');
    }
  }

  const actions = (
    <div className="actions done-actions">
      <Link className="dg-btn dg-btn--primary dg-btn--lg" href="/track">پیگیری درخواست</Link>
      <Link className="dg-btn dg-btn--secondary dg-btn--lg" href="/">بازگشت به صفحه‌ی اول</Link>
    </div>
  );

  if (view.kind === 'loading') {
    return (
      <section className="done container" aria-busy="true">
        <h1 className="done-title">درخواست شما</h1>
        <p className="lead">یک لحظه صبر کنید…</p>
      </section>
    );
  }

  if (view.kind === 'unknown') {
    return (
      <section className="done container">
        <h1 className="done-title" ref={heading} tabIndex={-1}>{code ? 'کد پیگیری درخواست شما' : 'درخواستی اینجا نیست'}</h1>
        {code ? (
          <>
            <p className="done-code"><span className="num">{fa(code)}</span></p>
            <p className="lead">برای دیدن وضعیت درخواست، در صفحه‌ی پیگیری با همان شماره‌ی موبایل و یک کد پیامکی وارد شوید.</p>
          </>
        ) : (
          <p className="lead">برای ثبت درخواست تازه، فرم را از اول پر کنید.</p>
        )}
        {code ? actions : <div className="actions done-actions"><Link className="dg-btn dg-btn--primary dg-btn--lg" href="/request">ثبت درخواست</Link></div>}
      </section>
    );
  }

  const r = view.request;
  const waitlist = r.status === 'waitlist';
  const where = r.city?.name ?? 'شهر شما';
  const items: TimelineItem[] = waitlist
    ? [
        { title: 'لیست انتظار', meta: `درخواست شما محفوظ است و با فعال شدن ${where} به وضعیت «جدید» برمی‌گردد.`, state: 'current' },
        { title: 'پیامک فعال شدن شهر', meta: 'همکار ما بعد از آن تماس می‌گیرد.', state: 'todo' },
      ]
    : [
        { title: 'همکار ما تماس می‌گیرد', meta: <><Fact name="callback" />. جزئیات را کامل می‌کنیم و به سؤال‌هایتان جواب می‌دهیم.</>, state: 'current' },
        { title: 'مرکز مناسب را پیدا می‌کنیم', meta: r.online ? 'از بین درمانگران دارای پروانه‌ی مراکز همکار. وضعیت را در صفحه‌ی پیگیری می‌بینید.' : `از بین مراکز دارای مجوز ${where}. وضعیت را در صفحه‌ی پیگیری می‌بینید.`, state: 'todo' },
        { title: 'مرکز با شما هماهنگ می‌کند', meta: 'زمان شروع و هزینه پیش از شروع کار قطعی می‌شود.', state: 'todo' },
      ];

  return (
    <section className="done container">
      <h1 className="done-title" ref={heading} tabIndex={-1}>{waitlist ? 'در لیست انتظار ثبت شدید' : 'درخواست شما ثبت شد'}</h1>
      <p className="lead">
        پیامک تأیید و کد پیگیری به <span className="num">{formatMobile(r.mobile)}</span> فرستاده شد.
        {waitlist ? ` هنوز در ${where} مرکز همکار ${r.service.name} نداریم؛ به محض فعال شدن شهر پیامک می‌گیرید و درخواستتان بدون ثبت دوباره بررسی می‌شود.` : null}
      </p>
      <div className="done-code-box">
        <span className="done-code-label">کد پیگیری</span>
        <span className="done-code num">{fa(r.code)}</span>
        <Button variant="secondary" onClick={() => void copy()}>
          {copied === 'yes' ? <><Check className="ic" aria-hidden="true" focusable="false" strokeWidth={1.75} />کپی شد</> : 'کپی کد'}
        </Button>
        <p className="vh" role="status">{copied === 'yes' ? 'کد پیگیری کپی شد.' : copied === 'no' ? `کپی نشد. کد پیگیری: ${fa(r.code)}` : null}</p>
        {copied === 'no' ? <p className="small done-copy-failed">کپی نشد؛ کد را از همین‌جا بنویسید.</p> : null}
      </div>
      <h2 className="h-card done-next">بعد چه می‌شود؟</h2>
      <StatusTimeline items={items} />
      <p className="done-help small">ساعت کاری: <Fact name="hours" />. سؤالی دارید؟ <PhoneLink /></p>
      {actions}
    </section>
  );
}
