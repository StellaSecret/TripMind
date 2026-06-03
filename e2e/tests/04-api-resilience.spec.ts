/**
 * API resilience — app must never crash or hang when external APIs fail.
 * All network calls are mocked. No @live → runs in CI.
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, mockGoodConditions, waitForExitLoading, clickTab } from './helpers';

async function fillAndClick(page: any, orig = 'Paris', dest = 'Lyon') {
  await page.locator(SEL.origInput).fill(orig);
  await page.locator(SEL.destInput).fill(dest);
  await page.locator(SEL.analyzeBtn).click();
}

test.describe('API resilience', () => {

  // ── Weather 500 ───────────────────────────────────────────────────────────

  test('weather 500 — app exits loading, does not hang', async ({ page }) => {
    await mockGoodConditions(page);
    await page.route(/api\.open-meteo\.com\/v1\/forecast/, r => r.fulfill({ status: 500, body: '' }));
    await gotoSearch(page);
    await fillAndClick(page);
    await waitForExitLoading(page, 12_000);
    await expect(page.locator(SEL.scrLoading)).not.toHaveClass(/\bon\b/);
  });

  // ── OSRM 503 ─────────────────────────────────────────────────────────────

  test('OSRM 503 — dashboard loads, route tab shows "indisponibles"', async ({ page }) => {
    await mockGoodConditions(page);
    await page.route(/router\.project-osrm\.org/, r => r.fulfill({ status: 503, body: '' }));
    await gotoSearch(page);
    await fillAndClick(page);
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    await clickTab(page, 'route');
    await expect(page.locator(SEL.tabContent)).toContainText('indisponibles');
  });

  // ── AQI 500 ───────────────────────────────────────────────────────────────

  test('AQI 500 — dashboard loads, air tab shows content without crashing', async ({ page }) => {
    await mockGoodConditions(page);
    await page.route(/air-quality-api\.open-meteo\.com/, r => r.fulfill({ status: 500, body: '' }));
    await gotoSearch(page);
    await fillAndClick(page);
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    await clickTab(page, 'air');
    const text = await page.locator(SEL.tabContent).textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
    expect(text).not.toContain('TypeError');
    expect(text).not.toContain('undefined');
  });

  // ── Transitous 429 ────────────────────────────────────────────────────────

  test('Transitous 429 — trains tab shows rate-limit message', async ({ page }) => {
    await mockGoodConditions(page);
    await page.route(/api\.transitous\.org/, r => r.fulfill({ status: 429, body: '' }));
    await gotoSearch(page);
    await fillAndClick(page);
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    await clickTab(page, 'trains');
    await expect(page.locator(SEL.tabContent)).toContainText('429');
  });

  // ── Transitous abort (timeout simulation) ────────────────────────────────

  test('Transitous abort — dashboard loads (trains are non-blocking)', async ({ page }) => {
    await mockGoodConditions(page);
    await page.route(/api\.transitous\.org/, r => r.abort());
    await gotoSearch(page);
    await fillAndClick(page);
    // Transitous has 12s timeout internally; abort resolves immediately
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 20_000 });
  });

  test('Transitous abort — trains tab shows error message not raw stack', async ({ page }) => {
    await mockGoodConditions(page);
    await page.route(/api\.transitous\.org/, r => r.abort());
    await gotoSearch(page);
    await fillAndClick(page);
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 20_000 });
    await clickTab(page, 'trains');
    const text = await page.locator(SEL.tabContent).textContent();
    expect(text).not.toContain('TypeError');
    expect(text).not.toContain('at Object.');   // no stack traces exposed to user
  });

  // ── BAN geocode failures ──────────────────────────────────────────────────

  test('BAN 500 — stays on search screen, shows error message', async ({ page }) => {
    await page.route(/api-adresse\.data\.gouv\.fr/, r => r.fulfill({ status: 500, body: '' }));
    await gotoSearch(page);
    await fillAndClick(page);
    await waitForExitLoading(page, 12_000);
    await expect(page.locator(SEL.scrSearch)).toHaveClass(/\bon\b/);
    await expect(page.locator(SEL.ebox)).not.toBeEmpty();
  });

  test('BAN empty features — shows error, not crash', async ({ page }) => {
    await page.route(/api-adresse\.data\.gouv\.fr/, r => r.fulfill({ json: { features: [] } }));
    await page.route(/nominatim\.openstreetmap\.org/, r => r.fulfill({ json: [] }));
    await gotoSearch(page);
    await fillAndClick(page);
    await waitForExitLoading(page, 12_000);
    await expect(page.locator(SEL.scrSearch)).toHaveClass(/\bon\b/);
    await expect(page.locator(SEL.ebox)).not.toBeEmpty();
  });

  // ── All APIs fail ─────────────────────────────────────────────────────────

  test('all APIs aborted — exits loading within 15s, does not hang', async ({ page }) => {
    await page.route(/api-adresse\.data\.gouv\.fr/, r => r.abort());
    await page.route(/api\.open-meteo\.com/, r => r.abort());
    await page.route(/air-quality-api\.open-meteo\.com/, r => r.abort());
    await page.route(/router\.project-osrm\.org/, r => r.abort());
    await page.route(/api\.transitous\.org/, r => r.abort());
    await gotoSearch(page);
    await fillAndClick(page);
    await waitForExitLoading(page, 15_000);
    await expect(page.locator(SEL.scrLoading)).not.toHaveClass(/\bon\b/);
  });

  // ── Loading step indicators ───────────────────────────────────────────────

  test('loading screen has 5 step indicators (s0–s4)', async ({ page }) => {
    await mockGoodConditions(page);
    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    // Click analyze and immediately check for steps before they finish
    await page.locator(SEL.analyzeBtn).click();
    // Steps should exist in DOM on loading screen
    for (let i = 0; i < 5; i++) {
      await expect(page.locator(`#s${i}`)).toBeAttached();
    }
    // Wait for completion
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
  });

  test('all step indicators reach "done" or "fail" state after analysis', async ({ page }) => {
    await mockGoodConditions(page);
    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    // After reaching dashboard, no step should still be "loading"
    for (let i = 0; i < 5; i++) {
      const cls = await page.locator(`#s${i}`).getAttribute('class');
      // Class should be "lstep done" or "lstep fail", not "lstep loading"
      expect(cls).not.toContain('loading');
    }
  });

  // ── HTTP header policy compliance ─────────────────────────────────────────
  // Browsers forbid setting User-Agent or Referer via fetch() — both are
  // overridden by the browser itself (Referer becomes the page origin,
  // User-Agent becomes the browser UA string). This is a browser security
  // constraint, not a bug in the app code.
  //
  // Transitous policy allows Referer as a fallback when User-Agent cannot be
  // set. In production (GitHub Pages), Transitous receives:
  //   Referer: https://stellasecret.github.io/TripMind/
  // which satisfies their policy. In tests the page runs at localhost, so
  // Referer is "http://localhost:3000/" — we verify it is present and non-empty.

  test('Transitous plan request sends a Referer header', async ({ page }) => {
    await mockGoodConditions(page);
    let capturedReferer: string | null = null;
    await page.route(/api\.transitous\.org\/api\/v1\/plan/, async route => {
      capturedReferer = route.request().headers()['referer'] ?? null;
      await route.fulfill({ status: 200, json: [] });
    });
    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    // Referer must be present and non-empty — the browser sets it to the page origin.
    expect(capturedReferer).not.toBeNull();
    expect(capturedReferer!.length).toBeGreaterThan(0);
  });

  test('Transitous geocode request sends a Referer header', async ({ page }) => {
    await mockGoodConditions(page);
    let capturedReferer: string | null = null;
    await page.route(/api\.transitous\.org\/api\/v1\/geocode/, async route => {
      capturedReferer = route.request().headers()['referer'] ?? null;
      await route.fulfill({ status: 200, json: [] });
    });
    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    expect(capturedReferer).not.toBeNull();
    expect(capturedReferer!.length).toBeGreaterThan(0);
  });

  test('Nominatim request sends a User-Agent header', async ({ page }) => {
    await mockGoodConditions(page);
    let capturedUA: string | null = null;
    await page.route(/nominatim\.openstreetmap\.org/, async route => {
      capturedUA = route.request().headers()['user-agent'] ?? null;
      await route.fulfill({ status: 200, json: [] });
    });
    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    // Nominatim is only called as a geocoding fallback — only assert if intercepted.
    // The browser sets User-Agent automatically; we verify it is present and non-empty.
    if (capturedUA !== null) {
      expect(capturedUA.length).toBeGreaterThan(0);
    }
  });
});
