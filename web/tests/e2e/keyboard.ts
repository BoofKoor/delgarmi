import type { Page } from '@playwright/test';

/**
 * A phone keyboard for the tests. Playwright's phones have none, so this stands in for
 * window.visualViewport: a keyboard shrinks its height and leaves the layout as it is (Chrome on
 * Android since 108, like Safari on iOS). Call before the page loads; then `setKeyboard(page, 336)`
 * opens one and `setKeyboard(page, 0)` closes it and leaves the focus where it was, as Android's
 * back button does.
 */
export async function fakeKeyboard(page: Page) {
  await page.addInitScript(() => {
    const real = window.visualViewport;
    if (!real) return;
    let covered = 0;
    const fake = new EventTarget();
    for (const key of ['width', 'scale', 'offsetLeft', 'offsetTop', 'pageLeft', 'pageTop'] as const) {
      Object.defineProperty(fake, key, { get: () => real[key] });
    }
    Object.defineProperty(fake, 'height', { get: () => real.height - covered / real.scale });
    real.addEventListener('resize', () => fake.dispatchEvent(new Event('resize')));
    real.addEventListener('scroll', () => fake.dispatchEvent(new Event('scroll')));
    Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => fake });
    Object.defineProperty(window, '__keyboard', {
      value: (px: number) => {
        covered = px;
        fake.dispatchEvent(new Event('resize'));
      },
    });
  });
}

export async function setKeyboard(page: Page, px: number) {
  await page.evaluate((h) => (window as unknown as { __keyboard: (px: number) => void }).__keyboard(h), px);
}
