'use client';

import { Check, Copy } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Fact, PhoneLink } from '@/components/site/Missing';
import { Button, ProcessSteps, type ProcessStep } from '@/components/ui';
import { processFor } from '@/content/process';
import { isServiceSlug } from '@/content/services';
import { fa } from '@/lib/digits';
import { formatMobile } from '@/lib/form';
import { DONE_KEY, myRequest, type MyRequest } from './api';

type View = { kind: 'loading' } | { kind: 'shown'; request: MyRequest } | { kind: 'unknown' };

/**
 * The «ثبت شد» page. It reads the request back from the server with the token the form kept in
 * this tab; later, or on another device, it shows the code only. Until tracking exists (stage 5)
 * its main button goes back to the home page, so nothing here promises a page that is not there.
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

  const home = <Link className="dg-btn dg-btn--primary dg-btn--lg done-home" href="/">بازگشت به صفحه‌ی اول</Link>;

  const codeBox = code ? (
    <div className="dg-codebox done-code-box">
      <div>
        <p className="dg-codebox-label">کد پیگیری</p>
        <p className="dg-codebox-code done-code"><span className="num">{fa(code)}</span></p>
      </div>
      <Button variant="secondary" onClick={() => void copy()}>
        {copied === 'yes' ? <><Check aria-hidden="true" focusable="false" strokeWidth={1.75} />کپی شد</> : <><Copy aria-hidden="true" focusable="false" strokeWidth={1.75} />کپی کد</>}
      </Button>
      <p className="vh" role="status">{copied === 'yes' ? 'کد پیگیری کپی شد.' : copied === 'no' ? `کپی نشد. کد پیگیری: ${fa(code)}` : null}</p>
      {copied === 'no' ? <p className="small done-copy-failed">کپی نشد؛ کد را از همین‌جا بنویسید.</p> : null}
    </div>
  ) : null;

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
            {codeBox}
            <p className="lead">همکار دلگرمی با همان شماره‌ای که تأیید کردید تماس می‌گیرد. اگر سؤالی دارید، این کد را به پشتیبانی بگویید.</p>
            {home}
          </>
        ) : (
          <>
            <p className="lead">برای ثبت درخواست تازه، فرم را از اول پر کنید.</p>
            <Link className="dg-btn dg-btn--primary dg-btn--lg done-home" href="/request">ثبت درخواست</Link>
          </>
        )}
      </section>
    );
  }

  const r = view.request;
  const waitlist = r.status === 'waitlist';
  const where = r.city?.name ?? 'شهر شما';
  const steps = processFor(isServiceSlug(r.service.slug) ? r.service.slug : null);
  const items: ProcessStep[] = waitlist
    ? [
        { title: 'ثبت در لیست انتظار', text: 'همین حالا ثبت شد.', state: 'done' },
        { title: 'فعال شدن شهر', text: `درخواست شما محفوظ است و با فعال شدن ${where} پیامک می‌گیرید.`, state: 'current' },
        { title: steps[1].title, text: 'همکار ما بعد از آن تماس می‌گیرد؛ لازم نیست دوباره درخواست ثبت کنید.', state: 'todo' },
      ]
    : [
        { title: steps[0].title, text: 'همین حالا ثبت شد.', state: 'done' },
        { title: steps[1].title, text: <><Fact name="callback" />. جزئیات را کامل می‌کنیم و به سؤال‌هایتان جواب می‌دهیم.</>, state: 'current' },
        { title: steps[2].title, text: r.online ? 'از بین درمانگران دارای پروانه‌ی مراکز همکار.' : `از بین مراکز دارای مجوز ${where}.`, state: 'todo' },
        { title: steps[3].title, text: 'مرکز زمان شروع و هزینه را پیش از شروع کار با شما قطعی می‌کند.', state: 'todo' },
      ];

  return (
    <section className="done container">
      <span className="done-mark" aria-hidden="true"><Check focusable="false" strokeWidth={2.5} /></span>
      <h1 className="done-title" ref={heading} tabIndex={-1}>{waitlist ? 'در لیست انتظار ثبت شدید' : 'درخواست شما ثبت شد'}</h1>
      <p className="lead">
        پیامک تأیید و کد پیگیری به <span className="num">{formatMobile(r.mobile)}</span> فرستاده شد.
        {waitlist ? ` هنوز در ${where} مرکز همکار ${r.service.name} نداریم؛ به محض فعال شدن شهر پیامک می‌گیرید و درخواستتان بدون ثبت دوباره بررسی می‌شود.` : null}
      </p>
      {codeBox}
      <h2 className="h-card done-next">بعد چه می‌شود؟</h2>
      <ProcessSteps steps={items} />
      <p className="done-help small">ساعت کاری: <Fact name="hours" />. سؤالی دارید؟ <PhoneLink /></p>
      {home}
    </section>
  );
}
