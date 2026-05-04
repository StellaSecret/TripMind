/**
 * Full analysis flow with all APIs mocked — fast, deterministic, no network needed.
 * No @live → runs in CI offline suite.
 *
 * With mock data: weather_code=0, temp=20°, AQI=25 → score should be "Bonnes conditions"
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, mockAllApis, clickTab } from './helpers';

test.describe('Mocked analysis — Paris → Lyon', () => {

  test.beforeEach(async ({ page }) => {
    await mockAllApis(page);
    await gotoSearch(page);
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
  });

  // ── Dashboard header ──────────────────────────────────────────────────────

  test('city pills show Paris and Lyon', async ({ page }) => {
    await expect(page.locator(SEL.dOrig)).toHaveText('Paris');
    await expect(page.locator(SEL.dDest)).toHaveText('Lyon');
  });

  test('date bar shows "Aujourd\'hui"', async ({ page }) => {
    await expect(page.locator(SEL.dashDateLabel)).toHaveText("Aujourd'hui");
  });

  test('score label shows "Bonnes conditions" (clear sky + low AQI)', async ({ page }) => {
    await expect(page.locator(SEL.scoreLbl)).toHaveText('Bonnes conditions');
  });

  test('score detail shows /100', async ({ page }) => {
    await expect(page.locator(SEL.scoreDetail)).toContainText('/100');
  });

  test('score circle SVG is rendered', async ({ page }) => {
    await expect(page.locator(`${SEL.scoreCirc} svg`)).toBeVisible();
  });

  // ── Tabs ──────────────────────────────────────────────────────────────────

  test('exactly 5 tabs are rendered', async ({ page }) => {
    await expect(page.locator(SEL.tabs)).toHaveCount(5);
  });

  test('"Aperçu" tab is active by default', async ({ page }) => {
    await expect(page.locator(SEL.tabOverview)).toHaveClass(/active/);
  });

  // ── Tab: Aperçu ───────────────────────────────────────────────────────────

  test('Overview tab shows temperature "20°"', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('20°');
  });

  test('Overview tab shows "Ciel dégagé" for weather_code=0', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('Ciel dégagé');
  });

  test('Overview tab shows AQI value', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('25');
  });

  test('Overview tab shows UV index', async ({ page }) => {
    await expect(page.locator(SEL.tabContent)).toContainText('UV');
  });

  // ── Tab: Trajet ───────────────────────────────────────────────────────────

  test('Route tab shows 462 km from OSRM mock', async ({ page }) => {
    await clickTab(page, 'route');
    await expect(page.locator(SEL.tabContent)).toContainText('462');
  });

  test('Route tab shows "Voiture" mode card', async ({ page }) => {
    await clickTab(page, 'route');
    await expect(page.locator(SEL.tabContent)).toContainText('Voiture');
  });

  test('Route tab shows "Train" mode card', async ({ page }) => {
    await clickTab(page, 'route');
    await expect(page.locator(SEL.tabContent)).toContainText('Train');
  });

  test('Route tab shows CO₂ data', async ({ page }) => {
    await clickTab(page, 'route');
    await expect(page.locator(SEL.tabContent)).toContainText('CO₂');
  });

  test('Route tab shows "Bus / Car" mode card', async ({ page }) => {
    await clickTab(page, 'route');
    await expect(page.locator(SEL.tabContent)).toContainText('Bus');
  });

  test('Route tab shows "Covoiturage" mode card', async ({ page }) => {
    await clickTab(page, 'route');
    await expect(page.locator(SEL.tabContent)).toContainText('Covoiturage');
  });

  // ── Tab: Air & Pollen ─────────────────────────────────────────────────────

  test('Air tab shows AQI badge', async ({ page }) => {
    await clickTab(page, 'air');
    await expect(page.locator(SEL.tabContent)).toContainText('AQI');
  });

  test('Air tab shows pollen species Graminées', async ({ page }) => {
    await clickTab(page, 'air');
    await expect(page.locator(SEL.tabContent)).toContainText('Graminées');
  });

  test('Air tab shows PM2.5', async ({ page }) => {
    await clickTab(page, 'air');
    await expect(page.locator(SEL.tabContent)).toContainText('PM₂.₅');
  });

  // ── Tab: Santé ────────────────────────────────────────────────────────────

  test('Santé tab shows "UV" label', async ({ page }) => {
    await clickTab(page, 'sante');
    await expect(page.locator(SEL.tabContent)).toContainText('UV');
  });

  test('Santé tab shows masque recommendation', async ({ page }) => {
    await clickTab(page, 'sante');
    await expect(page.locator(SEL.tabContent)).toContainText('Masque');
  });

  // ── Tab: Trains ───────────────────────────────────────────────────────────

  test('Trains tab shows station names Paris and Lyon', async ({ page }) => {
    await clickTab(page, 'trains');
    await expect(page.locator(SEL.tabContent)).toContainText('Paris');
    await expect(page.locator(SEL.tabContent)).toContainText('Lyon');
  });

  test('Trains tab shows "Transitous" source tag', async ({ page }) => {
    await clickTab(page, 'trains');
    await expect(page.locator(SEL.tabContent)).toContainText('Transitous');
  });

  test('Trains tab shows empty-results message (mock returns no trains)', async ({ page }) => {
    await clickTab(page, 'trains');
    // Empty itineraries → "Aucun trajet en transport commun trouvé"
    await expect(page.locator(SEL.tabContent)).toContainText('Aucun trajet');
  });

  test('Trains tab shows SNCF Connect link', async ({ page }) => {
    await clickTab(page, 'trains');
    await expect(page.locator(SEL.tabContent)).toContainText('SNCF Connect');
  });

  // ── Tab switching ─────────────────────────────────────────────────────────

  test('switching to Route tab sets it as active', async ({ page }) => {
    await clickTab(page, 'route');
    await expect(page.locator(SEL.tabRoute)).toHaveClass(/active/);
    await expect(page.locator(SEL.tabOverview)).not.toHaveClass(/active/);
  });

  test('cycling all 5 tabs never throws (content always defined)', async ({ page }) => {
    for (const tab of ['overview', 'route', 'air', 'sante', 'trains']) {
      await clickTab(page, tab);
      const html = await page.locator(SEL.tabContent).innerHTML();
      expect(html.length).toBeGreaterThan(10);
    }
  });

  // ── Back navigation ───────────────────────────────────────────────────────

  test('"← Modifier" returns to search screen', async ({ page }) => {
    await page.locator(SEL.backBtn).click();
    await expect(page.locator(SEL.scrSearch)).toHaveClass(/\bon\b/);
    await expect(page.locator(SEL.scrDash)).not.toHaveClass(/\bon\b/);
  });

  test('inputs contain city names after returning from dashboard', async ({ page }) => {
    await page.locator(SEL.backBtn).click();
    await expect(page.locator(SEL.origInput)).toHaveValue('Paris');
    await expect(page.locator(SEL.destInput)).toHaveValue('Lyon');
  });

  test('settings gear icon from dashboard opens settings', async ({ page }) => {
    await page.locator(SEL.settingsIcon).click();
    await expect(page.locator(SEL.scrSettings)).toHaveClass(/\bon\b/);
  });
});
