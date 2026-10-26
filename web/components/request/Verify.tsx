'use client';

import { CircleCheck, Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button, Notice, TextField } from '@/components/ui';
import { latin } from '@/lib/digits';
import { fill, formatMobile, formatSeconds, type ErrorCode, type FormDefinition } from '@/lib/form';
import { sendCode, verifyCode } from './api';

export type OtpState =
  | { phase: 'idle' }
  | { phase: 'sent'; mobile: string; resendAt: number }
  | { phase: 'verified'; mobile: string; token: string; expiresAt: number };

export type OtpNotice = { code: ErrorCode; retryAt?: number };

const NOTICE_CODES: readonly string[] = ['wrong', 'expired', 'voided', 'wait', 'too-many', 'too-many-ip', 'sms-failed', 'network'];
/** These are about the code itself, so they show under the code field instead of in a notice. */
const CODE_ERRORS: readonly string[] = ['wrong', 'expired', 'voided'];

/** What sending a code ended in: sent, the number itself was refused, or a notice to show. */
export type SendResult = 'sent' | 'mobile' | 'notice';

/** The number check: send a code, take it back, keep the short-lived token for the submit. */
export function useOtp() {
  const [otp, setOtp] = useState<OtpState>({ phase: 'idle' });
  const [notice, setNotice] = useState<OtpNotice | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // The countdowns (resend, retry after a limit) tick once a second while one is running.
  const ticking = otp.phase === 'sent' || Boolean(notice?.retryAt);
  useEffect(() => {
    if (!ticking) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [ticking]);

  function fail(error: string, retryAfter?: unknown) {
    const code = (NOTICE_CODES.includes(error) ? error : 'server') as ErrorCode;
    const retryAt = typeof retryAfter === 'number' ? Date.now() + retryAfter * 1000 : undefined;
    setNotice({ code, retryAt });
  }

  async function send(mobile: string): Promise<SendResult> {
    setBusy(true);
    setNotice(null);
    const result = await sendCode(mobile);
    setBusy(false);
    setNow(Date.now());
    if (result.ok) {
      setOtp({ phase: 'sent', mobile: result.data.mobile, resendAt: Date.now() + result.data.resend_after * 1000 });
      return 'sent';
    }
    if (result.error === 'mobile') return 'mobile';
    fail(result.error, result.body.retry_after);
    return 'notice';
  }

  async function verify(code: string): Promise<boolean> {
    if (otp.phase !== 'sent') return false;
    setBusy(true);
    setNotice(null);
    const result = await verifyCode(otp.mobile, code);
    setBusy(false);
    if (result.ok) {
      setOtp({ phase: 'verified', mobile: otp.mobile, token: result.data.token, expiresAt: Date.now() + result.data.expires_in * 1000 });
      return true;
    }
    fail(result.error);
    return false;
  }

  function reset() {
    setOtp({ phase: 'idle' });
    setNotice(null);
  }

  return { otp, notice, busy, now, send, verify, reset, setNotice };
}

export type Otp = ReturnType<typeof useOtp>;

/** A notice the number check raised (limits, the SMS that did not go): not the code field's own errors. */
export function OtpNoticeBox({ def, otp }: { def: FormDefinition; otp: Otp }) {
  const notice = otp.notice;
  if (!notice || CODE_ERRORS.includes(notice.code)) return null;
  const retryLeft = notice.retryAt ? (notice.retryAt - otp.now) / 1000 : 0;
  const text = def.errors[notice.code].text;
  return (
    <Notice tone="danger" title={def.errors[notice.code].title}>
      {notice.retryAt
        ? (() => {
            const [before, after] = text.split('{time}');
            return <>{before}<span className="num">{formatSeconds(retryLeft)}</span>{after}</>;
          })()
        : text}
    </Notice>
  );
}

/**
 * The code screen (design system v8 OtpField): the number it went to with «ویرایش شماره»,
 * one field for the five digits, which is checked by itself on the fifth digit, then the
 * resend countdown or «شماره تأیید شد».
 */
export function CodeStep({
  def,
  otp,
  error,
  onTyped,
  onEditNumber,
}: {
  def: FormDefinition;
  otp: Otp;
  /** «enter the code» when «ثبت درخواست» is pressed too early. */
  error?: string;
  /** Clears that error once the visitor types. */
  onTyped: () => void;
  onEditNumber: () => void;
}) {
  const t = def.contact.code;
  const [code, setCode] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const state = otp.otp;
  const resendLeft = state.phase === 'sent' ? (state.resendAt - otp.now) / 1000 : 0;

  // A new code: start empty and put the cursor in the field, so the phone can offer the SMS code.
  useEffect(() => {
    if (state.phase === 'sent') {
      setCode('');
      input.current?.focus();
    }
  }, [state.phase === 'sent' ? state.resendAt : 0]);

  async function onCode(value: string) {
    const digits = latin(value).replace(/\D/g, '').slice(0, 5);
    setCode(digits);
    onTyped();
    if (otp.notice && CODE_ERRORS.includes(otp.notice.code)) otp.setNotice(null);
    if (digits.length === 5 && !otp.busy && state.phase === 'sent') {
      const ok = await otp.verify(digits);
      if (!ok) { setCode(''); input.current?.focus(); }
    }
  }

  const codeError = otp.notice && CODE_ERRORS.includes(otp.notice.code) ? `${def.errors[otp.notice.code].title}. ${def.errors[otp.notice.code].text}` : error;
  const mobile = state.phase === 'idle' ? null : state.mobile;
  const [before, after] = t.sentTo.split('{mobile}');

  return (
    <>
      {mobile ? (
        <p className="screen-sub" id="code-sent">
          {before}<span className="num sent-to">{formatMobile(mobile)}</span>{after}
        </p>
      ) : null}
      <Button variant="text" className="edit-number" onClick={onEditNumber}>
        <Pencil aria-hidden="true" focusable="false" strokeWidth={1.75} />
        {t.edit}
      </Button>
      <div className="screen-body code-body">
        <div data-field="code">
          <TextField
            id="f-code"
            label={t.label}
            inputMode="numeric"
            autoComplete="one-time-code"
            enterKeyHint="done"
            inputClassName="dg-otp"
            maxLength={5}
            value={code}
            readOnly={state.phase === 'verified'}
            error={codeError}
            describedBy={mobile ? 'code-sent code-status' : 'code-status'}
            onChange={(e) => void onCode(e.target.value)}
            inputRef={input}
          />
          <div id="code-status" className="code-status">
            {state.phase === 'verified' ? (
              <p className="dg-ok" role="status"><CircleCheck aria-hidden="true" focusable="false" strokeWidth={2} />{t.verified}</p>
            ) : state.phase === 'sent' ? (
              resendLeft > 0 ? (
                <p className="code-wait">{fill(t.resendIn, { time: '' })}<span className="num">{formatSeconds(resendLeft)}</span></p>
              ) : (
                <Button variant="text" disabled={otp.busy} onClick={() => void otp.send(state.mobile)}>{t.resend}</Button>
              )
            ) : null}
          </div>
        </div>
        <OtpNoticeBox def={def} otp={otp} />
      </div>
    </>
  );
}
