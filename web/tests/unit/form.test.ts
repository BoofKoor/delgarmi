import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SERVICE_LIST, SERVICE_SLUGS } from '@/content/services';
import { answersToSend, asksStart, asksTimeWindow, formatMobile, isInPerson, linkedAnswers, normalizeMobile, type FormDefinition } from '@/lib/form';

// The form definition the API serves and checks answers against (GET /api/form).
const def: FormDefinition = JSON.parse(readFileSync(new URL('../../../api/catalog/form.json', import.meta.url), 'utf8'));

describe('request form definition', () => {
  it('has the four services, each with questions on its screens', () => {
    expect(Object.keys(def.services).sort()).toEqual([...SERVICE_SLUGS].sort());
    for (const slug of SERVICE_SLUGS) {
      const form = def.services[slug];
      const onScreens = form.screens.flatMap((s) => s.questions);
      expect(onScreens.sort(), slug).toEqual(Object.keys(form.questions).sort());
    }
  });

  it('pre-selects a real option for every option link on the service pages', () => {
    for (const s of SERVICE_LIST) {
      for (const c of s.choices.items) {
        const query = new URLSearchParams(c.href.split('?')[1]);
        const params = Object.fromEntries(query.entries());
        const linked = linkedAnswers(def.services[s.slug], params);
        expect(Object.keys(linked).length, `${s.slug}: ${c.href}`).toBe(1);
      }
    }
  });

  it('ignores options that are not on the form', () => {
    expect(linkedAnswers(def.services['elderly-care'], { type: 'weekly' })).toEqual({});
    expect(linkedAnswers(def.services['elderly-care'], { task: 'injection' })).toEqual({});
  });

  it('asks the time window, the start and the city only where they apply', () => {
    const elderly = def.services['elderly-care'];
    expect(asksTimeWindow(elderly, { type: 'hourly' })).toBe(true);
    expect(asksTimeWindow(elderly, { type: 'live-in' })).toBe(false);
    expect(asksStart(elderly, {})).toBe(true);
    const nursing = def.services['home-nursing'];
    expect(asksStart(nursing, { timing: 'urgent' })).toBe(false);
    expect(asksStart(nursing, { timing: 'scheduled' })).toBe(true);
    expect(asksTimeWindow(nursing, { timing: 'urgent' })).toBe(false);
    const therapy = def.services.therapy;
    expect(isInPerson(therapy, { session: 'online' })).toBe(false);
    expect(isInPerson(therapy, { session: 'in-person' })).toBe(true);
    expect(asksTimeWindow(therapy, {})).toBe(true);
    expect(isInPerson(def.services['child-care'], {})).toBe(true);
  });

  it('sends only the service own answers, and the counter even if untouched', () => {
    const child = def.services['child-care'];
    expect(answersToSend(child, { ages: ['1-3'], stray: 'x' })).toEqual({ count: 1, ages: ['1-3'] });
  });
});

// The same cases test the API (api/tests/test_otp.py), so both accept exactly the same numbers.
const MOBILE_CASES: { in: string; out: string | null; why: string }[] = JSON.parse(
  readFileSync(new URL('../../../shared/mobile.json', import.meta.url), 'utf8'),
);

describe('mobile numbers', () => {
  it('loads the shared cases', () => {
    expect(MOBILE_CASES.length).toBeGreaterThan(10);
  });

  it.each(MOBILE_CASES)('$why', (c) => {
    expect(normalizeMobile(c.in)).toBe(c.out);
  });

  it('shows it in Persian digits, grouped 4-3-4', () => {
    expect(formatMobile('09123456789')).toBe('۰۹۱۲ ۳۴۵ ۶۷۸۹');
  });
});
