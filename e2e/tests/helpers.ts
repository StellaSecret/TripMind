import { Page, expect } from '@playwright/test';

// ── Selectors — verified against index.html ───────────────────────────────────
export const SEL = {
  // Screen containers — active screen has class "on"
  scrSearch:   '#scr-search',
  scrSettings: '#scr-settings',
  scrLoading:  '#scr-loading',
  scrDash:     '#scr-dash',

  // Search screen
  origInput:   '#orig-inp',
  destInput:   '#dest-inp',
  origAc:      '#orig-ac',
  destAc:      '#dest-ac',
  swapBtn:     '#swap-btn',
  analyzeBtn:  '#analyze-btn',
  ebox:        '#ebox',
  datePicker:  '#date-picker',
  dateLabel:   '#selected-date-label',
  goSettings:  '#go-settings',

  // Settings screen
  settingsBack:  '#settings-back',

  // Dashboard
  dOrig:        '#d-orig',
  dDest:        '#d-dest',
  dashDateLabel:'#dash-date-label',
  scoreCirc:    '#score-circ',
  scoreLbl:     '#score-lbl',
  scoreDetail:  '#score-detail',
  backBtn:      '#back-btn',
  settingsIcon: '#settings-icon',
  tabContent:   '#tab-content',

  // Tabs (class=tab, data-tab=xxx)
  tabs:         '.tab',
  tabOverview:  '.tab[data-tab="overview"]',
  tabRoute:     '.tab[data-tab="route"]',
  tabAir:       '.tab[data-tab="air"]',
  tabSante:     '.tab[data-tab="sante"]',
  tabTrains:    '.tab[data-tab="trains"]',
};

// ── Screen helpers ────────────────────────────────────────────────────────────

/** Navigate to the app and wait for the search screen */
export async function gotoSearch(page: Page) {
  await page.goto('/');
  await expect(page.locator(SEL.scrSearch)).toHaveClass(/on/);
}

/** Fill both fields and click Analyze. Optionally wait for dashboard. */
export async function fillAndAnalyze(page: Page, orig: string, dest: string, waitDash = true) {
  await page.locator(SEL.origInput).fill(orig);
  await page.locator(SEL.destInput).fill(dest);
  await page.locator(SEL.analyzeBtn).click();
  if (waitDash) {
    await expect(page.locator(SEL.scrDash)).toHaveClass(/on/, { timeout: 25_000 });
  }
}

/** Click a tab by its data-tab value */
export async function clickTab(page: Page, name: string) {
  await page.locator(`.tab[data-tab="${name}"]`).click();
  await page.waitForTimeout(200);
}

/** Mock ALL external APIs with minimal valid responses (fully offline) */
export async function mockAllApis(page: Page) {
  // BAN geocode — Paris
  await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Pp]aris/, route =>
    route.fulfill({ json: { features: [{ geometry: { coordinates: [2.3488, 48.8534] }, properties: { city: 'Paris', name: 'Paris', context: '75, Paris, Île-de-France' } }] } })
  );
  // BAN geocode — Lyon
  await page.route(/api-adresse\.data\.gouv\.fr.*q=.*[Ll]yon/, route =>
    route.fulfill({ json: { features: [{ geometry: { coordinates: [4.8357, 45.7640] }, properties: { city: 'Lyon', name: 'Lyon', context: '69, Rhône, Auvergne-Rhône-Alpes' } }] } })
  );
  // Open-Meteo weather (clear sky, 20°, UV=3)
  await page.route(/api\.open-meteo\.com\/v1\/forecast/, route =>
    route.fulfill({ json: {
      current: { temperature_2m: 20, apparent_temperature: 18, relative_humidity_2m: 55, wind_speed_10m: 12, weather_code: 0, cloud_cover: 10 },
      daily: {
        temperature_2m_max:          Array(16).fill(22),
        temperature_2m_min:          Array(16).fill(12),
        uv_index_max:                Array(16).fill(3),
        precipitation_probability_max: Array(16).fill(10),
        weather_code:                Array(16).fill(0),
        wind_speed_10m_max:          Array(16).fill(15),
      }
    }})
  );
  // Open-Meteo Air Quality (low AQI=25, low pollen)
  await page.route(/air-quality-api\.open-meteo\.com/, route =>
    route.fulfill({ json: { hourly: {
      european_aqi:     Array(48).fill(25),
      pm2_5:            Array(48).fill(8.5),
      pm10:             Array(48).fill(15.2),
      nitrogen_dioxide: Array(48).fill(12.1),
      ozone:            Array(48).fill(65.3),
      alder_pollen:     Array(48).fill(2),
      birch_pollen:     Array(48).fill(5),
      grass_pollen:     Array(48).fill(8),
      mugwort_pollen:   Array(48).fill(0),
      olive_pollen:     Array(48).fill(0),
    }}})
  );
  // OSRM route
  await page.route(/router\.project-osrm\.org/, route =>
    route.fulfill({ json: { routes: [{ distance: 462000, duration: 14400 }] } })
  );
  // Transitous — empty (no trains found, but no error)
  await page.route(/api\.transitous\.org/, route =>
    route.fulfill({ json: { itineraries: [] } })
  );
}
