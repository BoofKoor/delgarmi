import type { ServiceSlug } from '@/content/services';
import type { CityItem } from '@/lib/api';
import type { Answers } from '@/lib/form';

/**
 * Unfinished answers live only on this device (privacy page and product doc), so a visitor who
 * closes the page continues where they were. Never the code check or its token. Every storage
 * call is wrapped: private windows and blocked storage simply mean no draft.
 */

export type Start = { kind: 'asap' | 'tomorrow' | 'date'; date: number | null } | null;

export type FormState = {
  service: ServiceSlug | null;
  answers: Answers;
  city: CityItem | null;
  neighbourhood: string;
  start: Start;
  timeWindow: string | null;
  name: string;
  mobile: string;
  bestTime: string | null;
  consent: boolean;
};

export type Draft = { v: 1; savedAt: number; screen: string; state: FormState };

const KEY = 'delgarmi-request-draft';
const MAX_AGE = 7 * 24 * 3600 * 1000;

export function loadDraft(now = Date.now()): Draft | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    if (draft?.v !== 1 || typeof draft.savedAt !== 'number' || now - draft.savedAt > MAX_AGE || !draft.state) return null;
    return draft;
  } catch {
    return null;
  }
}

export function saveDraft(screen: string, state: FormState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ v: 1, savedAt: Date.now(), screen, state } satisfies Draft));
  } catch {
    // No storage: the form still works, it just cannot resume.
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

/** True when the visitor has answered anything worth keeping. */
export function hasAnswers(state: FormState): boolean {
  return Boolean(Object.keys(state.answers).length || state.city || state.start || state.timeWindow || state.name || state.mobile || state.bestTime || state.consent);
}
