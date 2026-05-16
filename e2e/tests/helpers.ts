import { Page, expect } from '@playwright/test';

// ── Selectors — verified against index.html ───────────────────────────────────
export const SEL = {
  scrSearch:    '#scr-search',
  scrSettings:  '#scr-settings',
  scrLoading:   '#scr-loading',
  scrDash:      '#scr-dash',

  origInput:    '#orig-inp',
  destInput:    '#dest-inp',
  origAc:       '#orig-ac',
  destAc:       '#dest-ac',
  swapBtn:      '#swap-btn',
  analyzeBtn:   '#analyze-btn',
  ebox:         '#ebox',
  datePicker:   '#date-picker',
  dateLabel:    '#selected-date-label',
  goSettings:   '#go-settings',
  settingsBack: '#settings-back',

  dOrig:        '#d-orig',
  dDest:        '#d-dest',
  dashDateLabel:'#dash-date-label',
  scoreCirc:    '#score-circ',
  scoreLbl:     '#score-lbl',
  scoreDetail:  '#score-detail',
  backBtn:      '#back-btn',
  settingsIcon: '#settings-icon',
  tabContent:   '#tab-content',

  tabs:         '.tab',
  tabOverview:  '.tab[data-tab="overview"]',
  tabRoute:     '.tab[data-tab="route"]',
  tabAir:       '.tab[data-tab="air"]',
  tabSante:     '.tab[data-tab="sante"]',
  tabTrains:    '.tab[data-tab="trains"]',
};

// ── Navigation helpers ────────────────────────────────────────────────────────

export async function gotoSearch(page: Page) {
  await page.goto('/');
  await expect(page.locator(SEL.scrSearch)).toHaveClass(/\bon\b/);
}

export async function clickTab(page: Page, name: string) {
  await page.locator(`.tab[data-tab="${name}"]`).click();
  await page.waitForTimeout(200);
}

// ── Shared geocode mocks ──────────────────────────────────────────────────────

function banParis(route: any) {
  route.fulfill({ json: { features: [{ geometry: { coordinates: [2.3488, 48.8534] }, properties: { city: 'Paris', name: 'Paris', context: '75, Paris, Île-de-France' } }] } });
}
function banLyon(route: any) {
  route.fulfill({ json: { features: [{ geometry: { coordinates: [4.8357, 45.7640] }, properties: { city: 'Lyon', name: 'Lyon', context: '69, Rhône, Auvergne-Rhône-Alpes' } }] } });
}
const OSRM_462 = { routes: [{ distance: 462000, duration: 14400 }] };
const TRAINS_EMPTY = { itineraries: [] };

// ── Score scenario mocks ──────────────────────────────────────────────────────

/** Score >= 75 → "Bonnes conditions": weather_code=0, UV=3, AQI=25 */
export async function mockGoodConditions(page: Page) {
  await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Pp]aris/, banParis);
  await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Ll]yon/, banLyon);
  await page.route(/api\.open-meteo\.com\/v1\/forecast/, route =>
    route.fulfill({ json: {
      current: { temperature_2m: 20, apparent_temperature: 18, relative_humidity_2m: 55, wind_speed_10m: 12, weather_code: 0, cloud_cover: 10 },
      daily: { temperature_2m_max: Array(16).fill(22), temperature_2m_min: Array(16).fill(12), uv_index_max: Array(16).fill(3), precipitation_probability_max: Array(16).fill(10), weather_code: Array(16).fill(0), wind_speed_10m_max: Array(16).fill(15) }
    }})
  );
  await page.route(/air-quality-api\.open-meteo\.com/, route =>
    route.fulfill({ json: { hourly: { european_aqi: Array(48).fill(25), pm2_5: Array(48).fill(8.5), pm10: Array(48).fill(15.2), nitrogen_dioxide: Array(48).fill(12.1), ozone: Array(48).fill(65.3), alder_pollen: Array(48).fill(2), birch_pollen: Array(48).fill(5), grass_pollen: Array(48).fill(8), mugwort_pollen: Array(48).fill(0), olive_pollen: Array(48).fill(0) } }})
  );
  await page.route(/router\.project-osrm\.org/, route => route.fulfill({ json: OSRM_462 }));
  await page.route(/api\.transitous\.org/, route => route.fulfill({ json: TRAINS_EMPTY }));
}

