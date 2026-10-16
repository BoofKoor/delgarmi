import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The public pages need the API (cities); run them against `next start` with the API running,
// or against the whole stack behind nginx (BASE_URL).

const PAGES = [
  '/',
  '/services/elderly-care',
  '/services/home-nursing',
  '/services/child-care',
  '/services/therapy',
  '/how-we-vet',
  '/cities',
  '/cities/isfahan',
  '/faq',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/request',
  '/track',
];

type CityItem = { code: string; name: string; province: string; slug: string | null; active: string[] };
type CityDetail = { slug: string | null; services: { slug: string; name: string; in_person: boolean; online: boolean }[] };

async function axe(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

for (const path of PAGES) {
  test(`${path} loads with one title, its own <title> and no WCAG A/AA violations`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('h1')).toHaveCount(1);
    const title = await page.title();
    expect(title).toContain('دلگرمی');
    if (path !== '/') expect(title).not.toBe('دلگرمی | مراقبت از عزیزانتان، با خیال راحت');
    expect(await axe(page)).toEqual([]);
  });
}

test('no page scrolls sideways from 320 to 1920 pixels wide', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'widths are set by hand here');
  test.setTimeout(120_000);
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/services/elderly-care', '/services/therapy', '/cities', '/cities/isfahan', '/faq', '/privacy']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} at ${width}px`).toBe(0);
    }
  }
});

test('every link to another page of the site answers', async ({ page, request }, info) => {
  test.skip(info.project.name !== 'desktop', 'one crawl is enough');
  test.setTimeout(120_000);
  const links = new Set<string>();
  for (const path of [...PAGES, '/cities/tehran', '/no-such-page']) {
    await page.goto(path);
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
    for (const href of hrefs) links.add(href.split('#')[0] || '/');
  }
  expect(links.size).toBeGreaterThan(30);
  const broken: string[] = [];
  for (const href of links) {
    const response = await request.get(href);
    if (response.status() >= 400) broken.push(`${href} → ${response.status()}`);
  }
  expect(broken).toEqual([]);
});

test('unknown pages and cities get the Persian 404 page', async ({ page }) => {
  for (const path of ['/no-such-page', '/cities/nowhere', '/services/massage']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'این صفحه پیدا نشد' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'صفحه‌ی اصلی' }).first()).toBeVisible();
  }
});

test('the city check shows what the API says is active in that city', async ({ page, request }) => {
  const cities: CityItem[] = await (await request.get('/api/cities')).json();
  expect(cities.length).toBe(1354);
  const isfahan = cities.find((c) => c.slug === 'isfahan')!;

  await page.goto('/#coverage');
  const input = page.getByRole('combobox', { name: 'شهرتان را بنویسید' });
  await input.fill('اصفه');
  await page.getByRole('option', { name: /^اصفهان/ }).first().click();
  const result = page.locator('.city-result');
  await expect(result.getByRole('heading', { name: 'اصفهان، استان اصفهان' })).toBeVisible();
  const expected: Record<string, string> = {
    'مراقبت سالمند': isfahan.active.includes('elderly-care') ? 'فعال' : 'لیست انتظار',
    'پرستاری در منزل': isfahan.active.includes('home-nursing') ? 'فعال' : 'لیست انتظار',
    'پرستار کودک': isfahan.active.includes('child-care') ? 'فعال' : 'لیست انتظار',
    'روان‌درمانی': isfahan.active.includes('therapy') ? 'آنلاین و حضوری' : 'آنلاین',
  };
  for (const [service, state] of Object.entries(expected)) {
    await expect(result.locator('li', { hasText: service })).toContainText(state);
  }
  await expect(result.getByRole('link', { name: 'ثبت درخواست در اصفهان' })).toHaveAttribute('href', `/request?city=${isfahan.code}`);
  await expect(result.getByRole('link', { name: 'درباره‌ی دلگرمی در اصفهان' })).toHaveAttribute('href', '/cities/isfahan');

  // A small city with no page of its own, found through Arabic letters and no half-space.
  await input.fill('گلوگاه');
  await expect(page.getByRole('option', { name: /گلوگاه \(بابل\)/ })).toBeVisible();
  await input.fill('بويين زهرا');
  await page.getByRole('option', { name: /بوئین‌زهرا/ }).click();
  await expect(result.getByRole('heading', { name: /^بوئین‌زهرا، استان قزوین$/ })).toBeVisible();
  await expect(result.getByRole('link', { name: /درباره‌ی دلگرمی در/ })).toHaveCount(0);
});

