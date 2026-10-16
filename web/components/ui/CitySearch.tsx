'use client';

import { MapPin } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { searchCities, type City } from '@/lib/city-search';
import { cx } from '@/lib/cx';
import { normalizeFa } from '@/lib/text';

export type CitySearchProps<T extends City> = {
  id: string;
  cities: readonly T[];
  label?: string;
  placeholder?: string;
  /** Only a city picked from the list counts; typing again clears it. */
  value?: T | null;
  onChange?: (city: T | null) => void;
  help?: string;
  error?: string;
  /** The list is still on its way: say so instead of «not found». */
  loading?: boolean;
  /** The list could not be loaded: no suggestions open (the error under the field says why). */
  unavailable?: boolean;
};

/** Combobox with suggestions: ARIA 1.2 pattern, arrows to move, Enter to pick, Esc to close. */
export function CitySearch<T extends City>({
  id,
  cities,
  label = 'شهر',
  placeholder,
  value,
  onChange,
  help = 'شهر را بنویسید و از فهرست انتخاب کنید.',
  error,
  loading = false,
  unavailable = false,
}: CitySearchProps<T>) {
  const [picked, setPicked] = useState<T | null>(value ?? null);
  const city = value === undefined ? picked : value;
  const [text, setText] = useState(city?.name ?? '');
  const [items, setItems] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const listId = `${id}-list`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  function choose(next: T | null) {
    if (value === undefined) setPicked(next);
    onChange?.(next);
  }
  function search(query: string) {
    const found = searchCities(cities, query);
    setItems(found);
    setActive(found.length ? 0 : -1);
    setOpen(!unavailable && Boolean(normalizeFa(query)));
  }
  // The list may arrive after someone started typing: search again then.
  useEffect(() => {
    if (document.activeElement === input.current && text && !city) search(text);
  }, [cities]);

  function pick(index: number) {
    const c = items[index];
    if (!c) return;
    setText(c.name);
    setOpen(false);
    setActive(-1);
    choose(c);
  }
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'ArrowDown' && text) { e.preventDefault(); search(text); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(active); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); setActive(-1); }
  }

  const describedBy = [helpId, error ? errorId : null].filter(Boolean).join(' ');
  return (
    <div className={cx('dg-field', Boolean(error) && 'dg-field--error')}>
      <label className="dg-label" htmlFor={id}>{label}</label>
      <div className="dg-combo">
        <div className="dg-input-icon">
          <MapPin aria-hidden="true" focusable="false" strokeWidth={1.75} />
          <input
            ref={input}
            id={id}
            className="dg-input"
            type="text"
            role="combobox"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={placeholder}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && active > -1 ? `${listId}-o${active}` : undefined}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            value={text}
            onChange={(e) => { setText(e.target.value); if (city) choose(null); search(e.target.value); }}
            onKeyDown={onKeyDown}
            onBlur={() => { setOpen(false); setActive(-1); }}
          />
        </div>
        {items.length ? (
          <div className="dg-combo-list" id={listId} role="listbox" aria-label="شهرها" hidden={!open}>
            {items.map((c, i) => (
              <div
                key={`${c.name}-${c.province}`}
                className="dg-combo-opt"
                role="option"
                id={`${listId}-o${i}`}
                aria-selected={i === active}
                onMouseDown={(e) => { e.preventDefault(); pick(i); }}
              >
                <span>{c.name}</span>
                <small>استان {c.province}</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="dg-combo-list" id={listId} hidden={!open}>
            <div className="dg-combo-empty" role="status">
              {loading ? 'فهرست شهرها در حال آماده شدن است…' : 'شهری با این نام پیدا نشد. اسم شهر را بدون پیشوند بنویسید.'}
            </div>
          </div>
        )}
      </div>
      <p className="dg-help" id={helpId}>{city ? `استان ${city.province}` : help}</p>
      {error ? <p className="dg-error" id={errorId}>{error}</p> : null}
    </div>
  );
}
