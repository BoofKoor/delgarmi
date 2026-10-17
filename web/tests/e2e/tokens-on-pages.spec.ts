import { expect, test, type Page } from '@playwright/test';

// Design system v6 (decisions of the 24 Mehr review): the sizes the pages used to write by hand
// come from type styles now, and the section bands are white as the system says. Every check reads
// the token from the page itself, so it fails if the page drifts from the system or the token goes.

async function token(page: Page, name: string) {
  return page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
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
  expect(await token(page, '--type-display-sm-size')).toBe('36px');
  for (const where of ['.site-header .brand-name', '.site-footer .brand-name']) {
    const s = await computed(page, where);
    expect(s.size, where).toBe(await token(page, '--type-display-sm-size'));
    expect(s.weight, where).toBe(await token(page, '--type-display-sm-weight'));
    expect(s.family, where).toContain('Pofak');
  }
});

test('inner page titles are set in title, and in title-sm below 900 pixels', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'widths are set by hand here');
  await page.goto('/about');
  expect(await token(page, '--type-title-size')).toBe('40px');
  expect(await token(page, '--type-title-sm-size')).toBe('36px');
  for (const [width, style] of [[899, 'title-sm'], [900, 'title']] as const) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/about', '/faq', '/cities', '/services/elderly-care', '/services/therapy']) {
      await page.goto(path);
      const s = await computed(page, 'h1');
      const where = `${path} at ${width}px`;
      expect(s.size, where).toBe(await token(page, `--type-${style}-size`));
      expect(s.weight, where).toBe(await token(page, `--type-${style}-weight`));
      expect(px(s.line), where).toBeCloseTo(px(s.size) * Number(await token(page, `--type-${style}-line`)), 1);
    }
  }
});

test('the child-care title stays in display-sm at every width', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'widths are set by hand here');
  for (const width of [390, 899, 900, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/services/child-care');
    const s = await computed(page, 'h1');
    expect(s.size, `${width}px`).toBe(await token(page, '--type-display-sm-size'));
    expect(s.family, `${width}px`).toContain('Pofak');
  }
});

test('the step numbers on the home page use the number style in brand-coral', async ({ page }) => {
  await page.goto('/');
  expect(await token(page, '--type-number-size')).toBe('48px');
  const steps = page.locator('.steps-list .step-num');
  await expect(steps).toHaveCount(4);
  const s = await computed(page, '.steps-list .step-num');
  expect(s.size).toBe(await token(page, '--type-number-size'));
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
    expect((await computed(page, '.site-footer')).bg, path).toBe(await resolve(page, 'var(--surface-sand)'));
  }
});
