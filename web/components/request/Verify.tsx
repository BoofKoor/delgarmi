'use client';

import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button, Notice, TextField } from '@/components/ui';
import { latin } from '@/lib/digits';
import { fill, formatMobile, formatSeconds, normalizeMobile, type ErrorCode, type FormDefinition } from '@/lib/form';
import { sendCode, verifyCode } from './api';

export type OtpState =
  | { phase: 'idle' }
  | { phase: 'sent'; mobile: string; resendAt: number }
  | { phase: 'verified'; mobile: string; token: string; expiresAt: number };

export type OtpNotice = { code: ErrorCode; retryAt?: number };

const NOTICE_CODES: readonly string[] = ['wrong', 'expired', 'voided', 'wait', 'too-many', 'too-many-ip', 'sms-failed', 'network'];

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

  /** Returns false when the number itself is wrong (the field shows that). */
  async function send(mobile: string): Promise<boolean> {
    setBusy(true);
    setNotice(null);
    const result = await sendCode(mobile);
    setBusy(false);
    setNow(Date.now());
    if (result.ok) {
      setOtp({ phase: 'sent', mobile: result.data.mobile, resendAt: Date.now() + result.data.resend_after * 1000 });
      return true;
    }
    if (result.error === 'mobile') return false;
    fail(result.error, result.body.retry_after);
    return true;
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

/** Mobile number, «ارسال کد», the code box and its states. */
export function MobileVerify({
  def,
  otp,
  mobile,
  onMobile,
  mobileError,
  codeError,
  onCodeTyped,
}: {
  def: FormDefinition;
  otp: Otp;
  mobile: string;
  onMobile: (value: string) => void;
  mobileError?: string;
  codeError?: string;
  /** Clears the «enter the code» error once the visitor types. */
  onCodeTyped: () => void;
}) {
  const t = def.contact;
  const [code, setCode] = useState('');
  const [badNumber, setBadNumber] = useState(false);
  const codeInput = useRef<HTMLInputElement>(null);
  const state = otp.otp;

  // New code box: start empty and put the cursor in it.
  useEffect(() => {
    if (state.phase === 'sent') {
      setCode('');
      codeInput.current?.focus();
    }
  }, [state.phase === 'sent' ? state.resendAt : 0]);

  async function send() {
    const normalized = normalizeMobile(mobile);
    if (!normalized) { setBadNumber(true); return; }
    setBadNumber(false);
    const ok = await otp.send(normalized);
    if (!ok) setBadNumber(true);
  }

  async function onCode(value: string) {
    const digits = latin(value).replace(/\D/g, '').slice(0, 5);
    setCode(digits);
    onCodeTyped();
    if (digits.length === 5 && !otp.busy) {
      const ok = await otp.verify(digits);
      if (!ok) { setCode(''); codeInput.current?.focus(); }
    }
  }

  const notice = otp.notice;
  const retryLeft = notice?.retryAt ? (notice.retryAt - otp.now) / 1000 : 0;
  const resendLeft = state.phase === 'sent' ? (state.resendAt - otp.now) / 1000 : 0;

  return (
    <div className="otp">
      <div className={state.phase === 'idle' ? 'otp-row otp-row--send' : 'otp-row'} data-field="mobile">
        <TextField
          id="f-mobile"
          label={t.mobile.label}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          enterKeyHint="send"
          ltr
          placeholder={t.mobile.placeholder}
          help={t.mobile.help}
          error={badNumber ? t.mobile.error : mobileError}
          value={state.phase === 'idle' ? mobile : formatMobile(state.mobile)}
          readOnly={state.phase !== 'idle'}
          onChange={(e) => { setBadNumber(false); onMobile(e.target.value); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && state.phase === 'idle') { e.preventDefault(); void send(); } }}
        />
        {state.phase === 'idle' ? (
          <Button variant="secondary" className="otp-send" loading={otp.busy} onClick={() => void send()}>{t.mobile.send}</Button>
        ) : null}
      </div>

      {state.phase === 'sent' ? (
        <div className="otp-code" data-field="code">
          <TextField
            id="f-code"
            label={t.code.label}
            inputMode="numeric"
            autoComplete="one-time-code"
            enterKeyHint="done"
            ltr
            maxLength={5}
            value={code}
            error={codeError}
            onChange={(e) => void onCode(e.target.value)}
            inputRef={codeInput}
          />
          <p className="otp-meta">
            <span>
              {(() => {
                // Isolated: inside Persian text the groups of a bare number would show in reverse.
                const [before, after] = t.code.sentTo.split('{mobile}');
                return <>{before}<span className="num">{formatMobile(state.mobile)}</span>{after}</>;
              })()}
            </span>
            {resendLeft > 0 ? (
              <span>{fill(t.code.resendIn, { time: '' })}<span className="num">{formatSeconds(resendLeft)}</span></span>
            ) : (
              <button type="button" className="link-btn" disabled={otp.busy} onClick={() => void otp.send(state.mobile)}>{t.code.resend}</button>
            )}
            <button type="button" className="link-btn" onClick={otp.reset}>{t.code.edit}</button>
          </p>
        </div>
      ) : null}

      {state.phase === 'verified' ? (
        <p className="otp-ok" role="status">
          <Check aria-hidden="true" focusable="false" strokeWidth={1.75} />
          <span>{t.code.verified}</span>
          <button type="button" className="link-btn" onClick={otp.reset}>{t.code.editVerified}</button>
        </p>
      ) : null}

      {notice ? (
        <Notice tone="danger" title={def.errors[notice.code].title}>
          {notice.retryAt
            ? (() => {
                const [before, after] = def.errors[notice.code].text.split('{time}');
                return <>{before}<span className="num">{formatSeconds(retryLeft)}</span>{after}</>;
              })()
            : def.errors[notice.code].text}
        </Notice>
      ) : null}
    </div>
  );
}
