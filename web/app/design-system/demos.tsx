'use client';

import { useState } from 'react';
import { CitySearch, Counter, DatePicker, dayLabel } from '@/components/ui';
import type { City } from '@/lib/city-search';
import { j2d } from '@/lib/jalali';
import { SAMPLE_CITIES } from '@/lib/sample-cities';

export function CounterDemo() {
  return (
    <div className="dg-group ds-last">
      <span className="dg-group-label" id="kids-label">تعداد کودکان</span>
      <Counter labelId="kids-label" min={1} max={6} defaultValue={2} />
    </div>
  );
}

export function CitySearchDemo() {
  const [city, setCity] = useState<City | null>(null);
  return (
    <div className="ds-combo-room">
      <CitySearch id="city" cities={SAMPLE_CITIES} value={city} onChange={setCity} />
    </div>
  );
}

// Fixed dates so the card matches the design-system preview: today is Tuesday 21 Mehr 1405.
const DEMO_TODAY = j2d(1405, 7, 21);

export function DatePickerDemo() {
  const [day, setDay] = useState<number | null>(j2d(1405, 7, 26));
  return (
    <div className="ds-stack">
      <DatePicker today={DEMO_TODAY} value={day} onChange={setDay} />
      <p className="ds-picked" aria-live="polite">{day ? `شروع: ${dayLabel(day)}` : 'روز شروع را انتخاب کنید.'}</p>
    </div>
  );
}