/** Score 50–74 → "Conditions moyennes": weather_code=61, UV=7, AQI=80 */
export async function mockAverageConditions(page: Page) {
  await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Pp]aris/, banParis);
  await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Ll]yon/, banLyon);
  await page.route(/api\.open-meteo\.com\/v1\/forecast/, route =>
    route.fulfill({ json: {
      current: { temperature_2m: 14, apparent_temperature: 11, relative_humidity_2m: 80, wind_speed_10m: 30, weather_code: 61, cloud_cover: 90 },
      daily: { temperature_2m_max: Array(16).fill(16), temperature_2m_min: Array(16).fill(10), uv_index_max: Array(16).fill(7), precipitation_probability_max: Array(16).fill(70), weather_code: Array(16).fill(61), wind_speed_10m_max: Array(16).fill(35) }
    }})
  );
  await page.route(/air-quality-api\.open-meteo\.com/, route =>
    route.fulfill({ json: { hourly: { european_aqi: Array(48).fill(80), pm2_5: Array(48).fill(20), pm10: Array(48).fill(35), nitrogen_dioxide: Array(48).fill(30), ozone: Array(48).fill(90), alder_pollen: Array(48).fill(15), birch_pollen: Array(48).fill(30), grass_pollen: Array(48).fill(60), mugwort_pollen: Array(48).fill(5), olive_pollen: Array(48).fill(0) } }})
  );
  await page.route(/router\.project-osrm\.org/, route => route.fulfill({ json: OSRM_462 }));
  await page.route(/api\.transitous\.org/, route => route.fulfill({ json: TRAINS_EMPTY }));
}

/** Score < 50 → "Conditions dégradées": weather_code=95, UV=10, AQI=150 */
export async function mockBadConditions(page: Page) {
  await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Pp]aris/, banParis);
  await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Ll]yon/, banLyon);
  await page.route(/api\.open-meteo\.com\/v1\/forecast/, route =>
    route.fulfill({ json: {
      current: { temperature_2m: 38, apparent_temperature: 42, relative_humidity_2m: 95, wind_speed_10m: 70, weather_code: 95, cloud_cover: 100 },
      daily: { temperature_2m_max: Array(16).fill(40), temperature_2m_min: Array(16).fill(30), uv_index_max: Array(16).fill(10), precipitation_probability_max: Array(16).fill(95), weather_code: Array(16).fill(95), wind_speed_10m_max: Array(16).fill(80) }
    }})
  );
  await page.route(/air-quality-api\.open-meteo\.com/, route =>
    route.fulfill({ json: { hourly: { european_aqi: Array(48).fill(150), pm2_5: Array(48).fill(50), pm10: Array(48).fill(80), nitrogen_dioxide: Array(48).fill(60), ozone: Array(48).fill(180), alder_pollen: Array(48).fill(0), birch_pollen: Array(48).fill(0), grass_pollen: Array(48).fill(250), mugwort_pollen: Array(48).fill(100), olive_pollen: Array(48).fill(0) } }})
  );
  await page.route(/router\.project-osrm\.org/, route => route.fulfill({ json: OSRM_462 }));
  await page.route(/api\.transitous\.org/, route => route.fulfill({ json: TRAINS_EMPTY }));
}

/** J+5 out-of-range AQI — only 24h of air data, index 132 is out of range */
export async function mockOutOfRangeAqi(page: Page) {
  await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Pp]aris/, banParis);
  await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Ll]yon/, banLyon);
  await page.route(/api\.open-meteo\.com\/v1\/forecast/, route =>
    route.fulfill({ json: {
      current: { temperature_2m: 20, apparent_temperature: 18, relative_humidity_2m: 55, wind_speed_10m: 12, weather_code: 0, cloud_cover: 10 },
      daily: { temperature_2m_max: Array(16).fill(22), temperature_2m_min: Array(16).fill(12), uv_index_max: Array(16).fill(3), precipitation_probability_max: Array(16).fill(10), weather_code: Array(16).fill(0), wind_speed_10m_max: Array(16).fill(15) }
    }})
  );
  // Only 24h of AQI — J+5 index (5*24+12=132) exceeds array length → outOfRange=true
  await page.route(/air-quality-api\.open-meteo\.com/, route =>
    route.fulfill({ json: { hourly: { european_aqi: Array(24).fill(20), pm2_5: Array(24).fill(5), pm10: Array(24).fill(10), nitrogen_dioxide: Array(24).fill(8), ozone: Array(24).fill(50), alder_pollen: Array(24).fill(0), birch_pollen: Array(24).fill(0), grass_pollen: Array(24).fill(0), mugwort_pollen: Array(24).fill(0), olive_pollen: Array(24).fill(0) } }})
  );
  await page.route(/router\.project-osrm\.org/, route => route.fulfill({ json: OSRM_462 }));
  await page.route(/api\.transitous\.org/, route => route.fulfill({ json: TRAINS_EMPTY }));
}

/** Transitous 429 response */
export async function mockTransitous429(page: Page) {
  await page.route(/api\.transitous\.org/, route => route.fulfill({ status: 429, body: '' }));
}

/** Wait until the loading screen disappears (resolves to either dash or search) */
export async function waitForExitLoading(page: Page, timeout = 12_000) {
  await page.waitForFunction(
    () => !document.getElementById('scr-loading')?.classList.contains('on'),
    { timeout }
  );
}

/** Run a full mocked analysis from search → dashboard */
export async function runMockedAnalysis(
  page: Page,
  mockFn: (p: Page) => Promise<void>,
  orig = 'Paris',
  dest = 'Lyon'
) {
  await mockFn(page);
  await gotoSearch(page);
  await page.locator(SEL.origInput).fill(orig);
  await page.locator(SEL.destInput).fill(dest);
  await page.locator(SEL.analyzeBtn).click();
  await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
}