test('a city page lists the API availability and stays out of search until a service starts', async ({ page, request }) => {
  const city: CityDetail = await (await request.get('/api/cities/isfahan')).json();
  await page.goto('/cities/isfahan');
  await expect(page.getByRole('heading', { level: 1, name: 'دلگرمی در اصفهان' })).toBeVisible();
  for (const svc of city.services) {
    const state = svc.online ? (svc.in_person ? 'آنلاین و حضوری' : 'آنلاین') : svc.in_person ? 'فعال' : 'لیست انتظار';
    await expect(page.locator('.svc-status li', { hasText: svc.name })).toContainText(state);
  }
  const robots = page.locator('meta[name="robots"]');
  if (city.services.some((s) => s.in_person)) await expect(robots).toHaveCount(0);
  else await expect(robots).toHaveAttribute('content', /noindex/);
  await expect(page.getByRole('link', { name: 'ثبت درخواست در اصفهان' }).first()).toHaveAttribute('href', /^\/request\?city=\d+$/);
});

test('service pages send the request form the service they are about', async ({ page }) => {
  for (const slug of ['elderly-care', 'home-nursing', 'child-care', 'therapy']) {
    await page.goto(`/services/${slug}`);
    const cta = page.locator('#svc-actions a').first();
    await expect(cta).toHaveAttribute('href', `/request?service=${slug}`);
    const firstQuestion = page.locator('#svc-faq details').first();
    await firstQuestion.locator('summary').click();
    await expect(firstQuestion).toHaveAttribute('open', '');
  }
});

test('the phone menu opens as a dialog, closes with Esc and gives focus back', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'the menu button only shows on phones');
  await page.goto('/');
  const button = page.getByRole('button', { name: 'باز کردن منو' });
  await button.click();
  const dialog = page.getByRole('dialog', { name: 'منو' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'سؤال‌های پرتکرار' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();

  await button.click();
  await dialog.getByRole('link', { name: 'سؤال‌های پرتکرار' }).click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect(dialog).toBeHidden();
});

test('on phones the request button sticks to the bottom once the hero buttons scroll away', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'the sticky bar is for phones');
  await page.goto('/');
  const bar = page.locator('.sticky-cta');
  await expect(bar).toBeHidden();
  await page.locator('#how').scrollIntoViewIfNeeded();
  await expect(bar).toBeVisible();
  await expect(bar.getByRole('link', { name: 'ثبت درخواست' })).toHaveAttribute('href', '/request');
  await page.locator('#closing').scrollIntoViewIfNeeded();
  await expect(bar).toBeHidden();

  // It steps aside while the keyboard is up for the city field.
  const field = page.getByRole('combobox', { name: 'شهرتان را بنویسید' });
  await field.scrollIntoViewIfNeeded();
  await expect(bar).toBeVisible();
  await field.focus();
  await expect(bar).toBeHidden();
  await field.blur();
  await expect(bar).toBeVisible();
});

test('robots.txt keeps crawlers off anything but the public domain', async ({ request }) => {
  const text = await (await request.get('/robots.txt')).text();
  expect(text).toMatch(/Disallow: \/\s*$/m);
  expect(text).not.toContain('Allow: /');
});

test('the sitemap lists the public pages and only cities with an active service', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const path of ['/', '/services/therapy', '/how-we-vet', '/cities', '/faq', '/privacy']) {
    expect(urls).toContain(new URL(path, 'https://delgarmi.com').href);
  }
  expect(urls.some((u) => u.includes('/request'))).toBe(false);
  const cities: CityItem[] = await (await request.get('/api/cities')).json();
  const active = new Set(cities.filter((c) => c.slug && c.active.length).map((c) => `https://delgarmi.com/cities/${c.slug}`));
  expect(urls.filter((u) => u.includes('/cities/')).sort()).toEqual([...active].sort());
});
