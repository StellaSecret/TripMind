/**
 * Station picker — appears after city selection, station coords used in analysis.
 * Mocked for Transitous geocode + station search.
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, mockGoodConditions } from './helpers';

const ETAMPES_STATIONS = [
  { type: 'STOP', name: 'Étampes', lat: 48.4344, lon: 2.1614, country: 'FR' },
  { type: 'STOP', name: 'Saint-Martin d\'Étampes', lat: 48.4280, lon: 2.1620, country: 'FR' },
];

const PARIS_STATIONS = [
  { type: 'STOP', name: 'Paris Gare de Lyon', lat: 48.8449, lon: 2.3735, country: 'FR' },
  { type: 'STOP', name: 'Paris Gare du Nord', lat: 48.8809, lon: 2.3553, country: 'FR' },
  { type: 'STOP', name: 'Paris Montparnasse', lat: 48.8409, lon: 2.3195, country: 'FR' },
];

async function mockStations(page: any) {
  await page.route(/api\.transitous\.org\/api\/v1\/geocode.*Étampes|Etampes/i,
    (r: any) => r.fulfill({ json: ETAMPES_STATIONS }));
  await page.route(/api\.transitous\.org\/api\/v1\/geocode.*[Pp]aris/,
    (r: any) => r.fulfill({ json: PARIS_STATIONS }));
}

test.describe('Station picker — appears after city selection', () => {

  test('station picker appears after selecting a city from autocomplete', async ({ page }) => {
    await mockStations(page);
    await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Pp]aris/,
      (r: any) => r.fulfill({ json: { features: [{ geometry: { coordinates: [2.3488, 48.8534] },
        properties: { city: 'Paris', name: 'Paris', label: 'Paris (75)', context: '75, Paris' } }] } }));
    await page.route(/nominatim\.openstreetmap\.org/, (r: any) => r.fulfill({ json: [] }));
    await gotoSearch(page);

    await page.locator(SEL.origInput).fill('Paris');
    await page.waitForTimeout(500);

    // Simulate clicking the first autocomplete suggestion
    await expect(page.locator('#orig-ac')).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator('#orig-ac .ac-item').first().click();

    // Station picker should appear
    await expect(page.locator('#orig-inp-stations')).toBeVisible({ timeout: 5_000 });
  });

  test('station picker shows city center option', async ({ page }) => {
    await mockStations(page);
    await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Pp]aris/,
      (r: any) => r.fulfill({ json: { features: [{ geometry: { coordinates: [2.3488, 48.8534] },
        properties: { city: 'Paris', name: 'Paris', label: 'Paris (75)', context: '75' } }] } }));
    await page.route(/nominatim\.openstreetmap\.org/, (r: any) => r.fulfill({ json: [] }));
    await gotoSearch(page);

    await page.locator(SEL.origInput).fill('Paris');
    await page.waitForTimeout(500);
    await expect(page.locator('#orig-ac')).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator('#orig-ac .ac-item').first().click();

    await expect(page.locator('#orig-inp-stations')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('#orig-inp-stations .station-btn').first()).toContainText(/Centre|City center/i);
  });

  test('station picker shows Transitous stops', async ({ page }) => {
    await mockStations(page);
    await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Pp]aris/,
      (r: any) => r.fulfill({ json: { features: [{ geometry: { coordinates: [2.3488, 48.8534] },
        properties: { city: 'Paris', name: 'Paris', label: 'Paris (75)', context: '75' } }] } }));
    await page.route(/nominatim\.openstreetmap\.org/, (r: any) => r.fulfill({ json: [] }));
    await gotoSearch(page);

    await page.locator(SEL.origInput).fill('Paris');
    await page.waitForTimeout(500);
    await expect(page.locator('#orig-ac')).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator('#orig-ac .ac-item').first().click();

    await expect(page.locator('#orig-inp-stations')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('#orig-inp-stations')).toContainText('Paris Gare de Lyon');
    await expect(page.locator('#orig-inp-stations')).toContainText('Paris Gare du Nord');
  });

  test('selecting a station fills input with station name', async ({ page }) => {
    await mockStations(page);
    await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Pp]aris/,
      (r: any) => r.fulfill({ json: { features: [{ geometry: { coordinates: [2.3488, 48.8534] },
        properties: { city: 'Paris', name: 'Paris', label: 'Paris (75)', context: '75' } }] } }));
    await page.route(/nominatim\.openstreetmap\.org/, (r: any) => r.fulfill({ json: [] }));
    await gotoSearch(page);

    await page.locator(SEL.origInput).fill('Paris');
    await page.waitForTimeout(500);
    await expect(page.locator('#orig-ac')).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator('#orig-ac .ac-item').first().click();

    await expect(page.locator('#orig-inp-stations')).toBeVisible({ timeout: 5_000 });
    await page.locator('#orig-inp-stations .station-btn').nth(1).click(); // first station (after city center)
    await expect(page.locator(SEL.origInput)).toHaveValue('Paris Gare de Lyon');
  });

  test('selected station button gets active class', async ({ page }) => {
    await mockStations(page);
    await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Pp]aris/,
      (r: any) => r.fulfill({ json: { features: [{ geometry: { coordinates: [2.3488, 48.8534] },
        properties: { city: 'Paris', name: 'Paris', label: 'Paris (75)', context: '75' } }] } }));
    await page.route(/nominatim\.openstreetmap\.org/, (r: any) => r.fulfill({ json: [] }));
    await gotoSearch(page);

    await page.locator(SEL.origInput).fill('Paris');
    await page.waitForTimeout(500);
    await expect(page.locator('#orig-ac')).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator('#orig-ac .ac-item').first().click();

    await expect(page.locator('#orig-inp-stations')).toBeVisible({ timeout: 5_000 });
    const stationBtn = page.locator('#orig-inp-stations .station-btn').nth(1);
    await stationBtn.click();
    await expect(stationBtn).toHaveClass(/active/);
  });
});

test.describe('Station picker — hidden when no stations found', () => {

  test('station picker stays hidden when Transitous returns no stops', async ({ page }) => {
    // Transitous returns only PLACE type, no STOP
    await page.route(/api\.transitous\.org\/api\/v1\/geocode/,
      (r: any) => r.fulfill({ json: [{ type: 'PLACE', name: 'Paris', lat: 48.85, lon: 2.35, country: 'FR' }] }));
    await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Pp]aris/,
      (r: any) => r.fulfill({ json: { features: [{ geometry: { coordinates: [2.3488, 48.8534] },
        properties: { city: 'Paris', name: 'Paris', label: 'Paris (75)', context: '75' } }] } }));
    await page.route(/nominatim\.openstreetmap\.org/, (r: any) => r.fulfill({ json: [] }));
    await gotoSearch(page);

    await page.locator(SEL.origInput).fill('Paris');
    await page.waitForTimeout(500);
    await expect(page.locator('#orig-ac')).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator('#orig-ac .ac-item').first().click();

    await page.waitForTimeout(1000);
    const picker = page.locator('#orig-inp-stations');
    const visible = await picker.isVisible().catch(() => false);
    expect(visible).toBe(false);
  });
});

test.describe('Autocomplete debounce and abort', () => {

  test('rapid typing only triggers one request — last query wins', async ({ page }) => {
    let requestCount = 0;
    // Count how many geocode requests reach Transitous
    await page.route(/api\.transitous\.org\/api\/v1\/geocode/, async route => {
      requestCount++;
      await route.fulfill({ json: [] });
    });
    await page.route(/api-adresse\.data\.gouv\.fr/, r => r.fulfill({ json: { features: [] } }));
    await page.route(/nominatim\.openstreetmap\.org/, r => r.fulfill({ json: [] }));
    await gotoSearch(page);

    // Type quickly — each char fires within the 350ms debounce window
    const inp = page.locator(SEL.origInput);
    await inp.pressSequentially('Paris', { delay: 30 });

    // Wait for debounce to fire and requests to complete
    await page.waitForTimeout(800);

    // With 350ms debounce, rapid typing should collapse to a single request (or very few)
    // rather than one per character (5 chars = up to 5 requests without debounce)
    expect(requestCount).toBeLessThan(3);
  });

  test('stale response from aborted request does not overwrite current results', async ({ page }) => {
    let resolveFirst: () => void;
    const firstRequestHeld = new Promise<void>(res => { resolveFirst = res; });

    let requestIndex = 0;
    await page.route(/api\.transitous\.org\/api\/v1\/geocode/, async route => {
      const thisIndex = ++requestIndex;
      if (thisIndex === 1) {
        // Hold first request until second has already resolved
        await firstRequestHeld;
        await route.fulfill({ json: [
          { type: 'STOP', name: 'STALE_RESULT', lat: 48.8, lon: 2.3, country: 'FR', areas: [] }
        ]});
      } else {
        await route.fulfill({ json: [
          { type: 'STOP', name: 'Paris Gare de Lyon', lat: 48.8449, lon: 2.3735, country: 'FR', areas: [] }
        ]});
        resolveFirst!(); // release the stale first request after second has resolved
      }
    });
    await page.route(/api-adresse\.data\.gouv\.fr/, r => r.fulfill({ json: { features: [] } }));
    await page.route(/nominatim\.openstreetmap\.org/, r => r.fulfill({ json: [] }));
    await gotoSearch(page);

    const inp = page.locator(SEL.origInput);
    // First query — triggers first (slow) request
    await inp.fill('pa');
    await page.waitForTimeout(400); // let debounce fire

    // Second query — triggers second (fast) request; first is still in flight
    await inp.fill('paris');
    await page.waitForTimeout(800); // let both requests resolve

    // The dropdown must show the second query's result, not STALE_RESULT
    const items = page.locator(`${SEL.origAc} .ac-item`);
    const count = await items.count();
    if (count > 0) {
      const text = await page.locator(SEL.origAc).textContent();
      expect(text).not.toContain('STALE_RESULT');
    }
  });
});
