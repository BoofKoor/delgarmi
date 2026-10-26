'use client';

import { ArrowLeft, CalendarDays, ChevronRight, Clock, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button, Checkbox, ChoiceCards, ChoiceChips, CitySearch, DatePicker, dayLabel, Notice, QuestionGroup, Stepper, TextField } from '@/components/ui';
import { SERVICES, SERVICE_LIST, type ServiceSlug } from '@/content/services';
import type { CityItem } from '@/lib/api';
import { cx } from '@/lib/cx';
import { d2g, tehranToday } from '@/lib/jalali';
import { typingWithKeyboard, watchTyping } from '@/lib/keyboard';
import {
  answersToSend,
  asksStart,
  asksTimeWindow,
  fill,
  isInPerson,
  normalizeMobile,
  showsUrgentWarning,
  type Answer,
  type Answers,
  type ErrorCode,
  type FormDefinition,
} from '@/lib/form';
import { DONE_KEY, submitRequest } from './api';
import { clearDraft, hasAnswers, loadDraft, saveDraft, type FormState, type Start } from './draft';
import { QuestionField } from './QuestionField';
import { Summary } from './Summary';
import { CodeStep, OtpNoticeBox, useOtp } from './Verify';

type Errors = Record<string, string>;

export type RequestFormProps = {
  def: FormDefinition;
  /** From the address: `?service=` (valid slugs only), the option it links with, the city. */
  service: ServiceSlug | null;
  linked: Answers;
  city: CityItem | null;
  /** The line under each service's name (Service.hint in the panel). */
  hints: Partial<Record<ServiceSlug, string>>;
};

const SERVICE_ICON_ORDER = SERVICE_LIST.map((s) => s.slug);

/**
 * The screens in order. Step 3 is two screens, «در کدام شهر؟» and «از کی شروع شود؟» (each only
 * when it asks something), step 4 is the contact screen and the code screen.
 */
function screensFor(def: FormDefinition, state: FormState): string[] {
  const form = state.service ? def.services[state.service] : null;
  const detail = form ? form.screens.map((_, i) => `detail-${i}`) : ['detail-0'];
  const out = ['service', ...detail];
  if (!form || isInPerson(form, state.answers)) out.push('where');
  if (!form || asksStart(form, state.answers) || asksTimeWindow(form, state.answers)) out.push('when');
  out.push('contact', 'code');
  return out;
}

function stepOf(screen: string): number {
  if (screen === 'service') return 1;
  if (screen.startsWith('detail-')) return 2;
  return screen === 'where' || screen === 'when' ? 3 : 4;
}

function isoDate(jdn: number): string {
  const g = d2g(jdn);
  return `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`;
}

function initialState(service: ServiceSlug | null, linked: Answers, city: CityItem | null): FormState {
  return { service, answers: { ...linked }, city, neighbourhood: '', start: null, timeWindow: null, name: '', mobile: '', bestTime: null, consent: false };
}

