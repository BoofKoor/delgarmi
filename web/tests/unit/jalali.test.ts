import { describe, expect, it } from 'vitest';
import { d2g, d2j, g2d, isLeapJalali, j2d, monthLength, tehranToday, weekday } from '@/lib/jalali';

describe('jalali calendar', () => {
  it('maps known dates', () => {
    expect(d2j(g2d(2026, 10, 13))).toEqual({ jy: 1405, jm: 7, jd: 21 });
    expect(d2j(g2d(2025, 3, 21))).toEqual({ jy: 1404, jm: 1, jd: 1 });
    expect(d2j(g2d(2026, 3, 21))).toEqual({ jy: 1405, jm: 1, jd: 1 });
    expect(d2j(g2d(2025, 3, 20))).toEqual({ jy: 1403, jm: 12, jd: 30 });
  });

  it('knows leap years', () => {
    expect(isLeapJalali(1403)).toBe(true);
    expect(isLeapJalali(1404)).toBe(false);
    expect(monthLength(1403, 12)).toBe(30);
    expect(monthLength(1404, 12)).toBe(29);
    expect(monthLength(1405, 6)).toBe(31);
    expect(monthLength(1405, 7)).toBe(30);
  });

  it('counts weekdays from Saturday, without time zones', () => {
    expect(weekday(g2d(2026, 10, 13))).toBe(3); // Tuesday
    expect(weekday(g2d(2026, 10, 16))).toBe(6); // Friday
    expect(weekday(j2d(1405, 7, 1))).toBe(4); // 1 Mehr 1405 is a Wednesday
  });

  it('round-trips every day from 2020 to 2040', () => {
    const start = g2d(2020, 1, 1);
    const end = g2d(2040, 12, 31);
    let previous = d2j(start - 1);
    for (let d = start; d <= end; d++) {
      const j = d2j(d);
      expect(j2d(j.jy, j.jm, j.jd)).toBe(d);
      const g = d2g(d);
      expect(g2d(g.gy, g.gm, g.gd)).toBe(d);
      const advancedDay = j.jd === previous.jd + 1 && j.jm === previous.jm;
      const newMonth = j.jd === 1 && previous.jd === monthLength(previous.jy, previous.jm);
      expect(advancedDay || newMonth).toBe(true);
      previous = j;
    }
  });

  it('uses Tehran time for today', () => {
    expect(tehranToday(new Date('2026-10-13T20:29:00Z'))).toBe(g2d(2026, 10, 13)); // 23:59 in Tehran
    expect(tehranToday(new Date('2026-10-13T20:31:00Z'))).toBe(g2d(2026, 10, 14)); // 00:01 in Tehran
  });
});
