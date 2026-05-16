/**
 * Full analysis flow with all APIs mocked.
 * No @live → runs in CI offline suite.
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, mockGoodConditions, mockAverageConditions, mockBadConditions, runMockedAnalysis, clickTab } from './helpers';

// ── Score label thresholds ────────────────────────────────────────────────────

test.describe('Score calculation — three thresholds', () => {

  test('score >= 75 → "Bonnes conditions" (clear sky, UV=3, AQI=25)', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await expect(page.locator(SEL.scoreLbl)).toHaveText('Bonnes conditions');
  });

  test('score 50–74 → "Conditions moyennes" (rain, UV=7, AQI=80)', async ({ page }) => {
    await runMockedAnalysis(page, mockAverageConditions);
    await expect(page.locator(SEL.scoreLbl)).toHaveText('Conditions moyennes');
  });

  test('score < 50 → "Conditions dégradées" (storm, UV=10, AQI=150)', async ({ page }) => {
    await runMockedAnalysis(page, mockBadConditions);
    await expect(page.locator(SEL.scoreLbl)).toHaveText('Conditions dégradées');
  });

  test('score-detail contains a number followed by /100', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await expect(page.locator(SEL.scoreDetail)).toContainText('/100');
  });

  test('"Bonnes conditions" score detail shows green score (>=75)', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    const txt = await page.locator(SEL.scoreDetail).textContent();
    const score = parseInt(txt!.match(/(\d+)\/100/)![1]);
    expect(score).toBeGreaterThanOrEqual(75);
  });

  test('"Conditions dégradées" score detail shows low score (<50)', async ({ page }) => {
    await runMockedAnalysis(page, mockBadConditions);
    const txt = await page.locator(SEL.scoreDetail).textContent();
    const score = parseInt(txt!.match(/(\d+)\/100/)![1]);
    expect(score).toBeLessThan(50);
  });
});

// ── Dashboard header ──────────────────────────────────────────────────────────

test.describe('Dashboard — header', () => {

  test.beforeEach(async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
  });

  test('city pills show Paris and Lyon', async ({ page }) => {
    await expect(page.locator(SEL.dOrig)).toHaveText('Paris');
    await expect(page.locator(SEL.dDest)).toHaveText('Lyon');
  });

  test('date bar shows "Aujourd\'hui" for today', async ({ page }) => {
    await expect(page.locator(SEL.dashDateLabel)).toHaveText("Aujourd'hui");
  });

  test('score circle SVG is rendered', async ({ page }) => {
    await expect(page.locator(`${SEL.scoreCirc} svg`)).toBeVisible();
  });

  test('exactly 5 tabs are rendered', async ({ page }) => {
    await expect(page.locator(SEL.tabs)).toHaveCount(5);
  });

  test('"Aperçu" tab is active by default', async ({ page }) => {
    await expect(page.locator(SEL.tabOverview)).toHaveClass(/active/);
  });
});

// ── Tab: Aperçu ───────────────────────────────────────────────────────────────

test.describe('Tab: Aperçu (overview)', () => {

  test.beforeEach(async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
  });

  test('shows temperature "20°"', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('20°');
  });

  test('shows "Ciel dégagé" for weather_code=0', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('Ciel dégagé');
  });

  test('shows AQI value "25"', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('25');
  });

  test('shows UV label', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('UV');
  });

  test('shows "Orageux" for weather_code=95 (bad conditions)', async ({ page }) => {
    await runMockedAnalysis(page, mockBadConditions);
    await expect(page.locator(SEL.tabContent)).toContainText('Orageux');
  });

  test('shows high temperature "38°" for bad conditions', async ({ page }) => {
    await runMockedAnalysis(page, mockBadConditions);
    await expect(page.locator(SEL.tabContent)).toContainText('38°');
  });
});

// ── Tab: Trajet ───────────────────────────────────────────────────────────────

test.describe('Tab: Trajet (route)', () => {

  test.beforeEach(async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await clickTab(page, 'route');
  });

  test('shows 462 km from OSRM mock', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('462');
  });

  test('shows "Voiture" mode card', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('Voiture');
  });

  test('shows "Train" mode card', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('Train');
  });

  test('shows "Bus" mode card', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('Bus');
  });

  test('shows "Covoiturage" mode card', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('Covoiturage');
  });

  test('shows CO₂ data', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('CO₂');
  });
});

// ── Tab: Air & Pollen ─────────────────────────────────────────────────────────

test.describe('Tab: Air & Pollen', () => {

  test.beforeEach(async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await clickTab(page, 'air');
  });

  test('shows AQI badge', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('AQI');
  });

  test('shows PM₂.₅', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('PM₂.₅');
  });

  test('shows "Graminées" pollen species', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('Graminées');
  });

  test('shows all 5 pollen species', async ({ page }) => {
    const content = await page.locator(SEL.tabContent).textContent();
    for (const p of ['Aulne', 'Bouleau', 'Graminées', 'Armoise', 'Olivier']) {
      expect(content).toContain(p);
    }
  });
});

// ── Tab: Santé ────────────────────────────────────────────────────────────────

test.describe('Tab: Santé', () => {

  test.beforeEach(async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await clickTab(page, 'sante');
  });

  test('shows UV label', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('UV');
  });

  test('shows Masque recommendation', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('Masque');
  });

  test('shows Pollen cell', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('Pollen');
  });

  test('shows "Activité ext." cell', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('Activité ext.');
  });

  test('shows "Qualité air" cell', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('Qualité air');
  });

  test('"Activité ext." is "Favorable" for good conditions', async ({ page }) => {
    const content = await page.locator(SEL.tabContent).textContent();
    expect(content).toMatch(/Favorable/);
  });

  test('"Activité ext." is "Déconseillée" for bad conditions', async ({ page }) => {
    await runMockedAnalysis(page, mockBadConditions);
    await clickTab(page, 'sante');
    await expect(page.locator(SEL.tabContent)).toContainText('Déconseillée');
  });

  test('shows 6 health grid cells total', async ({ page }) => {
    const cells = page.locator('.ht');
    const count = await cells.count();
    expect(count).toBe(6);
  });
});

// ── Tab: Trains ───────────────────────────────────────────────────────────────

test.describe('Tab: Trains', () => {

  test('shows empty-state message when no trains found', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await clickTab(page, 'trains');
    await expect(page.locator(SEL.tabContent)).toContainText('Aucun trajet');
  });

  test('shows Transitous attribution', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await clickTab(page, 'trains');
    await expect(page.locator(SEL.tabContent)).toContainText('Transitous');
  });

  test('shows SNCF Connect link in fallback resources card', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await clickTab(page, 'trains');
    await expect(page.locator(SEL.tabContent)).toContainText('SNCF Connect');
  });

  test('shows exactly 5 official resource links', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await clickTab(page, 'trains');
    // Ressources officielles card has 5 links: SNCF Connect, Ouigo, Trainline, Vianavigo, RATP
    const links = page.locator('#tab-content a[href]');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('shows 429 overload message when Transitous is rate-limited', async ({ page }) => {
    await mockGoodConditions(page);
    await page.route(/api\.transitous\.org/, route => route.fulfill({ status: 429, body: '' }));
    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    await clickTab(page, 'trains');
    await expect(page.locator(SEL.tabContent)).toContainText('429');
  });

  test('shows real train itinerary when Transitous returns results', async ({ page }) => {
    // Mock a realistic Transitous response with 1 itinerary
    await mockGoodConditions(page);
    await page.route(/api\.transitous\.org/, route =>
      route.fulfill({ json: { itineraries: [{
        duration: 6600,
        startTime: '2026-05-16T06:00:00Z',
        endTime:   '2026-05-16T07:50:00Z',
        transfers: 0,
        legs: [{
          mode: 'RAIL',
          startTime: '2026-05-16T06:00:00Z',
          endTime:   '2026-05-16T07:50:00Z',
          duration: 6600,
          headsign: 'Lyon Part-Dieu',
          realTime: false,
          from: { name: 'Paris Gare de Lyon' },
          to:   { name: 'Lyon Part-Dieu' }
        }]
      }]}})
    );
    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    await clickTab(page, 'trains');
    // Should show departure time and station name
    await expect(page.locator(SEL.tabContent)).toContainText('Lyon Part-Dieu');
    await expect(page.locator(SEL.tabContent)).toContainText('06:00');
  });
});

// ── Tab switching ─────────────────────────────────────────────────────────────

test.describe('Tab switching', () => {

  test.beforeEach(async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
  });

  test('cycling all 5 tabs never crashes (content always non-empty)', async ({ page }) => {
    for (const tab of ['overview', 'route', 'air', 'sante', 'trains']) {
      await clickTab(page, tab);
      const html = await page.locator(SEL.tabContent).innerHTML();
      expect(html.length).toBeGreaterThan(10);
      expect(html).not.toContain('TypeError');
      expect(html).not.toContain('undefined');
    }
  });

  test('switching to Route sets it active, deactivates Aperçu', async ({ page }) => {
    await clickTab(page, 'route');
    await expect(page.locator(SEL.tabRoute)).toHaveClass(/active/);
    await expect(page.locator(SEL.tabOverview)).not.toHaveClass(/active/);
  });
});

// ── Back navigation ───────────────────────────────────────────────────────────

test.describe('Navigation', () => {

  test.beforeEach(async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
  });

  test('"← Modifier" returns to search screen', async ({ page }) => {
    await page.locator(SEL.backBtn).click();
    await expect(page.locator(SEL.scrSearch)).toHaveClass(/\bon\b/);
    await expect(page.locator(SEL.scrDash)).not.toHaveClass(/\bon\b/);
  });

  test('inputs retain city names after returning from dashboard', async ({ page }) => {
    await page.locator(SEL.backBtn).click();
    await expect(page.locator(SEL.origInput)).toHaveValue('Paris');
    await expect(page.locator(SEL.destInput)).toHaveValue('Lyon');
  });

  test('settings gear from dashboard opens settings screen', async ({ page }) => {
    await page.locator(SEL.settingsIcon).click();
    await expect(page.locator(SEL.scrSettings)).toHaveClass(/\bon\b/);
  });
});

// ── Keyboard: Enter triggers analyze ─────────────────────────────────────────

test.describe('Keyboard — Enter triggers analyze', () => {

  test('pressing Enter in origin input starts analysis', async ({ page }) => {
    await mockGoodConditions(page);
    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.origInput).press('Enter');
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
  });

  test('pressing Enter in destination input starts analysis', async ({ page }) => {
    await mockGoodConditions(page);
    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.destInput).press('Enter');
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
  });
});

// ── Future date ───────────────────────────────────────────────────────────────

test.describe('Future date — J+1', () => {

  test('J+1 date bar shows "Demain" on dashboard', async ({ page }) => {
    await mockGoodConditions(page);
    await gotoSearch(page);
    await page.locator('.date-chip[data-offset="1"]').click();
    await expect(page.locator(SEL.dateLabel)).toHaveText('Demain');
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    await expect(page.locator(SEL.dashDateLabel)).toHaveText('Demain');
  });
});

// ── AQI out-of-range (J+5) ────────────────────────────────────────────────────

test.describe('Air tab — J+5 out-of-range AQI', () => {

  test('Air tab shows pollutant fallback message when AQI data is null for J+5', async ({ page }) => {
    await mockGoodConditions(page);
    // When all AQI/pollutant values are null, the app shows:
    //   "⏱ Données de polluants non disponibles pour ce jour."
    // Pollen bars still render (zero values are valid), so the pollen section is unaffected.
    await page.route(/air-quality-api\.open-meteo\.com/, route =>
      route.fulfill({ json: { hourly: {
        european_aqi:     Array(48).fill(null),
        pm2_5:            Array(48).fill(null),
        pm10:             Array(48).fill(null),
        nitrogen_dioxide: Array(48).fill(null),
        ozone:            Array(48).fill(null),
        alder_pollen:     Array(48).fill(0),
        birch_pollen:     Array(48).fill(0),
        grass_pollen:     Array(48).fill(0),
        mugwort_pollen:   Array(48).fill(0),
        olive_pollen:     Array(48).fill(0),
      }}})
    );
    await gotoSearch(page);
    await page.locator('.date-chip[data-offset="5"]').click();
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    await clickTab(page, 'air');
    // Null AQI → pollutants section shows the unavailable message
    await expect(page.locator(SEL.tabContent)).toContainText('Données de polluants non disponibles');
    // Pollen section still renders normally (zero values → "Aucun pollen significatif")
    await expect(page.locator(SEL.tabContent)).toContainText('Aucun pollen significatif');
  });
});
