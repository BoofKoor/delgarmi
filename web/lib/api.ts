import { connection } from 'next/server';
import type { ServiceSlug } from '@/content/services';
import type { FormDefinition } from './form';

/**
 * Server-side reads from the Django API. Pages that call these render per request (never at
 * build time, when the API is not running) and share one cached answer per minute, so a change
 * in the panel shows on the site within a minute.
 */

export type CityItem = { code: string; name: string; province: string; slug: string | null; active: ServiceSlug[] };
export type CityDetail = {
  code: string;
  name: string;
  province: string;
  slug: string | null;
  services: { slug: ServiceSlug; name: string; in_person: boolean; online: boolean }[];
};

const BASE = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:8000';

async function get<T>(path: string): Promise<T | null> {
  await connection();
  const response = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`API ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

/** The request form's questions and texts (api/catalog/form.json). */
export async function getForm(): Promise<FormDefinition> {
  const form = await get<FormDefinition>('/api/form');
  if (!form) throw new Error('API /api/form answered 404');
  return form;
}

/** The line under each service's name in the form (Service.hint in the panel). */
export async function getServiceHints(): Promise<Partial<Record<ServiceSlug, string>>> {
  const list = (await get<{ slug: ServiceSlug; hint: string }[]>('/api/services')) ?? [];
  return Object.fromEntries(list.map((s) => [s.slug, s.hint]));
}

/** A city as the city list has it (the form's city field takes this shape). */
export function asCityItem(city: CityDetail): CityItem {
  return { code: city.code, name: city.name, province: city.province, slug: city.slug, active: city.services.filter((s) => s.in_person).map((s) => s.slug) };
}

export async function getCities(): Promise<CityItem[]> {
  return (await get<CityItem[]>('/api/cities')) ?? [];
}

/** By page address (isfahan) or Statistical Centre code. Null when there is no such city. */
export async function getCity(key: string): Promise<CityDetail | null> {
  if (!/^[a-z0-9-]{1,40}$/.test(key)) return null;
  return get<CityDetail>(`/api/cities/${key}`);
}
