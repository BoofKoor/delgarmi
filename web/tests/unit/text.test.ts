import { describe, expect, it } from 'vitest';
import { searchCities } from '@/lib/city-search';
import { fa, latin } from '@/lib/digits';
import { SAMPLE_CITIES } from '@/lib/sample-cities';
import { normalizeFa } from '@/lib/text';

describe('digits', () => {
  it('converts both ways', () => {
    expect(fa('09123456789')).toBe('۰۹۱۲۳۴۵۶۷۸۹');
    expect(latin('۰۹۱۲٣٤۵')).toBe('0912345');
  });
});

describe('normalizeFa', () => {
  it('folds the variants people type', () => {
    expect(normalizeFa('كرمانشاه')).toBe(normalizeFa('کرمانشاه'));
    expect(normalizeFa('آبادان')).toBe(normalizeFa('ابادان'));
    expect(normalizeFa('نجف‌آباد')).toBe(normalizeFa('نجف آباد'));
    expect(normalizeFa('نجف‌آباد')).toBe(normalizeFa('نجفاباد'));
  });
});

describe('searchCities', () => {
  const names = (q: string) => searchCities(SAMPLE_CITIES, q).map((c) => c.name);

  it('puts the exact name before longer names that start the same', () => {
    expect(names('کرمان').slice(0, 2)).toEqual(['کرمان', 'کرمانشاه']);
    expect(names('كرمان')[0]).toBe('کرمان');
  });

  it('ranks prefix matches, then province matches', () => {
    expect(names('اصف')[0]).toBe('اصفهان');
    const isfahan = names('اصفهان');
    expect(isfahan[0]).toBe('اصفهان');
    expect(isfahan).toContain('کاشان');
  });

  it('finds names written with a space instead of a half-space', () => {
    expect(names('نجف آباد')).toContain('نجف‌آباد');
  });

  it('returns nothing for an empty query and at most eight results', () => {
    expect(names('  ')).toEqual([]);
    expect(names('ا').length).toBeLessThanOrEqual(8);
    expect(names('ا').length).toBe(8);
  });
});
