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
    await page.waitForTimeout(400);

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
    await page.waitForTimeout(400);
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
    await page.waitForTimeout(400);
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
    await page.waitForTimeout(400);
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
    await page.waitForTimeout(400);
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
    await page.waitForTimeout(400);
    await expect(page.locator('#orig-ac')).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator('#orig-ac .ac-item').first().click();

    await page.waitForTimeout(1000);
    const picker = page.locator('#orig-inp-stations');
    const visible = await picker.isVisible().catch(() => false);
    expect(visible).toBe(false);
  });
});
