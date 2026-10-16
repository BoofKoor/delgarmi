import { normalizeFa } from './text';

export type City = { name: string; province: string };

type Keys = { name: string; province: string };
const keyCache = new WeakMap<readonly City[], Keys[]>();

function keysOf(cities: readonly City[]): Keys[] {
  let keys = keyCache.get(cities);
  if (!keys) {
    keys = cities.map((c) => ({ name: normalizeFa(c.name), province: normalizeFa(c.province) }));
    keyCache.set(cities, keys);
  }
  return keys;
}

/**
 * Ranks cities for the city search box: exact name first, then names that start with the
 * query, then names that contain it or whose province starts with it. Within each group the
 * list's own order is kept (the API lists the largest cities first). At most `limit` results.
 */
export function searchCities<T extends City>(cities: readonly T[], query: string, limit = 8): T[] {
  const q = normalizeFa(query);
  if (!q) return [];
  const keys = keysOf(cities);
  const exact: T[] = [];
  const starts: T[] = [];
  const other: T[] = [];
  cities.forEach((city, i) => {
    const { name, province } = keys[i];
    if (name === q) exact.push(city);
    else if (name.startsWith(q)) starts.push(city);
    else if (name.includes(q) || province.startsWith(q)) other.push(city);
  });
  return [...exact, ...starts, ...other].slice(0, limit);
}
