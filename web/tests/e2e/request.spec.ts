import AxeBuilder from '@axe-core/playwright';
import { execSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import { fakeKeyboard, setKeyboard } from './keyboard';

/*
 * The request form against the real API. Until an SMS account exists the code only goes to the
 * API log (that is also how the owner reads it on the test server), so the tests that verify a
 * number read it from there: OTP_LOG_CMD prints the API log (CI: `docker compose logs api`).
 * Without it those tests are skipped.
 */

type CityItem = { code: string; name: string; province: string; slug: string | null; active: string[] };

const logCmd = process.env.OTP_LOG_CMD;
let counter = 0;

/** A fresh number per test, so the 2-minute resend wait of one test never blocks another. */
function freshMobile(): string {
  counter += 1;
  const tail = String((Date.now() + counter * 7919) % 10000).padStart(4, '0');
  const middle = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `0912${middle}${tail}`;
}

async function codeFromLog(mobile: string): Promise<string> {
  const masked = `${mobile.slice(0, 4)}\\*\\*\\*${mobile.slice(7)}`;
  const pattern = new RegExp(`OTP for ${masked}: (\\d{5})`, 'g');
  for (let i = 0; i < 20; i++) {
    const out = execSync(logCmd as string, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const found = [...out.matchAll(pattern)];
    if (found.length) return found[found.length - 1][1];
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no code in the log for ${mobile}`);
}

async function axe(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

const pick = (page: Page, name: string, value: string) => page.locator(`label:has(> input[name="${name}"][value="${value}"])`).click();
const next = (page: Page) => page.getByRole('button', { name: 'مرحله‌ی بعد' }).click();
const stepText = (page: Page) => page.locator('.dg-steps-text');
const faMobile = (m: string) => `${m.slice(0, 4)} ${m.slice(4, 7)} ${m.slice(7)}`.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

/**
 * A number inside Persian text must still read left to right, on one line: on screen its first
 * group (۰۹۱۲) sits left of its last one. A bare number in right-to-left text shows its groups
 * reversed, and may break between them.
 */
async function numberShown(page: Page, selector: string, mobile: string): Promise<string> {
  return page.locator(selector).first().evaluate((root, shown) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node as Text;
      const at = text.data.indexOf(shown);
      if (at < 0) continue;
      const box = (from: number, to: number) => {
        const range = document.createRange();
        range.setStart(text, at + from);
        range.setEnd(text, at + to);
        return range.getBoundingClientRect();
      };
      const first = box(0, 4);
      const last = box(9, 13);
      if (Math.abs(first.top - last.top) > 2) return 'broken across lines';
      return first.left < last.left ? 'left to right' : 'groups reversed';
    }
    throw new Error(`${shown} is not in ${root.outerHTML.slice(0, 200)}`);
  }, faMobile(mobile));
}

async function chooseCity(page: Page, typed: string, name: string) {
  await page.getByRole('combobox', { name: 'شهر' }).fill(typed);
  await page.getByRole('option', { name: new RegExp(`^${name}`) }).first().click();
}

/**
 * The contact step, then the code step (design system v8): the number, when to call and the
 * consent with one «دریافت کد تأیید», then the code on its own screen.
 */
async function contactAndCode(page: Page, mobile: string, bestTime: string) {
  await page.getByLabel('شماره‌ی موبایل').fill(mobile);
  await pick(page, 'best-time', bestTime);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'دریافت کد تأیید' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'کد تأیید را بنویسید' })).toBeVisible();
  const code = await codeFromLog(mobile);
  await page.getByLabel('کد ۵ رقمی').fill(code);
  await expect(page.getByText('شماره تأیید شد')).toBeVisible();
}

test('a link from a service page starts at step 2 with its option and city chosen', async ({ page, request }) => {
  const isfahan: CityItem = (await (await request.get('/api/cities')).json()).find((c: CityItem) => c.slug === 'isfahan');
  await page.goto(`/request?service=elderly-care&type=night&city=${isfahan.code}`);
  await expect(stepText(page)).toContainText('مرحله‌ی ۲ از ۴');
  await expect(page.getByRole('heading', { level: 2, name: 'درباره‌ی کسی که مراقبت لازم دارد' })).toBeVisible();
  await pick(page, 'for', 'mother');
  await pick(page, 'age', '75-84');
  await pick(page, 'mobility', 'assisted');
  await next(page);
  await expect(page.locator('input[name="type"][value="night"]')).toBeChecked();
  await pick(page, 'gender', 'any');
  await next(page);
  await expect(page.getByRole('combobox', { name: 'شهر' })).toHaveValue(isfahan.name);
  await expect(page.locator('#f-city-help')).toHaveText(`استان ${isfahan.province}`);
  // Back from the first screen shown goes to step 1, with the service still chosen.
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'قبلی' }).click();
  await expect(stepText(page)).toContainText('مرحله‌ی ۱ از ۴');
  await expect(page.locator('input[name="service"][value="elderly-care"]')).toBeChecked();
});

test('an address with an unknown service, option or city starts the form empty', async ({ page }) => {
  await page.goto('/request?service=massage&city=abc&type=night');
  await expect(stepText(page)).toContainText('مرحله‌ی ۱ از ۴');
  await expect(page.locator('input[name="service"]:checked')).toHaveCount(0);
});

test('each step says what is missing and puts the cursor there', async ({ page }) => {
  await page.goto('/request');
  await next(page);
  await expect(page.locator('#service-error')).toHaveText('هنوز خدمتی انتخاب نشده است. یکی از چهار خدمت را انتخاب کنید.');
  await expect(page.locator('input[name="service"]').first()).toBeFocused();
  await pick(page, 'service', 'child-care');
  await next(page);
  await expect(stepText(page)).toContainText('مرحله‌ی ۲ از ۴');
  await next(page);
  await expect(page.getByText('دست‌کم یک گزینه را انتخاب کنید.')).toBeVisible();
  await expect(page.locator('input[name="ages"]').first()).toBeFocused();
});

test('answers stay on the device when the page is closed, until «شروع از اول»', async ({ page }) => {
  await page.goto('/request?service=therapy');
  await pick(page, 'session', 'online');
  await pick(page, 'for', 'couple');
  await page.reload();
  await expect(page.getByText('پاسخ‌های قبلی‌تان سر جایشان است')).toBeVisible();
  await expect(page.locator('input[name="for"][value="couple"]')).toBeChecked();
  await page.getByRole('button', { name: 'شروع از اول' }).click();
  await expect(stepText(page)).toContainText('مرحله‌ی ۱ از ۴');
  await page.reload();
  await expect(page.getByText('پاسخ‌های قبلی‌تان سر جایشان است')).toHaveCount(0);
});

test('urgent home nursing shows the emergency numbers and does not ask a start day', async ({ page }) => {
  await page.goto('/request?service=home-nursing&task=injection');
  await expect(page.locator('input[name="tasks"][value="injection"]')).toBeChecked();
  await pick(page, 'order', 'yes');
  await next(page);
  await pick(page, 'timing', 'urgent');
  await expect(page.getByRole('link', { name: 'اورژانس ۱۱۵' })).toHaveAttribute('href', 'tel:115');
  await pick(page, 'gender', 'female');
  await next(page);
  await expect(page.getByRole('heading', { level: 2, name: 'در کدام شهر؟' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'از کی شروع شود؟' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'چه ساعتی مناسب است؟' })).toHaveCount(0);
  // From «where» the next screen is already the contact one.
  await chooseCity(page, 'اصفه', 'اصفهان');
  await next(page);
  await expect(page.getByRole('heading', { level: 2, name: 'با چه شماره‌ای تماس بگیریم؟' })).toBeVisible();
});

test('a waitlisted city: the notice, the button and the «ثبت شد» page say so', async ({ page, request }, info) => {
  test.skip(!logCmd, 'needs OTP_LOG_CMD to read the code');
  const cities: CityItem[] = await (await request.get('/api/cities')).json();
  const yazd = cities.find((c) => c.name === 'یزد' && c.province === 'یزد')!;
  expect(yazd.active).not.toContain('child-care');
  await page.goto('/request?service=child-care&hours=few');
  await page.getByRole('button', { name: 'یکی بیشتر' }).click();
  await pick(page, 'ages', '1-3');
  await pick(page, 'ages', '3-6');
  await next(page);
  await expect(page.locator('input[name="hours"][value="few"]')).toBeChecked();
  await pick(page, 'gender', 'female');
  await next(page);
  await chooseCity(page, 'یزد', 'یزد');
  await expect(page.getByText('هنوز در یزد مرکز همکار پرستار کودک نداریم')).toBeVisible();
  if (info.project.name === 'desktop') expect(await axe(page)).toEqual([]);
  await next(page);
  await expect(page.getByRole('heading', { level: 2, name: 'از کی شروع شود؟' })).toBeVisible();
  await pick(page, 'start', 'asap');
  await pick(page, 'time-window', 'evening');
  if (info.project.name === 'desktop') expect(await axe(page)).toEqual([]);
  await next(page);
  await page.getByLabel('نام و نام خانوادگی').fill('مریم احمدی');
  await contactAndCode(page, freshMobile(), 'morning');
  if (info.project.name === 'desktop') expect(await axe(page)).toEqual([]);
  await page.getByRole('button', { name: 'ثبت در لیست انتظار' }).click();
  await expect(page).toHaveURL(/\/request\/done\?code=\d{6}$/);
  await expect(page.getByRole('heading', { level: 1, name: 'در لیست انتظار ثبت شدید' })).toBeFocused();
  await expect(page.locator('.done-code')).toHaveText(/^[۰-۹]{6}$/);
  if (info.project.name === 'desktop') expect(await axe(page)).toEqual([]);
  // The draft is gone once the request is in.
  expect(await page.evaluate(() => localStorage.getItem('delgarmi-request-draft'))).toBeNull();
});

test('an active city and a start day from the calendar reach the team as «جدید»', async ({ page, request }, info) => {
  test.skip(!logCmd, 'needs OTP_LOG_CMD to read the code');
  const isfahan: CityItem = (await (await request.get('/api/cities')).json()).find((c: CityItem) => c.slug === 'isfahan');
  expect(isfahan.active).toContain('elderly-care');
  await page.goto('/request');
  await pick(page, 'service', 'elderly-care');
  await next(page);
  await pick(page, 'for', 'father');
  await pick(page, 'age', '85-plus');
  await pick(page, 'mobility', 'bedridden');
  await next(page);
  await pick(page, 'type', 'hourly');
  await pick(page, 'gender', 'male');
  await next(page);
  await chooseCity(page, 'اصفه', 'اصفهان');
  await expect(page.getByText('در اصفهان مرکز همکار داریم')).toBeVisible();
  await page.getByLabel('محله').fill('جلفا');
  await next(page);
  await pick(page, 'start', 'date');
  await page.locator('.dg-cal-day:not([disabled])').nth(3).click();
  await expect(page.locator('.start-picked')).toContainText('شروع:');
  await pick(page, 'time-window', 'morning');
  await next(page);
  await page.getByLabel('نام و نام خانوادگی').fill('علی رضایی');
  const mobile = freshMobile();
  await contactAndCode(page, mobile, 'any');
  if (info.project.name === 'desktop') expect(await numberShown(page, '.dg-summary', mobile), 'summary').toBe('left to right');
  await page.getByRole('button', { name: 'ثبت درخواست' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'درخواست شما ثبت شد' })).toBeVisible();
  await expect(page.locator('.lead')).toContainText(faMobile(mobile));
  expect(await numberShown(page, '.lead', mobile), 'done page').toBe('left to right');
});

test('online therapy asks no city, and a wrong code shows the design-system notice', async ({ page }) => {
  test.skip(!logCmd, 'needs OTP_LOG_CMD to read the code');
  await page.goto('/request?service=therapy&for=self');
  await pick(page, 'session', 'online');
  await pick(page, 'gender', 'any');
  await next(page);
  await expect(page.getByRole('heading', { level: 2, name: 'از کی شروع کنیم؟' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'شهر' })).toHaveCount(0);
  await pick(page, 'start', 'tomorrow');
  await pick(page, 'time-window', 'night');
  await next(page);
  await page.getByLabel('نام و نام خانوادگی').fill('سارا محمدی');
  const mobile = freshMobile();
  await page.getByLabel('شماره‌ی موبایل').fill(mobile);
  await pick(page, 'best-time', 'evening');
  await page.getByRole('checkbox').check();
  // One main action per step: before the number is checked the bar asks for the code.
  await expect(page.getByRole('button', { name: 'ثبت درخواست' })).toHaveCount(0);
  await page.getByRole('button', { name: 'دریافت کد تأیید' }).click();
  await expect(page.locator('#code-sent')).toContainText(faMobile(mobile));
  expect(await numberShown(page, '#code-sent', mobile), '«کد ۵ رقمی به … پیامک شد»').toBe('left to right');
  // «ثبت درخواست» before the code: the field says what is missing.
  await page.getByRole('button', { name: 'ثبت درخواست' }).click();
  await expect(page.getByText('کد ۵ رقمی پیامک‌شده را وارد کنید.')).toBeVisible();
  const code = await codeFromLog(mobile);
  const wrong = code === '11111' ? '22222' : '11111';
  await page.getByLabel('کد ۵ رقمی').fill(wrong);
  await expect(page.locator('#f-code-error')).toHaveText('کد تأیید درست نیست. کد را دوباره وارد کنید یا کد جدید بخواهید.');
  await page.getByLabel('کد ۵ رقمی').fill(code);
  await expect(page.getByText('شماره تأیید شد')).toBeVisible();
  await page.getByRole('button', { name: 'ثبت درخواست' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'درخواست شما ثبت شد' })).toBeVisible();
});

test('on a phone, «ثبت درخواست» comes back as soon as the code is verified, keyboard still up', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the bar sticks only on phones');
  test.skip(!logCmd, 'needs OTP_LOG_CMD to read the code');
  await fakeKeyboard(page);
  await page.goto('/request?service=therapy&for=self');
  await pick(page, 'session', 'online');
  await pick(page, 'gender', 'any');
  await next(page);
  await pick(page, 'start', 'tomorrow');
  await pick(page, 'time-window', 'night');
  await next(page);
  await page.getByLabel('نام و نام خانوادگی').fill('سارا محمدی');
  const mobile = freshMobile();
  await page.getByLabel('شماره‌ی موبایل').fill(mobile);
  await pick(page, 'best-time', 'evening');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'دریافت کد تأیید' }).click();
  const field = page.getByLabel('کد ۵ رقمی');
  await field.focus();
  await setKeyboard(page, 336);
  await expect(page.locator('.form-nav')).toBeHidden();
  await field.fill(await codeFromLog(mobile));
  await expect(page.getByText('شماره تأیید شد')).toBeVisible();
  // The field is read-only now and keeps the focus; the keyboard has not been closed.
  await expect(field).toBeFocused();
  await page.getByRole('button', { name: 'ثبت درخواست' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'درخواست شما ثبت شد' })).toBeVisible();
});

test('the form never scrolls sideways, from 320 to 1920 pixels', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'widths are set by hand here');
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/request?service=elderly-care');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${width}px`).toBe(0);
  }
});
