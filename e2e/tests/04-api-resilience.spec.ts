/**
 * API resilience — app must not crash or hang when external APIs fail.
 * All tests use page.route() — no real network needed.
 * No @live → runs in CI offline suite.
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, mockAllApis, clickTab } from './helpers';

// Helpers
async function fillAndClick(page: any, orig = 'Paris', dest = 'Lyon') {
  await page.locator(SEL.origInput).fill(orig);
  await page.locator(SEL.destInput).fill(dest);
  await page.locator(SEL.analyzeBtn).click();
}

async function waitForExit(page: any, timeout = 12_000) {
  // Wait until loading screen is gone (either dash or search showed up)
  await page.waitForFunction(
    () => !document.getElementById('scr-loading')?.classList.contains('on'),
    { timeout }
  );
}

test.describe('API resilience — failure handling', () => {

  // ── Weather API fails ─────────────────────────────────────────────────────

  test('weather 500 — app shows dashboard with fallback data (not stuck)', async ({ page }) => {
    await mockAllApis(page);
    // Override weather with 500
    await page.route(/api\.open-meteo\.com\/v1\/forecast/, r => r.fulfill({ status: 500, body: '' }));

    await gotoSearch(page);
    await fillAndClick(page);
    // App uses fallback values on weather fail — should still reach dashboard
    await waitForExit(page);
    await expect(page.locator(SEL.scrLoading)).not.toHaveClass(/\bon\b/);
  });

  // ── OSRM fails ────────────────────────────────────────────────────────────

  test('OSRM 503 — dashboard loads, route tab shows "Données routières indisponibles"', async ({ page }) => {
    await mockAllApis(page);
    await page.route(/router\.project-osrm\.org/, r => r.fulfill({ status: 503, body: '' }));

    await gotoSearch(page);
    await fillAndClick(page);
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });

    await clickTab(page, 'route');
    await expect(page.locator(SEL.tabContent)).toContainText('indisponibles');
  });

  // ── AQI fails ─────────────────────────────────────────────────────────────

  test('AQI 500 — dashboard loads, air tab handles missing data gracefully', async ({ page }) => {
    await mockAllApis(page);
    await page.route(/air-quality-api\.open-meteo\.com/, r => r.fulfill({ status: 500, body: '' }));

    await gotoSearch(page);
    await fillAndClick(page);
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });

    await clickTab(page, 'air');
    const text = await page.locator(SEL.tabContent).textContent();
    // Should not throw — content must exist
    expect(text!.trim().length).toBeGreaterThan(0);
    expect(text).not.toContain('TypeError');
    expect(text).not.toContain('undefined');
  });

  // ── Transitous 429 ────────────────────────────────────────────────────────

  test('Transitous 429 — trains tab shows overload message', async ({ page }) => {
    await mockAllApis(page);
    await page.route(/api\.transitous\.org/, r => r.fulfill({ status: 429, body: '' }));

    await gotoSearch(page);
    await fillAndClick(page);
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });

    await clickTab(page, 'trains');
    const text = await page.locator(SEL.tabContent).textContent();
    // App checks for surchargé/timeout/limité in err message
    expect(text).toMatch(/429|limité|surchargé|surcharge|indisponible/i);
  });

  // ── Transitous network abort ──────────────────────────────────────────────

  test('Transitous abort — dashboard still loads (trains are non-blocking)', async ({ page }) => {
    await mockAllApis(page);
    await page.route(/api\.transitous\.org/, r => r.abort());

    await gotoSearch(page);
    await fillAndClick(page);
    // Transitous has a 12s timeout; with abort it resolves faster
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 20_000 });
  });

  // ── BAN geocode fails ─────────────────────────────────────────────────────

  test('BAN 500 — stays on search screen with error message', async ({ page }) => {
    await page.route(/api-adresse\.data\.gouv\.fr/, r => r.fulfill({ status: 500, body: '' }));

    await gotoSearch(page);
    await fillAndClick(page, 'Paris', 'Lyon', );
    await waitForExit(page);

    // Should return to search with error
    await expect(page.locator(SEL.scrSearch)).toHaveClass(/\bon\b/);
    const eboxText = await page.locator(SEL.ebox).textContent();
    expect(eboxText!.trim().length).toBeGreaterThan(0);
  });

  test('BAN returns empty features — shows error, not crash', async ({ page }) => {
    await page.route(/api-adresse\.data\.gouv\.fr/, r =>
      r.fulfill({ json: { features: [] } })
    );

    await gotoSearch(page);
    await fillAndClick(page);
    await waitForExit(page);

    await expect(page.locator(SEL.scrSearch)).toHaveClass(/\bon\b/);
    await expect(page.locator(SEL.ebox)).not.toBeEmpty();
  });

  // ── All APIs fail ─────────────────────────────────────────────────────────

  test('all APIs aborted — app exits loading within 15s, shows error', async ({ page }) => {
    await page.route(/api-adresse\.data\.gouv\.fr/, r => r.abort());
    await page.route(/api\.open-meteo\.com/, r => r.abort());
    await page.route(/air-quality-api\.open-meteo\.com/, r => r.abort());
    await page.route(/router\.project-osrm\.org/, r => r.abort());
    await page.route(/api\.transitous\.org/, r => r.abort());

    await gotoSearch(page);
    await fillAndClick(page);
    await waitForExit(page, 15_000);

    // Must not be stuck on loading screen
    await expect(page.locator(SEL.scrLoading)).not.toHaveClass(/\bon\b/);
  });
});
