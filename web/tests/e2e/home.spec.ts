import { expect, test } from '@playwright/test';

test('placeholder home page shows the brand and links to the components', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1, name: 'دلگرمی' })).toBeVisible();
  const families = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, ''));
  });
  expect(families).toContain('Pofak');
  await page.getByRole('link', { name: 'کامپوننت‌های سیستم طراحی' }).click();
  await expect(page).toHaveURL(/\/design-system$/);
});
