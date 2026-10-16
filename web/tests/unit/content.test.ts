import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FAQ_GROUPS, HOME_FAQ } from '@/content/faq';
import { SERVICE_LIST, SERVICE_SLUGS } from '@/content/services';

const publicDir = join(__dirname, '..', '..', 'public');

describe('service content', () => {
  it('has the four services in the design-system order with their fixed names', () => {
    expect(SERVICE_LIST.map((s) => s.slug)).toEqual([...SERVICE_SLUGS]);
    expect(SERVICE_LIST.map((s) => s.name)).toEqual(['مراقبت سالمند', 'پرستاری در منزل', 'پرستار کودک', 'روان‌درمانی']);
  });

  it('keeps titles and descriptions short enough for search results', () => {
    for (const s of SERVICE_LIST) {
      expect(s.metaTitle.length, s.slug).toBeLessThanOrEqual(60);
      expect(s.description.length, s.slug).toBeLessThanOrEqual(160);
    }
  });

  it('points every option at the request form for the same service', () => {
    for (const s of SERVICE_LIST) {
      for (const c of s.choices.items) expect(c.href.startsWith(`/request?service=${s.slug}&`), c.title).toBe(true);
    }
  });

  it('writes each linked service into its note, where it becomes the link', () => {
    for (const s of SERVICE_LIST) {
      for (const col of s.scope.columns) if (col.link) expect(col.note ?? '', s.slug).toContain(col.link.label);
    }
  });

  it('has every photo and link-preview image it names', () => {
    for (const s of SERVICE_LIST) {
      for (const src of [s.card.src, s.photo.src, s.scope.photo?.src, `/images/og/${s.slug}.jpg`]) {
        if (src) expect(existsSync(join(publicDir, src)), src).toBe(true);
      }
    }
    expect(existsSync(join(publicDir, 'images/og/home.jpg'))).toBe(true);
  });

  it('asks each question only once per list', () => {
    for (const list of [HOME_FAQ, ...FAQ_GROUPS.map((g) => g.items), ...SERVICE_LIST.map((s) => s.faq)]) {
      const questions = list.map((f) => f.q);
      expect(new Set(questions).size).toBe(questions.length);
    }
  });
});
