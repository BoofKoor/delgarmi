import { expect, test, type Locator, type Page } from '@playwright/test';
import { fakeKeyboard, setKeyboard } from './keyboard';

/*
 * The request form on a phone screen: what the bottom bar (and a sticky header) may cover.
 * Findings 1, 2 and 4 of the UI review (4 Aban 1405). Each check hit-tests the element on
 * screen (document.elementFromPoint), so it fails when the bar, the header or the edge of
 * the screen hides any part of it, whatever the z-index or the layout says.
 */

test.skip(({ isMobile }) => !isMobile, 'phone screens only');

const next = (page: Page) => page.getByRole('button', { name: 'مرحله‌ی بعد' }).click();
const pick = (page: Page, name: string, value: string) => page.locator(`label:has(> input[name="${name}"][value="${value}"])`).click();

/**
 * Which of five points of the element are hidden or off screen: the centre and the middle of
 * each edge, 3px inside. Not the corners: hit-testing follows border-radius, so a rounded
 * corner would always "miss" the element itself. A link that wraps onto two lines is tested
 * line by line (getClientRects): the box around both lines also covers words of the
 * sentence that are not the link.
 */
async function hiddenParts(target: Locator): Promise<string[]> {
  return target.evaluate((el) => {
    const out: string[] = [];
    const boxes = [...el.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    boxes.forEach((r, line) => {
      const inset = Math.min(3, r.width / 4, r.height / 4);
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const points: [string, number, number][] = [
        ['centre', cx, cy],
        ['top', cx, r.top + inset],
        ['bottom', cx, r.bottom - inset],
        ['start', r.right - inset, cy],
        ['end', r.left + inset, cy],
      ];
      const where = boxes.length > 1 ? ` of line ${line + 1}` : '';
      for (const [name, x, y] of points) {
        if (y < 0 || y > window.innerHeight || x < 0 || x > window.innerWidth) { out.push(`${name}${where} off screen (y=${Math.round(y)})`); continue; }
        const hit = document.elementFromPoint(x, y);
        if (!hit || !(hit === el || el.contains(hit))) out.push(`${name}${where} under ${hit ? `${hit.tagName.toLowerCase()}.${[...hit.classList].join('.')}` : 'nothing'} (y=${Math.round(y)})`);
      }
    });
    return out;
  });
}

/** From a service-page link to the contact step: the same clicks on the old and the new form. */
async function toContact(page: Page) {
  await page.goto('/request?service=therapy&for=self');
  await pick(page, 'session', 'online');
  await pick(page, 'gender', 'any');
  await next(page);
  await pick(page, 'start', 'tomorrow');
  await pick(page, 'time-window', 'night');
  await next(page);
  await expect(page.getByLabel('نام و نام خانوادگی')).toBeVisible();
}

/** Tab through the step; every control that gets focus must be wholly on screen and uncovered. */
async function tabThrough(page: Page, stops: number) {
  const problems: string[] = [];
  let checked = 0;
  for (let i = 0; i < stops; i++) {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    if (!(await focused.count())) continue;
    const what = await focused.evaluate((el) => `${el.tagName.toLowerCase()}${(el as HTMLInputElement).name ? `[name=${(el as HTMLInputElement).name}]` : ''} «${(el.getAttribute('aria-label') ?? (el as HTMLElement).innerText ?? '').trim().slice(0, 24)}»`);
    // Links and buttons of the bar itself are on top of it by definition.
    if (await focused.evaluate((el) => Boolean(el.closest('.form-nav')))) continue;
    checked += 1;
    for (const part of await hiddenParts(focused)) problems.push(`${what}: ${part}`);
  }
  expect(checked, 'focus stops checked').toBeGreaterThan(2);
  expect(problems).toEqual([]);
}

test('keyboard focus never sits under the bottom bar, 390×750 without errors', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 750 });
  await toContact(page);
  await page.getByLabel('نام و نام خانوادگی').fill('سارا محمدی');
  await page.getByLabel('نام و نام خانوادگی').focus();
  await tabThrough(page, 8);
});

