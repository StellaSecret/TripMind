/**
 * Autocomplete — BAN real network calls
 * Tagged @live → skipped in CI, run locally or in nightly job
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch } from './helpers';

test.describe('Autocomplete — BAN @live', () => {

  test.beforeEach(async ({ page }) => {
    await gotoSearch(page);
  });

  test('2+ chars in origin shows suggestions @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Pa');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await expect(page.locator(`${SEL.origAc} .ac-item`)).not.toHaveCount(0);
  });

  test('suggestion item contains city name @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Lyon');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await expect(page.locator(`${SEL.origAc} .ac-item .ac-city`).first()).toContainText('Lyon');
  });

  test('single char does NOT trigger suggestions @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('P');
    await page.waitForTimeout(600); // must exceed 350ms debounce + render margin
    await expect(page.locator(SEL.origAc)).not.toHaveClass(/visible/);
  });

  test('clicking a suggestion fills input and closes list @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Borde');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator(`${SEL.origAc} .ac-item`).first().click();
    await expect(page.locator(SEL.origAc)).not.toHaveClass(/visible/);
    const val = await page.locator(SEL.origInput).inputValue();
    expect(val.length).toBeGreaterThan(0);
  });

  test('Escape closes the list @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Toulouse');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator(SEL.origInput).press('Escape');
    await expect(page.locator(SEL.origAc)).not.toHaveClass(/visible/);
  });

  test('ArrowDown selects first item, Enter fills input @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Nantes');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator(SEL.origInput).press('ArrowDown');
    await expect(page.locator(`${SEL.origAc} .ac-item.selected`)).toHaveCount(1);
    await page.locator(SEL.origInput).press('Enter');
    await expect(page.locator(SEL.origAc)).not.toHaveClass(/visible/);
    const val = await page.locator(SEL.origInput).inputValue();
    expect(val.length).toBeGreaterThan(0);
  });

  test('origin input has aria-expanded="true" when list is open @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Lille');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await expect(page.locator(SEL.origInput)).toHaveAttribute('aria-expanded', 'true');
  });

  test('destination field also triggers suggestions @live', async ({ page }) => {
    await page.locator(SEL.destInput).fill('Mar');
    await expect(page.locator(SEL.destAc)).toHaveClass(/visible/, { timeout: 6_000 });
  });

  test('blurring origin closes list @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Stras');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator(SEL.destInput).click(); // blur origin
    await page.waitForTimeout(400);
    await expect(page.locator(SEL.origAc)).not.toHaveClass(/visible/);
  });

});

/**
 * Station direct search — mocked Transitous, no network required, runs in CI.
 */
import { test as stationTest, expect as stationExpect } from '@playwright/test';

stationTest.describe('Autocomplete — station direct search', () => {

  const MOCK_STOPS = [
    { type: 'STOP', name: 'Paris-Austerlitz', lat: 48.8432, lon: 2.3652, country: 'FR', areas: [] },
    { type: 'STOP', name: 'Paris-Gare-de-Lyon', lat: 48.8448, lon: 2.3735, country: 'FR', areas: [] },
  ];

  stationTest('typing a station name shows stop suggestions in dropdown', async ({ page }) => {
    await page.route(/api\.transitous\.org\/api\/v1\/geocode/, r =>
      r.fulfill({ json: MOCK_STOPS }));
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(baseUrl + '/app.html');
    await page.locator(SEL.origInput).fill('paris aust');
    await stationExpect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 4_000 });
    await stationExpect(page.locator(`${SEL.origAc} .ac-item-stop`)).not.toHaveCount(0);
  });

  stationTest('stop items appear below a "Gares" separator', async ({ page }) => {
    await page.route(/api\.transitous\.org\/api\/v1\/geocode/, r =>
      r.fulfill({ json: MOCK_STOPS }));
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(baseUrl + '/app.html');
    await page.locator(SEL.origInput).fill('paris aust');
    await stationExpect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 4_000 });
    const sep = page.locator(`${SEL.origAc} .ac-separator`);
    await stationExpect(sep).toBeVisible();
  });

  stationTest('clicking a stop suggestion fills input and sets station coords', async ({ page }) => {
    await page.route(/api\.transitous\.org\/api\/v1\/geocode/, r =>
      r.fulfill({ json: MOCK_STOPS }));
    // Also mock BAN so no real network needed
    await page.route(/api-adresse\.data\.gouv\.fr/, r =>
      r.fulfill({ json: { features: [] } }));
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(baseUrl + '/app.html');
    await page.locator(SEL.origInput).fill('paris aust');
    await stationExpect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 4_000 });
    await page.locator(`${SEL.origAc} .ac-item-stop`).first().click();
    // Dropdown must close after selection
    await stationExpect(page.locator(SEL.origAc)).not.toHaveClass(/visible/);
    // Input must be filled with the station name
    const val = await page.locator(SEL.origInput).inputValue();
    stationExpect(val).toContain('Austerlitz');
  });

  stationTest('selecting a stop directly skips the secondary station sub-picker', async ({ page }) => {
    await page.route(/api\.transitous\.org\/api\/v1\/geocode/, r =>
      r.fulfill({ json: MOCK_STOPS }));
    await page.route(/api-adresse\.data\.gouv\.fr/, r =>
      r.fulfill({ json: { features: [] } }));
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(baseUrl + '/app.html');
    await page.locator(SEL.origInput).fill('paris aust');
    await stationExpect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 4_000 });
    await page.locator(`${SEL.origAc} .ac-item-stop`).first().click();
    // Station sub-picker must NOT appear — station was already selected directly
    const picker = page.locator('#orig-inp-stations');
    const isVisible = await picker.isVisible().catch(() => false);
    stationExpect(isVisible).toBe(false);
  });
});
