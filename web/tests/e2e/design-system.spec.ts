import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { fa } from '../../lib/digits';
import { d2j, j2d, MONTHS, weekday, WEEKDAYS } from '../../lib/jalali';

const label = (jdn: number) => {
  const j = d2j(jdn);
  return `${WEEKDAYS[weekday(jdn)]} ${fa(j.jd)} ${MONTHS[j.jm - 1]}`;
};

async function loadedFonts(page: Page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, ''));
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/design-system');
});

test('has no WCAG 2.1 A/AA violations', async ({ page }) => {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
});

test('loads the design-system fonts', async ({ page }) => {
  expect(await loadedFonts(page)).toEqual(expect.arrayContaining(['IRANYekanX', 'Pofak']));
});

test('city search ranks the exact name first and picks with the keyboard', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'شهر' });
  await input.fill('کرمان');
  const options = page.getByRole('option');
  await expect(options.nth(0)).toHaveText(/^کرمان/);
  await expect(options.nth(0)).not.toHaveText(/کرمانشاه/);
  await expect(options.nth(1)).toHaveText(/^کرمانشاه/);
  await input.press('Enter');
  await expect(input).toHaveValue('کرمان');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#city-help')).toHaveText('استان کرمان');

  await input.fill('اصفهان');
  await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', 'city-list-o1');
  const second = await options.nth(1).locator('span').innerText();
  await input.press('Enter');
  await expect(input).toHaveValue(second);

  await input.fill('زززز');
  await expect(page.getByText('شهری با این نام پیدا نشد')).toBeVisible();
  await expect(page.locator('#city-help')).toHaveText('شهر را بنویسید و از فهرست انتخاب کنید.');
  await input.press('Escape');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
});

test('city search picks with a tap', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'شهر' });
  await input.fill('شیر');
  await page.getByRole('option', { name: /شیراز/ }).click();
  await expect(input).toHaveValue('شیراز');
  await expect(page.locator('#city-help')).toHaveText('استان فارس');
});

test('date picker blocks past days and days after 90, and moves with arrow keys', async ({ page }) => {
  const today = j2d(1405, 7, 21);
  const grid = () => page.getByRole('group', { name: /^روزهای / });
  await expect(grid().getByRole('button', { name: label(today - 1) })).toBeDisabled();
  await expect(grid().getByRole('button', { name: label(today) })).toHaveAttribute('aria-current', 'date');
  await expect(grid().getByRole('button', { name: label(j2d(1405, 7, 26)) })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'ماه قبل' })).toBeDisabled();
  await expect(grid().locator('button[tabindex="0"]')).toHaveCount(1);

  await grid().getByRole('button', { name: label(j2d(1405, 7, 28)) }).click();
  await expect(page.getByText(`شروع: ${label(j2d(1405, 7, 28))}`)).toBeVisible();

  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(':focus')).toHaveAccessibleName(label(j2d(1405, 7, 29)));
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('group', { name: 'روزهای آبان' })).toBeVisible();
  await expect(page.locator(':focus')).toHaveAccessibleName(label(j2d(1405, 8, 6)));

  const last = today + 90;
  const next = page.getByRole('button', { name: 'ماه بعد' });
  while (await next.isEnabled()) await next.click();
  await expect(grid()).toHaveAccessibleName(`روزهای ${MONTHS[d2j(last).jm - 1]}`);
  await expect(grid().getByRole('button', { name: label(last) })).toBeEnabled();
  await expect(grid().getByRole('button', { name: label(last + 1) })).toBeDisabled();
});

test('counter stops at its limits without losing keyboard focus', async ({ page }) => {
  const less = page.getByRole('button', { name: 'یکی کمتر' });
  const more = page.getByRole('button', { name: 'یکی بیشتر' });
  const value = page.locator('.dg-counter output');
  await expect(value).toHaveText('۲');
  await less.focus();
  await page.keyboard.press('Enter');
  await expect(value).toHaveText('۱');
  await expect(less).toBeDisabled();
  await expect(more).toBeFocused();
  for (let i = 0; i < 5; i++) await page.keyboard.press('Enter');
  await expect(value).toHaveText('۶');
  await expect(more).toBeDisabled();
  await expect(less).toBeFocused();
});

test('choice chips and cards select by tapping anywhere on them', async ({ page }) => {
  // The transparent input covers the whole chip or card, so a tap anywhere lands on it.
  const chip = (text: string) => page.locator('label.dg-chip').filter({ has: page.locator('span', { hasText: new RegExp(`^${text}$`) }) });
  const card = (text: string) => page.locator('label.dg-choice').filter({ has: page.locator('.dg-choice-title', { hasText: new RegExp(`^${text}$`) }) });
  await chip('همسر').click();
  await expect(page.getByRole('radio', { name: 'همسر' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'مادر' })).not.toBeChecked();
  await card('شبانه').click({ position: { x: 20, y: 20 } });
  await expect(card('شبانه').locator('input')).toBeChecked();
  await expect(card('روزانه').locator('input')).not.toBeChecked();
  await chip('۳ تا ۶ سال').click();
  await expect(page.getByRole('checkbox', { name: '۳ تا ۶ سال' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'زیر ۱ سال' })).toBeChecked();
});

test('no horizontal scroll from 320px to 1920px', async ({ page }) => {
  for (const width of [320, 360, 390, 414, 600, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${width}px`).toBeLessThanOrEqual(0);
  }
});