export function RequestForm({ def, service: linkedService, linked, city: linkedCity, hints }: RequestFormProps) {
  const router = useRouter();
  const first = linkedService ? 'detail-0' : 'service';
  const [state, setState] = useState<FormState>(() => initialState(linkedService, linked, linkedCity));
  const [screen, setScreen] = useState(first);
  const [errors, setErrors] = useState<Errors>({});
  const [resumed, setResumed] = useState(false);
  const [today, setToday] = useState<number | null>(null);
  const [cities, setCities] = useState<CityItem[] | null>(null);
  const [citiesFailed, setCitiesFailed] = useState(false);
  const [switchedOnline, setSwitchedOnline] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ErrorCode | null>(null);
  const [typing, setTyping] = useState(false);
  const otp = useOtp();
  const ready = useRef(false);
  const moved = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const citiesLoading = useRef(false);

  const form = state.service ? def.services[state.service] : null;
  const screens = useMemo(() => screensFor(def, state), [def, state]);
  const inPerson = form ? isInPerson(form, state.answers) : true;
  const startAsked = form ? asksStart(form, state.answers) : false;
  const windowAsked = form ? asksTimeWindow(form, state.answers) : false;
  const waitlisted = Boolean(form && state.service && inPerson && state.city && !state.city.active.includes(state.service));
  const mobile = normalizeMobile(state.mobile);
  const verified = otp.otp.phase === 'verified' && otp.otp.mobile === mobile;

  // After the first paint: today's date in Tehran, and a saved draft if there is one.
  useEffect(() => {
    setToday(tehranToday());
    const draft = loadDraft();
    if (draft && hasAnswers(draft.state)) {
      const sameService = !linkedService || draft.state.service === linkedService;
      if (sameService) {
        const restored: FormState = { ...draft.state, answers: { ...draft.state.answers, ...linked }, city: linkedCity ?? draft.state.city };
        const known = screensFor(def, restored);
        // Drafts from before step 3 was split had one «place» screen; the code check is never kept.
        const saved = draft.screen === 'place' ? known.find((s) => s === 'where' || s === 'when') ?? first : draft.screen === 'code' ? 'contact' : draft.screen;
        setState(restored);
        setScreen(known.includes(saved) ? saved : first);
        setResumed(true);
      }
    }
    ready.current = true;
  }, []);

  // Every change is kept on this device until the request is sent.
  useEffect(() => {
    if (ready.current && hasAnswers(state)) saveDraft(screen, state);
  }, [state, screen]);

  // A new screen: its title gets focus, so screen readers hear the question first.
  useEffect(() => {
    if (!moved.current) return;
    topRef.current?.scrollIntoView({ block: 'start' });
    if (screen !== 'code') titleRef.current?.focus({ preventScroll: true });
  }, [screen]);

  // The bottom bar steps aside while the phone keyboard is up (design system v8 StickyBar), and
  // comes back when the keyboard closes, even if the field keeps its focus (lib/keyboard.ts).
  useEffect(() => watchTyping(() => setTyping(typingWithKeyboard())), []);
  // Once the number is verified the code field turns read-only: «ثبت درخواست» shows again.
  useEffect(() => setTyping(typingWithKeyboard()), [verified]);

  // The city list (about 18 KB) is fetched once, when the city question is near.
  useEffect(() => {
    if (screen !== 'where' || !inPerson || cities || citiesLoading.current) return;
    citiesLoading.current = true;
    setCitiesFailed(false);
    fetch('/api/cities')
      .then((r) => (r.ok ? (r.json() as Promise<CityItem[]>) : Promise.reject(new Error(String(r.status)))))
      .then(setCities)
      .catch(() => { setCitiesFailed(true); citiesLoading.current = false; });
  }, [screen, inPerson, cities, citiesFailed]);

  function update(patch: Partial<FormState>, clear: string[] = []) {
    setState((s) => ({ ...s, ...patch }));
    if (clear.length) setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !clear.includes(k))));
    setSubmitError(null);
  }

  function answer(id: string, value: Answer) {
    setState((s) => ({ ...s, answers: { ...s.answers, [id]: value } }));
    setErrors((e) => { const { [id]: _, ...rest } = e; return rest; });
    if (id === 'session') setSwitchedOnline(false);
  }

  function go(next: string) {
    moved.current = true;
    setErrors({});
    setScreen(next);
  }

  function chooseService(slug: ServiceSlug) {
    // Another service: its own questions start empty (the old answers do not apply).
    setState((s) => (s.service === slug ? s : { ...s, service: slug, answers: {}, timeWindow: null }));
    setErrors({});
  }

  function validate(at: string): Errors {
    const e: Errors = {};
    if (at === 'service') {
      if (!state.service) e.service = def.service.error;
      return e;
    }
    if (!form) return e;
    if (at.startsWith('detail-')) {
      const page = form.screens[Number(at.slice(7))];
      for (const id of page?.questions ?? []) {
        const q = form.questions[id];
        if (q.control === 'counter') continue;
        const a = state.answers[id];
        const empty = a === undefined || (Array.isArray(a) && a.length === 0);
        if (empty) e[id] = q.multiple ? def.choiceErrors.multiple : def.choiceErrors.single;
      }
      return e;
    }
    const p = def.place;
    if (at === 'where') {
      if (inPerson && !state.city) e.city = p.city.error;
      if (inPerson && state.neighbourhood.trim().length > p.neighbourhood.max) e.neighbourhood = p.neighbourhood.tooLong;
      return e;
    }
    if (at === 'when') {
      if (startAsked) {
        if (!state.start) e.start = p.start.error;
        else if (state.start.kind === 'date') {
          const d = state.start.date;
          if (d === null || today === null || d < today || d > today + p.start.maxDays) e.start = p.start.dateError;
        }
      }
      if (windowAsked && !state.timeWindow) e['time-window'] = p.timeWindow.error;
      return e;
    }
    const c = def.contact;
    if (at === 'code') {
      if (otp.otp.phase === 'sent') e.code = c.code.missing;
      return e;
    }
    const name = state.name.trim();
    if (name.length < 2) e.name = c.name.error;
    else if (name.length > c.name.max) e.name = c.name.tooLong;
    if (!mobile) e.mobile = c.mobile.error;
    if (!state.bestTime) e['best-time'] = def.choiceErrors.single;
    if (!state.consent) e.consent = c.consent.error;
    return e;
  }

  /** The first question with an error comes to the top of the screen, and its first control gets the cursor. */
  function focusFirst(e: Errors) {
    const key = Object.keys(e)[0];
    if (!key) return;
    requestAnimationFrame(() => {
      const box = document.querySelector<HTMLElement>(`[data-field="${key}"]`);
      const target = box?.querySelector<HTMLElement>('input:not([type=hidden]):not([disabled]), button:not([disabled])') ?? box;
      box?.scrollIntoView({ block: 'start' });
      target?.focus({ preventScroll: true });
    });
  }

  function fail(e: Errors) {
    setErrors(e);
    focusFirst(e);
  }

  async function submit() {
    if (!form || !state.service || otp.otp.phase !== 'verified') return;
    if (Date.now() > otp.otp.expiresAt) {
      otp.reset();
      setSubmitError('token');
      return;
    }
    const payload = {
      service: state.service,
      answers: answersToSend(form, state.answers),
      city: inPerson ? state.city?.code ?? null : null,
      neighbourhood: inPerson ? state.neighbourhood.trim() : '',
      start: startAsked && state.start ? { kind: state.start.kind, date: state.start.kind === 'date' && state.start.date !== null ? isoDate(state.start.date) : null } : null,
      time_window: windowAsked ? state.timeWindow : null,
      name: state.name.trim(),
      best_time: state.bestTime,
      consent: state.consent,
    };
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitRequest(payload, otp.otp.token);
    if (result.ok) {
      try { window.sessionStorage.setItem(DONE_KEY, JSON.stringify({ code: result.data.code, token: otp.otp.token })); } catch { /* the page then shows the code only */ }
      clearDraft();
      router.push(`/request/done?code=${result.data.code}`);
      return;
    }
    setSubmitting(false);
    if (result.error === 'token') otp.reset();
    setSubmitError(result.error === 'token' || result.error === 'invalid' || result.error === 'network' ? (result.error as ErrorCode) : 'server');
  }

  /** «دریافت کد تأیید»: a code for this number, unless one is already on its way or the number is checked. */
  async function getCode() {
    if (!mobile) return;
    if (verified) { void submit(); return; }
    if (otp.otp.phase === 'sent' && otp.otp.mobile === mobile) { go('code'); return; }
    otp.reset();
    const sent = await otp.send(mobile);
    if (sent === 'sent') go('code');
    else if (sent === 'mobile') fail({ mobile: def.contact.mobile.error });
  }

  function onNext(event: FormEvent) {
    event.preventDefault();
    if (submitting || otp.busy) return;
    const e = validate(screen);
    if (Object.keys(e).length) { fail(e); return; }
    if (screen === 'contact') { void getCode(); return; }
    if (screen === 'code') {
      if (otp.otp.phase === 'verified') void submit();
      else void getCode();
      return;
    }
    go(screens[screens.indexOf(screen) + 1]);
  }

  function onBack() {
    const i = screens.indexOf(screen);
    if (i > 0) go(screens[i - 1]);
  }

  function editNumber() {
    otp.reset();
    setSubmitError(null);
    go('contact');
    requestAnimationFrame(() => document.getElementById('f-mobile')?.focus());
  }

  function startOver() {
    clearDraft();
    otp.reset();
    setState(initialState(null, {}, null));
    setResumed(false);
    go('service');
  }

  function switchToOnline() {
    setState((s) => ({ ...s, answers: { ...s.answers, session: 'online' }, city: null, neighbourhood: '' }));
    setSwitchedOnline(true);
    go('when');
  }

  const step = stepOf(screen);
  const submitLabel = waitlisted ? 'ثبت در لیست انتظار' : 'ثبت درخواست';
  const nextLabel =
    screen === 'contact' ? (verified ? submitLabel : def.contact.mobile.send)
    : screen === 'code' ? (otp.otp.phase === 'idle' ? def.contact.mobile.send : submitLabel)
    : 'مرحله‌ی بعد';
  const withArrow = screen !== 'code' && !(screen === 'contact' && verified);

  return (
    <div className="form-page">
      <div className="container form-grid">
        <section className="form-main" aria-labelledby="request-title">
          <h1 className="vh" id="request-title">ثبت درخواست</h1>
          <div ref={topRef} className="form-top">
            <Stepper step={step} total={4} name={def.steps[step - 1]} />
          </div>
          {resumed ? (
            <Notice title="پاسخ‌های قبلی‌تان سر جایشان است" className="resume" live={false}>
              از همان‌جایی که بودید ادامه دهید.{' '}
              <Button variant="text" className="inline-text-btn" onClick={startOver}>شروع از اول</Button>
            </Notice>
          ) : null}
          <form className="dg-form" noValidate onSubmit={onNext}>
            <div className="screen">{renderScreen()}</div>
            {submitError ? (
              <Notice tone="danger" title={def.errors[submitError].title} className="submit-error">{def.errors[submitError].text}</Notice>
            ) : null}
            <div className={cx('dg-bar dg-bar--form form-nav', typing && 'is-typing')}>
              {screen !== 'service' ? (
                <Button variant="secondary" size="lg" className="back" onClick={onBack}>
                  <ChevronRight aria-hidden="true" focusable="false" strokeWidth={2} />
                  قبلی
                </Button>
              ) : null}
              <Button type="submit" size="lg" className="next" loading={submitting || otp.busy}>
                {nextLabel}
                {withArrow ? <ArrowLeft aria-hidden="true" focusable="false" strokeWidth={2} /> : null}
              </Button>
            </div>
          </form>
        </section>
        <Summary def={def} state={state} today={today} onEdit={go} />
      </div>
    </div>
  );

  function head(title: string, sub?: ReactNode) {
    return (
      <div className="screen-head">
        <h2 className="screen-title" ref={titleRef} tabIndex={-1}>{title}</h2>
        {sub ? <p className="screen-sub">{sub}</p> : null}
      </div>
    );
  }

  function renderScreen() {
    if (screen === 'service') {
      const t = def.service;
      return (
        <>
          {head(t.title, t.sub)}
          <div data-field="service">
            <QuestionGroup legend={t.legend} hideLegend error={errors.service} errorId="service-error">
              <ChoiceCards
                name="service"
                value={state.service}
                onChange={(v) => { chooseService(v as ServiceSlug); setErrors({}); }}
                describedBy={errors.service ? 'service-error' : undefined}
                options={SERVICE_ICON_ORDER.map((slug) => ({ value: slug, title: SERVICES[slug].name, hint: hints[slug] }))}
              />
            </QuestionGroup>
          </div>
        </>
      );
    }
    if (!form || !state.service) return null;
    if (screen.startsWith('detail-')) {
      const page = form.screens[Number(screen.slice(7))];
      const warning = SERVICES[state.service].warning;
      return (
        <>
          {head(page.title, page.sub)}
          <div className="screen-body">
            {page.questions.map((id) => (
              <QuestionField key={`${state.service}-${id}`} id={id} question={form.questions[id]} value={state.answers[id]} error={errors[id]} onChange={(v) => answer(id, v)} />
            ))}
            {warning && page.questions.includes(form.urgentWarning?.q ?? '') && showsUrgentWarning(form, state.answers) ? (
              <Notice tone="warning" title={warning.title} className="svc-warning">
                {warning.text}
                <span className="numbers">
                  {warning.numbers.map((n) => (
                    <a className="dg-btn dg-btn--secondary" key={n.tel} href={`tel:${n.tel}`}>
                      <Phone aria-hidden="true" focusable="false" strokeWidth={1.75} />{n.label}
                    </a>
                  ))}
                </span>
              </Notice>
            ) : null}
          </div>
        </>
      );
    }
    const p = def.place;
    if (screen === 'where') {
      const serviceName = SERVICES[state.service].name;
      return (
        <>
          {head(p.title, p.sub)}
          <div className="screen-body screen-body--fields">
            <div data-field="city" className="place-city">
              <CitySearch
                id="f-city"
                cities={cities ?? []}
                loading={!cities && !citiesFailed}
                unavailable={citiesFailed}
                label={p.city.label}
                help={p.city.help}
                value={state.city}
                onChange={(c) => update({ city: c }, ['city'])}
                error={errors.city ?? (citiesFailed ? p.city.loadError : undefined)}
              />
              {state.city ? (
                waitlisted ? (
                  <Notice tone="warning" icon={Clock} title={fill(p.waitlist.title, { city: state.city.name, service: serviceName })}>
                    {fill(p.waitlist.text, { city: state.city.name })}
                    {form.inPerson ? (
                      <span className="therapy-switch">
                        {p.therapyOnline.text}{' '}
                        <Button variant="text" className="inline-text-btn" onClick={switchToOnline}>{p.therapyOnline.button}</Button>
                      </span>
                    ) : null}
                  </Notice>
                ) : (
                  <Notice tone="success" title={fill(p.active.title, { city: state.city.name })}>{p.active.text}</Notice>
                )
              ) : null}
            </div>
            <div data-field="neighbourhood">
              <TextField
                id="f-neighbourhood"
                label={<>{p.neighbourhood.label} <span className="dg-optional">(اختیاری)</span></>}
                help={p.neighbourhood.help}
                autoComplete="address-level3"
                maxLength={p.neighbourhood.max + 20}
                value={state.neighbourhood}
                error={errors.neighbourhood}
                onChange={(e) => update({ neighbourhood: e.target.value }, ['neighbourhood'])}
              />
            </div>
          </div>
        </>
      );
    }
    if (screen === 'when') {
      // The screen title is the first question itself, so that question's own legend is hidden.
      const title = startAsked ? (inPerson ? p.start.label : p.titleOnline) : p.timeWindow.label;
      return (
        <>
          {head(title, !inPerson ? p.subOnline : undefined)}
          <div className="screen-body">
            {switchedOnline ? <Notice tone="success" title={p.therapyOnline.done} /> : null}
            {startAsked ? <StartField def={def} today={today} value={state.start} error={errors.start} onChange={(v) => update({ start: v }, ['start'])} /> : null}
            {windowAsked ? (
              <div data-field="time-window">
                <QuestionGroup legend={p.timeWindow.label} hideLegend={!startAsked} why={p.timeWindow.why} error={errors['time-window']} errorId="time-window-error">
                  <ChoiceChips
                    name="time-window"
                    value={state.timeWindow}
                    onChange={(v) => update({ timeWindow: v as string }, ['time-window'])}
                    describedBy={errors['time-window'] ? 'time-window-error' : undefined}
                    options={p.timeWindow.options.map((o) => ({ value: o.value, label: o.label }))}
                  />
                </QuestionGroup>
              </div>
            ) : null}
          </div>
        </>
      );
    }
    const c = def.contact;
    if (screen === 'code') {
      return (
        <>
          {head(c.code.title)}
          <CodeStep
            def={def}
            otp={otp}
            error={errors.code}
            onTyped={() => setErrors((e) => { const { code: _, ...rest } = e; return rest; })}
            onEditNumber={editNumber}
          />
        </>
      );
    }
    return (
      <>
        {head(c.title, c.sub)}
        <div className="screen-body screen-body--fields">
          <div data-field="name">
            <TextField
              id="f-name"
              label={c.name.label}
              autoComplete="name"
              enterKeyHint="next"
              maxLength={c.name.max + 20}
              value={state.name}
              error={errors.name}
              onChange={(e) => update({ name: e.target.value }, ['name'])}
            />
          </div>
          <div data-field="mobile">
            <TextField
              id="f-mobile"
              label={c.mobile.label}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              enterKeyHint="next"
              ltr
              help={c.mobile.help}
              error={errors.mobile}
              value={state.mobile}
              onChange={(e) => update({ mobile: e.target.value }, ['mobile'])}
            />
          </div>
          <div data-field="best-time">
            <QuestionGroup legend={c.bestTime.label} error={errors['best-time']} errorId="best-time-error">
              <ChoiceChips
                name="best-time"
                value={state.bestTime}
                onChange={(v) => update({ bestTime: v as string }, ['best-time'])}
                describedBy={errors['best-time'] ? 'best-time-error' : undefined}
                options={c.bestTime.options.map((o) => ({ value: o.value, label: o.label }))}
              />
            </QuestionGroup>
          </div>
          <div data-field="consent" className={cx('dg-group', errors.consent && 'dg-group--error')}>
            {errors.consent ? <p className="dg-error" id="consent-error">{errors.consent}</p> : null}
            <Checkbox
              id="f-consent"
              checked={state.consent}
              aria-describedby={errors.consent ? 'consent-error' : undefined}
              aria-invalid={errors.consent ? true : undefined}
              onChange={(e) => update({ consent: e.target.checked }, ['consent'])}
            >
              {c.consent.text} <a href="/privacy" target="_blank" rel="noopener">{c.consent.link}</a>
            </Checkbox>
          </div>
          <OtpNoticeBox def={def} otp={otp} />
        </div>
      </>
    );
  }
}

