import { defineConfig, devices } from '@playwright/test';

// BASE_URL points the tests at a running stack (for example https://localhost behind nginx);
// without it they start `next start` themselves.
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    ignoreHTTPSErrors: Boolean(process.env.BASE_URL),
    locale: 'fa-IR',
    timezoneId: 'Asia/Tehran',
    trace: 'retain-on-failure',
  },
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'npm run start', url: baseURL, reuseExistingServer: !process.env.CI, timeout: 120_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
});
