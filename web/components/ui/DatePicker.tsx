'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { fa } from '@/lib/digits';
import { d2j, j2d, monthLength, MONTHS, weekday, WEEKDAY_INITIALS, WEEKDAYS } from '@/lib/jalali';

/** «یکشنبه ۲۶ مهر» */
export function dayLabel(jdn: number, withWeekday = true): string {
  const j = d2j(jdn);
  return `${withWeekday ? `${WEEKDAYS[weekday(jdn)]} ` : ''}${fa(j.jd)} ${MONTHS[j.jm - 1]}`;
}

export type DatePickerProps = {
  /** Today's day number (Tehran). Pass it from the client so server and browser agree. */
  today: number;
  value: number | null;
  onChange: (jdn: number) => void;
  /** Last selectable day, counted from today. */
  maxDays?: number;
};

// In right-to-left layout the next day sits to the left.
const MOVES: Record<string, number> = { ArrowLeft: 1, ArrowRight: -1, ArrowDown: 7, ArrowUp: -7 };

/** Shamsi month grid, week starting Saturday. Past days and days after `maxDays` are disabled. */
export function DatePicker({ today, value, onChange, maxDays = 90 }: DatePickerProps) {
  const last = today + maxDays;
  const [view, setView] = useState(() => {
    const j = d2j(value ?? today);
    return { jy: j.jy, jm: j.jm };
  });
  const [focusDay, setFocusDay] = useState<number | null>(null);
  const grid = useRef<HTMLDivElement>(null);

  const first = j2d(view.jy, view.jm, 1);
  const length = monthLength(view.jy, view.jm);
  const lead = weekday(first);
  const inView = (d: number | null) => d !== null && d >= first && d < first + length;
  const enabled = (d: number) => d >= today && d <= last;
  const tabStop = inView(value) && enabled(value as number) ? (value as number)
    : inView(today) ? today
    : Array.from({ length }, (_, i) => first + i).find(enabled) ?? first;

  useEffect(() => {
    if (focusDay === null) return;
    grid.current?.querySelector<HTMLButtonElement>(`[data-jdn="${focusDay}"]`)?.focus();
    setFocusDay(null);
  }, [focusDay, view]);

  function show(jdn: number) {
    const j = d2j(jdn);
    setView({ jy: j.jy, jm: j.jm });
  }
  function shiftMonth(delta: number) {
    let jm = view.jm + delta;
    let jy = view.jy;
    if (jm > 12) { jm = 1; jy += 1; }
    if (jm < 1) { jm = 12; jy -= 1; }
    setView({ jy, jm });
  }
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const move = MOVES[e.key];
    const from = Number((e.target as HTMLElement).dataset.jdn);
    if (!move || !from) return;
    e.preventDefault();
    const target = Math.min(last, Math.max(today, from + move));
    if (!inView(target)) show(target);
    setFocusDay(target);
  }

  const monthName = MONTHS[view.jm - 1];
  return (
    <div className="dg-cal">
      <div className="dg-cal-head">
        <button type="button" className="dg-cal-nav" aria-label="ماه قبل" disabled={first <= today} onClick={() => shiftMonth(-1)}>
          <ChevronRight aria-hidden="true" focusable="false" strokeWidth={1.75} />
        </button>
        <strong aria-live="polite">{monthName} {fa(view.jy)}</strong>
        <button type="button" className="dg-cal-nav" aria-label="ماه بعد" disabled={first + length > last} onClick={() => shiftMonth(1)}>
          <ChevronLeft aria-hidden="true" focusable="false" strokeWidth={1.75} />
        </button>
      </div>
      <div className="dg-cal-grid" role="group" aria-label={`روزهای ${monthName}`} ref={grid} onKeyDown={onKeyDown}>
        {WEEKDAY_INITIALS.map((d, i) => (
          <span key={d + i} className="dg-cal-dow" aria-hidden="true" title={WEEKDAYS[i]}>{d}</span>
        ))}
        {Array.from({ length: lead }, (_, i) => <span key={`lead-${i}`} />)}
        {Array.from({ length }, (_, i) => {
          const jdn = first + i;
          const classes = ['dg-cal-day', jdn === today && 'is-today', weekday(jdn) === 6 && 'is-fri'].filter(Boolean).join(' ');
          return (
            <button
              key={jdn}
              type="button"
              className={classes}
              data-jdn={jdn}
              aria-pressed={value === jdn}
              aria-label={dayLabel(jdn)}
              aria-current={jdn === today ? 'date' : undefined}
              disabled={!enabled(jdn)}
              tabIndex={jdn === tabStop ? 0 : -1}
              onClick={() => { onChange(jdn); setFocusDay(jdn); }}
            >
              {fa(i + 1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