/** «از کی شروع شود؟»: as soon as possible, tomorrow, or a day from the calendar. The screen title asks it. */
function StartField({ def, today, value, error, onChange }: { def: FormDefinition; today: number | null; value: Start; error?: string; onChange: (value: Start) => void }) {
  const t = def.place.start;
  const kind = value?.kind ?? null;
  return (
    <div data-field="start">
      <QuestionGroup legend={t.label} hideLegend error={error} errorId="start-error">
        <ChoiceChips
          name="start"
          value={kind}
          onChange={(v) => onChange({ kind: v as 'asap' | 'tomorrow' | 'date', date: v === 'date' ? (value?.date ?? null) : null })}
          describedBy={error ? 'start-error' : undefined}
          options={[
            { value: 'asap', label: t.asap },
            { value: 'tomorrow', label: today !== null ? fill(t.tomorrow, { day: dayLabel(today + 1) }) : 'فردا' },
            { value: 'date', label: t.date, icon: CalendarDays },
          ]}
        />
        {kind === 'date' && today !== null ? (
          <div className="start-cal">
            <DatePicker today={today} maxDays={t.maxDays} value={value?.date ?? null} onChange={(d) => onChange({ kind: 'date', date: d })} />
            <p className="start-picked" aria-live="polite">{value?.date != null ? fill(t.picked, { day: dayLabel(value.date) }) : null}</p>
          </div>
        ) : null}
      </QuestionGroup>
    </div>
  );
}
