import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,              // mocked tests never need retries
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    timezoneId: 'UTC',
  },

  projects: [
    // ── Offline/mocked — zero retries ──────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-android',
      use: { ...devices['Pixel 5'], hasTouch: true, isMobile: true },
    },
    // ── Live (real APIs) — 1 retry for flaky network ────
    {
      name: 'live-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
