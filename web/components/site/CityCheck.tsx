'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { CitySearch } from '@/components/ui';
import { SERVICE_LIST } from '@/content/services';
import type { CityItem } from '@/lib/api';

/**
 * «Is it active in your city?» Loads the whole city list once (about 18 KB) when someone
 * reaches for the field, then searches it on the device: no waiting while typing.
 */
export function CityCheck({ id = 'city-check', level = 3 }: { id?: string; level?: 2 | 3 }) {
  const [cities, setCities] = useState<CityItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [city, setCity] = useState<CityItem | null>(null);
  const loading = useRef(false);

  function load() {
    if (cities || loading.current) return;
    loading.current = true;
    setFailed(false);
    fetch('/api/cities')
      .then((r) => (r.ok ? (r.json() as Promise<CityItem[]>) : Promise.reject(new Error(String(r.status)))))
      .then(setCities)
      .catch(() => {
        setFailed(true);
        loading.current = false;
      });
  }

  return (
    <div className="city-check" onFocusCapture={load} onPointerEnter={load}>
      <CitySearch
        id={id}
        cities={cities ?? []}
        loading={!cities && !failed}
        label="شهرتان را بنویسید"
        placeholder="مثلاً اصفهان"
        help="شهر را بنویسید و از فهرست انتخاب کنید تا خدمت‌های فعالش را ببینید."
        value={city}
        onChange={setCity}
        error={failed ? 'فهرست شهرها باز نشد. اتصال اینترنت را بررسی کنید و دوباره روی کادر بزنید.' : undefined}
        unavailable={failed}
      />
      <div aria-live="polite">{city ? <CityResult city={city} level={level} /> : null}</div>
    </div>
  );
}

function CityResult({ city, level }: { city: CityItem; level: 2 | 3 }) {
  const inPerson = city.active.length > 0;
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <div className="city-result">
      <Heading>{city.name}</Heading>
      <ul className="avail">
        {SERVICE_LIST.map((s) => {
          const on = city.active.includes(s.slug);
          const label = s.onlineEverywhere ? (on ? 'آنلاین و حضوری' : 'آنلاین') : on ? 'فعال' : null;
          return (
            <li key={s.slug}>
              <span>{s.name}</span>
              <span className={label ? 'dg-badge dg-badge--in-service' : 'dg-badge dg-badge--waitlist'}>{label ?? 'لیست انتظار'}</span>
            </li>
          );
        })}
      </ul>
      <p className="small">
        {inPerson
          ? `برای خدمت‌های فعال، درخواستتان به مرکزی در ${city.name} سپرده می‌شود.`
          : `برای خدمات حضوری، درخواستتان در لیست انتظار ثبت می‌شود و وقتی دلگرمی در ${city.name} فعال شد پیامک می‌گیرید.`}
      </p>
      <p className="city-result-actions">
        <Link className="dg-btn dg-btn--secondary" href={`/request?city=${city.code}`}>ثبت درخواست در {city.name}</Link>
        {city.slug ? <Link href={`/cities/${city.slug}`}>درباره‌ی دلگرمی در {city.name}</Link> : null}
      </p>
    </div>
  );
}
