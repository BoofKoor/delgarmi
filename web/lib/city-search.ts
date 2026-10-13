import { normalizeFa } from './text';

export type City = { name: string; province: string };

/**
 * Ranks cities for the city search box: exact name first, then names that start with the
 * query, then names that contain it or whose province starts with it. At most `limit` results.
 */
export function searchCities(cities: readonly City[], query: string, limit = 8): City[] {
  const q = normalizeFa(query);
  if (!q) return [];
  const exact: City[] = [];
  const starts: City[] = [];
  const other: City[] = [];
  for (const city of cities) {
    const name = normalizeFa(city.name);
    if (name === q) exact.push(city);
    else if (name.startsWith(q)) starts.push(city);
    else if (name.includes(q) || normalizeFa(city.province).startsWith(q)) other.push(city);
  }
  return [...exact, ...starts, ...other].slice(0, limit);
}
