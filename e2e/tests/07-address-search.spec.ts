/**
 * 07-address-search.spec.ts
 *
 * Tests for the address-level search feature.
 * Autocomplete now uses type=housenumber → full addresses, not just city names.
 *
 * No @live → offline, all BAN calls mocked.
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, mockGoodConditions, runMockedAnalysis, banAddressMock } from './helpers';

// ── Mock: autocomplete returns full address suggestions ───────────────────────

const ADDRESS_SUGGESTIONS = [
  { label: '15 Rue de Rivoli, Paris',        city: 'Paris', lat: 48.8566, lon: 2.3510 },
  { label: '15 Rue de la Paix, Paris',        city: 'Paris', lat: 48.8694, lon: 2.3312 },
  { label: '15 Avenue des Champs-Élysées, Paris', city: 'Paris', lat: 48.8726, lon: 2.3020 },
];

async function mockAutocomplete(page: any) {
  await page.route(/api-adresse\.data\.gouv\.fr.*q=.*15.*[Pp]aris/, route =>
    route.fulfill({ json: { features: ADDRESS_SUGGESTIONS.map(s => ({
      geometry: { coordinates: [s.lon, s.lat] },
      properties: { label: s.label, name: s.label.split(',')[0], city: s.city,
                    context: '75, Paris, Île-de-France', type: 'housenumber' }
    }))}})
  );
}

// ── Autocomplete displays full addresses ──────────────────────────────────────

test.describe('Address autocomplete — full address display', () => {

  test.beforeEach(async ({ page }) => {
    await gotoSearch(page);
  });

  test('autocomplete shows full address labels not just city names', async ({ page }) => {
    await mockAutocomplete(page);
    await page.locator(SEL.origInput).fill('15 Rue de Rivoli Paris');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 5_000 });
    const firstItem = page.locator(`${SEL.origAc} .ac-item`).first();
    // Should show the full address, not just "Paris"
    await expect(firstItem.locator('.ac-city')).toContainText('Rue de Rivoli');
  });

  test('autocomplete shows multiple address suggestions', async ({ page }) => {
    await mockAutocomplete(page);
    await page.locator(SEL.origInput).fill('15 Rue de Rivoli Paris');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 5_000 });
    const items = page.locator(`${SEL.origAc} .ac-item`);
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('selecting a full address suggestion fills input with the full label', async ({ page }) => {
    await mockAutocomplete(page);
    await page.locator(SEL.origInput).fill('15 Rue de Rivoli Paris');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 5_000 });
    await page.locator(`${SEL.origAc} .ac-item`).first().click();
    const value = await page.locator(SEL.origInput).inputValue();
    // Should be the full label, not just the city
    expect(value).toContain('Rivoli');
    expect(value.length).toBeGreaterThan(5);
  });

  test('selecting suggestion via Enter fills full address label', async ({ page }) => {
    await mockAutocomplete(page);
    await page.locator(SEL.origInput).fill('15 Rue de Rivoli Paris');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 5_000 });
    await page.locator(SEL.origInput).press('ArrowDown');
    await page.locator(SEL.origInput).press('Enter');
    const value = await page.locator(SEL.origInput).inputValue();
    expect(value.length).toBeGreaterThan(5);
  });

  test('different addresses in same city show distinct suggestions', async ({ page }) => {
    await mockAutocomplete(page);
    await page.locator(SEL.origInput).fill('15 Rue de Rivoli Paris');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 5_000 });
    const items = page.locator(`${SEL.origAc} .ac-item`);
    const first  = await items.nth(0).locator('.ac-city').textContent();
    const second = await items.nth(1).locator('.ac-city').textContent();
    // Two distinct street addresses should differ
    expect(first).not.toBe(second);
  });
});

// ── Analysis with precise addresses ──────────────────────────────────────────

test.describe('Analysis with full address inputs', () => {

  test('analysis works with a full street address as origin', async ({ page }) => {
    // Mock geocode for a full address
    await page.route(/api-adresse\.data\.gouv\.fr.*q=.*Rivoli/, banAddressMock(
      '15 Rue de Rivoli, Paris', 'Paris', 48.8566, 2.3510
    ));
    await mockGoodConditions(page);
    // Override the Paris geocode with an address-level one
    await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Ll]yon/,
      banAddressMock('Lyon', 'Lyon', 45.7640, 4.8357)
    );

    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('15 Rue de Rivoli, Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
  });

  test('two addresses in the same city produce a short distance', async ({ page }) => {
    // North Paris → South Paris, ~12 km
    await page.route(/api-adresse\.data\.gouv\.fr.*q=.*Montmartre/,
      banAddressMock('Place du Tertre, Montmartre, Paris', 'Paris', 48.8865, 2.3410)
    );
    await page.route(/api-adresse\.data\.gouv\.fr.*q=.*Denfert/,
      banAddressMock('Place Denfert-Rochereau, Paris', 'Paris', 48.8339, 2.3325)
    );
    // Short OSRM distance
    await page.route(/api\.open-meteo\.com\/v1\/forecast/, route => route.fulfill({ json: {
      current: { temperature_2m: 20, apparent_temperature: 18, relative_humidity_2m: 55, wind_speed_10m: 12, weather_code: 0, cloud_cover: 10 },
      daily: { temperature_2m_max: Array(16).fill(22), temperature_2m_min: Array(16).fill(12), uv_index_max: Array(16).fill(3), precipitation_probability_max: Array(16).fill(10), weather_code: Array(16).fill(0), wind_speed_10m_max: Array(16).fill(15) }
    }}));
    await page.route(/air-quality-api\.open-meteo\.com/, route => route.fulfill({ json: { hourly: { european_aqi: Array(48).fill(20), pm2_5: Array(48).fill(5), pm10: Array(48).fill(10), nitrogen_dioxide: Array(48).fill(8), ozone: Array(48).fill(50), alder_pollen: Array(48).fill(0), birch_pollen: Array(48).fill(0), grass_pollen: Array(48).fill(0), mugwort_pollen: Array(48).fill(0), olive_pollen: Array(48).fill(0) } }}));
    await page.route(/router\.project-osrm\.org/, route => route.fulfill({ json: { routes: [{ distance: 12000, duration: 1800 }] } }));
    await page.route(/api\.transitous\.org/, route => route.fulfill({ json: { itineraries: [] } }));

    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('Place du Tertre, Montmartre, Paris');
    await page.locator(SEL.destInput).fill('Place Denfert-Rochereau, Paris');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });

    // Route tab should show ~12 km
    await page.locator('.tab[data-tab="route"]').click();
    await expect(page.locator(SEL.tabContent)).toContainText('12');
  });

  test('city pills show truncated address label on dashboard', async ({ page }) => {
    await mockGoodConditions(page);
    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    // City pills should show something (not blank)
    const orig = await page.locator(SEL.dOrig).textContent();
    const dest = await page.locator(SEL.dDest).textContent();
    expect(orig!.trim().length).toBeGreaterThan(0);
    expect(dest!.trim().length).toBeGreaterThan(0);
  });
});

// ── Swap preserves full address ───────────────────────────────────────────────

test.describe('Swap with full addresses', () => {

  test('swap preserves the full address label in both fields', async ({ page }) => {
    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('15 Rue de Rivoli, Paris');
    await page.locator(SEL.destInput).fill('Place Bellecour, Lyon');
    await page.locator(SEL.swapBtn).click();
    await expect(page.locator(SEL.origInput)).toHaveValue('Place Bellecour, Lyon');
    await expect(page.locator(SEL.destInput)).toHaveValue('15 Rue de Rivoli, Paris');
  });
});
