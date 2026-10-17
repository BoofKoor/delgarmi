'use client';

import { ChevronRight, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Button, Checkbox, ChoiceCards, ChoiceChips, CitySearch, DatePicker, dayLabel, Notice, QuestionGroup, Stepper, TextField } from '@/components/ui';
import { SERVICES, SERVICE_LIST, type ServiceSlug } from '@/content/services';
import type { CityItem } from '@/lib/api';
import { d2g, tehranToday } from '@/lib/jalali';
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
import { MobileVerify, useOtp } from './Verify';

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

function screensFor(def: FormDefinition, service: ServiceSlug | null): string[] {
  const detail = service ? def.services[service].screens.map((_, i) => `detail-${i}`) : ['detail-0'];
  return ['service', ...detail, 'place', 'contact'];
}

function stepOf(screen: string): number {
  if (screen === 'service') return 1;
  if (screen.startsWith('detail-')) return 2;
  return screen === 'place' ? 3 : 4;
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
  const otp = useOtp();
  const ready = useRef(false);
  const moved = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const citiesLoading = useRef(false);

  const form = state.service ? def.services[state.service] : null;
  const screens = useMemo(() => screensFor(def, state.service), [def, state.service]);
  const inPerson = form ? isInPerson(form, state.answers) : true;
  const startAsked = form ? asksStart(form, state.answers) : false;
  const windowAsked = form ? asksTimeWindow(form, state.answers) : false;
  const waitlisted = Boolean(form && state.service && inPerson && state.city && !state.city.active.includes(state.service));

  // After the first paint: today's date in Tehran, and a saved draft if there is one.
  useEffect(() => {
    setToday(tehranToday());
    const draft = loadDraft();
    if (draft && hasAnswers(draft.state)) {
      const sameService = !linkedService || draft.state.service === linkedService;
      if (sameService) {
        const restored: FormState = { ...draft.state, answers: { ...draft.state.answers, ...linked }, city: linkedCity ?? draft.state.city };
        const known = screensFor(def, restored.service);
        setState(restored);
        setScreen(known.includes(draft.screen) ? draft.screen : first);
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
    titleRef.current?.focus({ preventScroll: true });
  }, [screen]);

  // The city list (about 18 KB) is fetched once, when the city question is near.
  useEffect(() => {
    if (screen !== 'place' || !inPerson || cities || citiesLoading.current) return;
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
    if (at === 'place') {
      const p = def.place;
      if (inPerson && !state.city) e.city = p.city.error;
      if (inPerson && state.neighbourhood.trim().length > p.neighbourhood.max) e.neighbourhood = p.neighbourhood.tooLong;
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
    const name = state.name.trim();
    if (name.length < 2) e.name = c.name.error;
    else if (name.length > c.name.max) e.name = c.name.tooLong;
    const mobile = normalizeMobile(state.mobile);
    if (otp.otp.phase === 'verified') {
      // fine
    } else if (!mobile) e.mobile = c.mobile.error;
    else if (otp.otp.phase === 'sent') e.code = c.code.missing;
    else e.mobile = c.code.notVerified;
    if (!state.bestTime) e['best-time'] = def.choiceErrors.single;
    if (!state.consent) e.consent = c.consent.error;
    return e;
  }

  function focusFirst(e: Errors) {
    const key = Object.keys(e)[0];
    if (!key) return;
    requestAnimationFrame(() => {
      const box = document.querySelector<HTMLElement>(`[data-field="${key}"]`);
      const target = box?.querySelector<HTMLElement>('input:not([type=hidden]):not([disabled]), button:not([disabled])') ?? box;
      box?.scrollIntoView({ block: 'center' });
      target?.focus({ preventScroll: true });
    });
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
      try { window.sessionStorage.setItem(DONE_KEY, JSON.stringify({ code: result.data.code, token: otp.otp.token })); } catch { /* the page then asks to use tracking */ }
      clearDraft();
      router.push(`/request/done?code=${result.data.code}`);
      return;
    }
    setSubmitting(false);
    if (result.error === 'token') otp.reset();
    setSubmitError(result.error === 'token' || result.error === 'invalid' || result.error === 'network' ? (result.error as ErrorCode) : 'server');
  }

  function onNext(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const e = validate(screen);
    if (Object.keys(e).length) {
      setErrors(e);
      focusFirst(e);
      return;
    }
    if (screen === 'contact') { void submit(); return; }
    go(screens[screens.indexOf(screen) + 1]);
  }

  function onBack() {
    const i = screens.indexOf(screen);
    if (i > 0) go(screens[i - 1]);
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
    setErrors({});
    setSwitchedOnline(true);
  }

  const step = stepOf(screen);
  const isLast = screen === 'contact';
  const nextLabel = isLast ? (waitlisted ? 'ثبت در لیست انتظار' : 'ثبت درخواست') : 'مرحله‌ی بعد';

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
              <button type="button" className="link-btn" onClick={startOver}>شروع از اول</button>
            </Notice>
          ) : null}
          <form className="dg-form" noValidate onSubmit={onNext}>
            <div className="screen">{renderScreen()}</div>
            {submitError ? (
              <Notice tone="danger" title={def.errors[submitError].title} className="submit-error">{def.errors[submitError].text}</Notice>
            ) : null}
            <div className="form-nav">
              {screen !== 'service' ? (
                <Button variant="secondary" size="lg" className="back" onClick={onBack}>
                  <ChevronRight aria-hidden="true" focusable="false" strokeWidth={1.75} />
                  مرحله‌ی قبل
                </Button>
              ) : null}
              <Button type="submit" size="lg" className="next" loading={submitting}>{nextLabel}</Button>
            </div>
          </form>
        </section>
        <Summary def={def} state={state} today={today} onEdit={go} />
      </div>
    </div>
  );

  function head(title: string, sub?: string) {
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
                      <Phone className="ic" aria-hidden="true" focusable="false" strokeWidth={1.75} />{n.label}
                    </a>
                  ))}
                </span>
              </Notice>
            ) : null}
          </div>
        </>
      );
    }
    if (screen === 'place') {
      const p = def.place;
      const serviceName = SERVICES[state.service].name;
      return (
        <>
          {head(inPerson ? p.title : p.titleOnline, inPerson ? p.sub : p.subOnline)}
          <div className="screen-body">
            {switchedOnline ? <Notice tone="success" title={p.therapyOnline.done} /> : null}
            {inPerson ? (
              <div data-field="city" className="place-city">
                <CitySearch
                  id="f-city"
                  cities={cities ?? []}
                  loading={!cities && !citiesFailed}
                  unavailable={citiesFailed}
                  label={p.city.label}
                  placeholder={p.city.placeholder}
                  help={p.city.help}
                  value={state.city}
                  onChange={(c) => update({ city: c }, ['city'])}
                  error={errors.city ?? (citiesFailed ? p.city.loadError : undefined)}
                />
                {state.city ? (
                  waitlisted ? (
                    <Notice title={fill(p.waitlist.title, { city: state.city.name, service: serviceName })}>
                      {fill(p.waitlist.text, { city: state.city.name })}
                      {form.inPerson ? (
                        <span className="therapy-switch">
                          {p.therapyOnline.text}{' '}
                          <button type="button" className="link-btn" onClick={switchToOnline}>{p.therapyOnline.button}</button>
                        </span>
                      ) : null}
                    </Notice>
                  ) : (
                    <Notice tone="success" title={fill(p.active.title, { city: state.city.name })}>{p.active.text}</Notice>
                  )
                ) : null}
              </div>
            ) : null}
            {inPerson ? (
              <div data-field="neighbourhood">
                <TextField
                  id="f-neighbourhood"
                  label={<>{p.neighbourhood.label} <span className="dg-optional">(اختیاری)</span></>}
                  placeholder={p.neighbourhood.placeholder}
                  help={p.neighbourhood.help}
                  autoComplete="address-level3"
                  maxLength={p.neighbourhood.max + 20}
                  value={state.neighbourhood}
                  error={errors.neighbourhood}
                  onChange={(e) => update({ neighbourhood: e.target.value }, ['neighbourhood'])}
                />
              </div>
            ) : null}
            {startAsked ? <StartField def={def} today={today} value={state.start} error={errors.start} onChange={(v) => update({ start: v }, ['start'])} /> : null}
            {windowAsked ? (
              <div data-field="time-window">
                <QuestionGroup legend={p.timeWindow.label} why={p.timeWindow.why} error={errors['time-window']} errorId="time-window-error">
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
    return (
      <>
        {head(c.title, c.sub)}
        <div className="screen-body">
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
          <MobileVerify
            def={def}
            otp={otp}
            mobile={state.mobile}
            onMobile={(v) => update({ mobile: v }, ['mobile', 'code'])}
            mobileError={errors.mobile}
            codeError={errors.code}
            onCodeTyped={() => setErrors((e) => { const { code: _, ...rest } = e; return rest; })}
          />
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
          <div data-field="consent" className={errors.consent ? 'consent consent--error' : 'consent'}>
            <Checkbox
              id="f-consent"
              checked={state.consent}
              aria-describedby={errors.consent ? 'consent-error' : undefined}
              aria-invalid={errors.consent ? true : undefined}
              onChange={(e) => update({ consent: e.target.checked }, ['consent'])}
            >
              {c.consent.text} <a href="/privacy" target="_blank" rel="noopener">{c.consent.link}</a>
            </Checkbox>
            {errors.consent ? <p className="dg-error" id="consent-error">{errors.consent}</p> : null}
          </div>
        </div>
      </>
    );
  }
}

/** «از کی شروع شود؟»: as soon as possible, tomorrow, or a day from the calendar. */
function StartField({ def, today, value, error, onChange }: { def: FormDefinition; today: number | null; value: Start; error?: string; onChange: (value: Start) => void }) {
  const t = def.place.start;
  const kind = value?.kind ?? null;
  return (
    <div data-field="start">
      <QuestionGroup legend={t.label} error={error} errorId="start-error">
        <ChoiceChips
          name="start"
          value={kind}
          onChange={(v) => onChange({ kind: v as 'asap' | 'tomorrow' | 'date', date: v === 'date' ? (value?.date ?? null) : null })}
          describedBy={error ? 'start-error' : undefined}
          options={[
            { value: 'asap', label: t.asap },
            { value: 'tomorrow', label: today !== null ? fill(t.tomorrow, { day: dayLabel(today + 1) }) : 'فردا' },
            { value: 'date', label: t.date },
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
