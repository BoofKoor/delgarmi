import type { ServiceSlug } from '@/content/services';
import { fa, latin } from './digits';

/**
 * The request form as the API serves it (GET /api/form, from api/catalog/form.json). The API
 * checks every answer against the same file, so the site and the server never disagree.
 */

export type Option = { value: string; label: string; hint?: string };
export type Condition = { q: string; in: string[] };
export type Question = {
  label: string;
  control: 'chips' | 'cards' | 'counter';
  multiple?: boolean;
  hideLegend?: boolean;
  /** The row label in the summary next to the form. */
  summary: string;
  why?: string;
  /** Address parameter a service page uses to pre-select this question (`?type=night`). */
  param?: string;
  options?: Option[];
  min?: number;
  max?: number;
  default?: number;
};
export type Screen = { title: string; sub?: string; questions: string[] };
export type ServiceForm = {
  screens: Screen[];
  questions: Record<string, Question>;
  /** Absent: always in person. */
  inPerson?: Condition;
  /** Absent: the start is always asked. */
  start?: Condition;
  /** Absent: the time window is not asked; `true`: always asked. */
  timeWindow?: Condition | true;
  urgentWarning?: Condition;
};
type Text = { title: string; text: string };
export type ErrorCode = 'wrong' | 'expired' | 'voided' | 'wait' | 'too-many' | 'too-many-ip' | 'sms-failed' | 'token' | 'invalid' | 'network' | 'server';

export type FormDefinition = {
  version: number;
  steps: string[];
  choiceErrors: { single: string; multiple: string };
  service: { title: string; sub: string; legend: string; error: string };
  services: Record<ServiceSlug, ServiceForm>;
  place: {
    /** The «where» screen; the «when» screen is titled by its first question. */
    title: string;
    titleOnline: string;
    sub: string;
    subOnline: string;
    city: { label: string; help: string; error: string; loadError: string };
    neighbourhood: { label: string; help: string; max: number; tooLong: string };
    start: { label: string; asap: string; tomorrow: string; date: string; picked: string; error: string; dateError: string; maxDays: number };
    timeWindow: { label: string; why: string; error: string; options: Option[] };
    active: Text;
    waitlist: Text;
    therapyOnline: { text: string; button: string; done: string };
  };
  contact: {
    title: string;
    sub: string;
    name: { label: string; error: string; max: number; tooLong: string };
    mobile: { label: string; help: string; error: string; send: string };
    code: { title: string; label: string; sentTo: string; resendIn: string; resend: string; edit: string; verified: string; missing: string };
    bestTime: { label: string; options: Option[] };
    consent: { text: string; link: string; error: string; version: string };
  };
  errors: Record<ErrorCode, Text>;
};

export type Answer = string | string[] | number;
export type Answers = Record<string, Answer>;

function holds(condition: Condition | true | undefined, answers: Answers, absent: boolean): boolean {
  if (condition === undefined) return absent;
  if (condition === true) return true;
  const answer = answers[condition.q];
  return typeof answer === 'string' && condition.in.includes(answer);
}

export const isInPerson = (form: ServiceForm, answers: Answers) => holds(form.inPerson, answers, true);
export const asksStart = (form: ServiceForm, answers: Answers) => holds(form.start, answers, true);
export const asksTimeWindow = (form: ServiceForm, answers: Answers) => holds(form.timeWindow, answers, false);
export const showsUrgentWarning = (form: ServiceForm, answers: Answers) => holds(form.urgentWarning, answers, false);

/** Fills `{name}` slots in a text from the form definition. */
export function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (slot, key: string) => values[key] ?? slot);
}

/**
 * A mobile number typed any way people type it (Persian digits, +98, 0098, without the leading
 * zero) → 09xxxxxxxxx, or null if it cannot be one. Same rules as the API.
 */
export function normalizeMobile(raw: string): string | null {
  let s = latin(raw).replace(/[^\d+]/g, '');
  if (s.startsWith('+98')) s = `0${s.slice(3)}`;
  else if (s.startsWith('0098')) s = `0${s.slice(4)}`;
  else if (s.length === 12 && s.startsWith('98')) s = `0${s.slice(2)}`;
  else if (s.length === 10 && s.startsWith('9')) s = `0${s}`;
  return /^09\d{9}$/.test(s) ? s : null;
}

/** 09123456789 → «۰۹۱۲ ۳۴۵ ۶۷۸۹» */
export function formatMobile(mobile: string): string {
  return fa(`${mobile.slice(0, 4)} ${mobile.slice(4, 7)} ${mobile.slice(7)}`);
}

/** Seconds → «۱:۵۹» (minutes and seconds, Persian digits). */
export function formatSeconds(total: number): string {
  const s = Math.max(0, Math.ceil(total));
  return fa(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
}

/** An answer as words, for the summary: the option labels, or the count. */
export function answerText(question: Question, answer: Answer | undefined): string | null {
  if (answer === undefined) return null;
  if (question.control === 'counter') return fa(Number(answer));
  const label = (v: string) => question.options?.find((o) => o.value === v)?.label;
  const values = Array.isArray(answer) ? answer : [String(answer)];
  const labels = values.map(label).filter((l): l is string => Boolean(l));
  return labels.length ? labels.join('، ') : null;
}

/** The value a service page's link pre-selects (`?type=night`), if it is a real option. */
export function linkedAnswers(form: ServiceForm, params: Record<string, string | undefined>): Answers {
  const answers: Answers = {};
  for (const [id, q] of Object.entries(form.questions)) {
    const value = q.param ? params[q.param] : undefined;
    if (!value || !q.options?.some((o) => o.value === value)) continue;
    answers[id] = q.multiple ? [value] : value;
  }
  return answers;
}

/** The answers the server should get: only questions of this service, counters with their default. */
export function answersToSend(form: ServiceForm, answers: Answers): Answers {
  const out: Answers = {};
  for (const [id, q] of Object.entries(form.questions)) {
    const a = answers[id];
    if (q.control === 'counter') out[id] = typeof a === 'number' ? a : (q.default ?? q.min ?? 1);
    else if (a !== undefined) out[id] = a;
  }
  return out;
}
