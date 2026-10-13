'use client';

import { useRef, useState } from 'react';
import { fa } from '@/lib/digits';

export type CounterProps = {
  /** id of the visible question label (`.dg-group-label`). */
  labelId: string;
  min?: number;
  max?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
};

/** Small counts such as «تعداد کودکان». The buttons disable at the limits. */
export function Counter({ labelId, min = 1, max = 6, value, defaultValue, onChange }: CounterProps) {
  const [inner, setInner] = useState(defaultValue ?? min);
  const current = value ?? inner;
  const less = useRef<HTMLButtonElement>(null);
  const more = useRef<HTMLButtonElement>(null);

  function step(delta: number) {
    const next = Math.max(min, Math.min(max, current + delta));
    if (value === undefined) setInner(next);
    onChange?.(next);
    // A button that becomes disabled drops keyboard focus; hand it to the other one.
    if (next === min && delta < 0) more.current?.focus();
    if (next === max && delta > 0) less.current?.focus();
  }

  return (
    <div className="dg-counter" role="group" aria-labelledby={labelId}>
      <button ref={less} type="button" aria-label="یکی کمتر" disabled={current <= min} onClick={() => step(-1)}>−</button>
      <output aria-live="polite">{fa(current)}</output>
      <button ref={more} type="button" aria-label="یکی بیشتر" disabled={current >= max} onClick={() => step(1)}>+</button>
    </div>
  );
}