test('keyboard focus never sits under the bottom bar, 390×844 with the errors shown', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await toContact(page);
  // Nothing filled in: the step shows its errors and puts the cursor on the first one.
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator('.dg-error').first()).toBeVisible();
  await page.getByLabel('نام و نام خانوادگی').focus();
  await tabThrough(page, 8);
});

test('the form fills the phone screen: full width, and the bar at the bottom edge on short steps too', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  const layout = async () => {
    await page.waitForTimeout(300);
    return page.evaluate(() => {
      const box = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      const bar = box('.form-nav');
      return { main: Math.round(box('.form-main').width), title: Math.round(box('.screen-title').width), bar: [Math.round(bar.left), Math.round(bar.right), Math.round(bar.bottom)] };
    });
  };
  // 390 minus the 16px gutter on each side; the bar runs edge to edge and sits on the bottom edge.
  const filled = { main: 358, title: 358, bar: [0, 390, 664] };
  await page.goto('/request?service=therapy&for=self');
  expect(await layout(), 'a short step, as the page opens').toEqual(filled);
  await pick(page, 'session', 'online');
  await pick(page, 'gender', 'any');
  await next(page);
  expect(await layout(), 'a short step after «مرحله‌ی بعد», scrolled to the question').toEqual(filled);
  await pick(page, 'start', 'tomorrow');
  await pick(page, 'time-window', 'night');
  await next(page);
  await expect(page.getByLabel('نام و نام خانوادگی')).toBeVisible();
  expect(await layout(), 'the contact step').toEqual(filled);
});

test('the bar steps aside while the keyboard is up, and comes back when it closes with the field still focused', async ({ page }) => {
  await fakeKeyboard(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await toContact(page);
  const bar = page.locator('.form-nav');
  const name = page.getByLabel('نام و نام خانوادگی');
  await name.focus();
  // A focused field with no keyboard on screen (a hardware keyboard, or the keyboard not up yet).
  await expect(bar).toBeVisible();
  await setKeyboard(page, 336);
  await expect(bar).toBeHidden();
  // Android's back button: the keyboard goes, the field keeps its focus.
  await setKeyboard(page, 0);
  await expect(name).toBeFocused();
  await expect(bar).toBeVisible();
  await expect(page.getByRole('button', { name: 'دریافت کد تأیید' })).toBeVisible();
});

test('the error of the service step can be read above the bottom bar on an iPhone 13', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await page.goto('/request');
  await next(page);
  const message = page.locator('#service-error');
  await expect(message).toBeVisible();
  // Give the page its scroll to the question first.
  await page.waitForTimeout(300);
  expect(await hiddenParts(message)).toEqual([]);
});

test('the city suggestions are not covered while the city is typed on an iPhone 13', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await page.goto('/request?service=elderly-care');
  await pick(page, 'for', 'mother');
  await pick(page, 'age', '75-84');
  await pick(page, 'mobility', 'assisted');
  await next(page);
  await pick(page, 'type', 'day');
  await pick(page, 'gender', 'any');
  await next(page);
  const field = page.getByRole('combobox', { name: 'شهر' });
  await field.click();
  await field.pressSequentially('یز', { delay: 50 });
  const options = page.getByRole('option');
  await expect(options.first()).toBeVisible();
  await page.waitForTimeout(300);
  const count = Math.min(await options.count(), 8);
  const problems: string[] = [];
  let shown = 0;
  for (let i = 0; i < count; i++) {
    const option = options.nth(i);
    // The list scrolls inside itself; an option scrolled out of the list is not the bar's fault.
    const insideList = await option.evaluate((el) => {
      const list = el.closest('[role="listbox"]')!.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return r.top >= list.top - 1 && r.bottom <= list.bottom + 1;
    });
    if (!insideList) continue;
    shown += 1;
    for (const part of await hiddenParts(option)) problems.push(`option ${i + 1}: ${part}`);
  }
  expect(shown, 'options shown in the list').toBeGreaterThanOrEqual(3);
  expect(problems).toEqual([]);
});
