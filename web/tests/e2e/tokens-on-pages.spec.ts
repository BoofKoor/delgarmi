import { expect, test, type Page } from '@playwright/test';

// Design system v8 (UI review of 4 Aban 1405): the pages take their text sizes from the type
// styles, written in rem, with smaller titles on phones. Every check reads the token from the
// page itself, so it fails if the page drifts from the system or the token goes.

async function token(page: Page, name: string) {
  return page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
}

/** A rem token in px at the page's root font size, e.g. «1.875rem» → «30px». */
async function tokenPx(page: Page, name: string) {
  return page.evaluate((n) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    return value.endsWith('rem') ? `${Number.parseFloat(value) * root}px` : value;
  }, name);
}

/** What the browser makes of a CSS value (a var() colour becomes rgb(...)). */
async function resolve(page: Page, value: string) {
  return page.evaluate((v) => {
    const probe = document.createElement('div');
    probe.style.color = v;
    document.body.append(probe);
    const out = getComputedStyle(probe).color;
    probe.remove();
    return out;
  }, value);
}

async function computed(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const s = getComputedStyle(el);
    return { size: s.fontSize, weight: s.fontWeight, line: s.lineHeight, family: s.fontFamily, bg: s.backgroundColor, border: s.borderTopColor, color: s.color };
  });
}

const px = (value: string) => Number.parseFloat(value);

test('the brand name beside the logo is set in display-sm, in the header and the footer', async ({ page }) => {
  await page.goto('/');
  expect(await token(page, '--type-display-sm-size')).toBe('2.25rem');
  for (const where of ['.dg-header .dg-brand-name', '.dg-footer .dg-brand-name']) {
    const s = await computed(page, where);
    expect(s.size, where).toBe(await tokenPx(page, '--type-display-sm-size'));
    expect(s.weight, where).toBe(await token(page, '--type-display-sm-weight'));
    expect(s.family, where).toContain('Pofak');
  }
});

test('inner page titles are set in title: 40px from 760 pixels, 30px below (finding 15)', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'widths are set by hand here');
  for (const [width, size] of [[759, '30px'], [760, '40px']] as const) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/about', '/faq', '/cities', '/services/elderly-care', '/services/therapy']) {
      await page.goto(path);
      const s = await computed(page, 'h1');
      const where = `${path} at ${width}px`;
      expect(await tokenPx(page, '--type-title-size'), where).toBe(size);
      expect(s.size, where).toBe(size);
      expect(s.weight, where).toBe(await token(page, '--type-title-weight'));
      expect(px(s.line), where).toBeCloseTo(px(s.size) * Number(await token(page, '--type-title-line')), 1);
    }
  }
});

test('text grows with the browser text size, because the sizes are rem (finding 5)', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'one width is enough');
  await page.goto('/about');
  const at16 = await computed(page, 'h1');
  await page.addStyleTag({ content: 'html { font-size: 20px; }' });
  const at20 = await computed(page, 'h1');
  expect(px(at20.size) / px(at16.size)).toBeCloseTo(20 / 16, 2);
});

test('the child-care title stays in display-sm at every width', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'widths are set by hand here');
  for (const width of [390, 759, 760, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/services/child-care');
    const s = await computed(page, 'h1');
    expect(s.size, `${width}px`).toBe(await tokenPx(page, '--type-display-sm-size'));
    expect(s.family, `${width}px`).toContain('Pofak');
  }
});

test('the step numbers on the home page use the number style in brand-coral', async ({ page }) => {
  await page.goto('/');
  expect(await token(page, '--type-number-size')).toBe('3rem');
  const steps = page.locator('.dg-process--display .dg-process-n');
  await expect(steps).toHaveCount(4);
  const s = await computed(page, '.dg-process--display .dg-process-n');
  expect(s.size).toBe(await tokenPx(page, '--type-number-size'));
  expect(s.weight).toBe(await token(page, '--type-number-weight'));
  expect(s.family).toContain('Pofak');
  expect(s.color).toBe(await resolve(page, 'var(--brand-coral)'));
});

test('section bands are white with soft lines, and the footer is sand', async ({ page }) => {
  for (const path of ['/', '/services/elderly-care']) {
    await page.goto(path);
    const band = await computed(page, 'section.band');
    expect(band.bg, path).toBe(await resolve(page, 'var(--surface-card)'));
    expect(band.border, path).toBe(await resolve(page, 'var(--line-soft)'));
    expect((await computed(page, '.dg-footer')).bg, path).toBe(await resolve(page, 'var(--surface-sand)'));
  }
});

test('the same four steps, in the same words, on the home page, the service pages and the city pages (finding 12)', async ({ page }) => {
  const titles = async () => page.locator('.dg-process .dg-process-title').allInnerTexts();
  await page.goto('/');
  const home = await titles();
  expect(home).toEqual(['ثبت درخواست', 'تماس همکار دلگرمی', 'معرفی مرکز دارای مجوز', 'هماهنگی و شروع کار']);
  for (const path of ['/services/elderly-care', '/services/home-nursing', '/services/child-care', '/cities/isfahan']) {
    await page.goto(path);
    expect(await titles(), path).toEqual(home);
  }
  // Only therapy names its last two steps its own way.
  await page.goto('/services/therapy');
  expect(await titles()).toEqual(['ثبت درخواست', 'تماس همکار دلگرمی', 'معرفی درمانگر', 'جلسه‌ی اول']);
});

test('every link and button of the header, footer and breadcrumb is at least 44px high and wide (findings 17 and 18)', async ({ page }) => {
  await page.goto('/services/elderly-care');
  const small = await page.locator('.dg-header a:visible, .dg-header button:visible, .dg-footer a:visible, .dg-crumbs a').evaluateAll((els) =>
    els.map((el) => ({ text: (el.textContent ?? '').trim().slice(0, 20), box: el.getBoundingClientRect() }))
      .filter(({ box }) => box.height < 44 - 0.5 || box.width < 44 - 0.5)
      .map(({ text, box }) => `${text}: ${Math.round(box.width)}×${Math.round(box.height)}`),
  );
  expect(small).toEqual([]);
});
