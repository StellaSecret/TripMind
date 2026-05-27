/**
 * Language toggle — re-renders dashboard, translates all UI strings.
 * All mocked, no @live.
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, mockGoodConditions, runMockedAnalysis, clickTab } from './helpers';

const LANG_BTN = '#lang-toggle';

test.describe('Language toggle — search screen', () => {

  test.beforeEach(async ({ page }) => { await gotoSearch(page); });

  test('default language is French', async ({ page }) => {
    await expect(page.locator(SEL.origInput)).toHaveAttribute('placeholder', /Ex:/);
  });

  test('toggle switches to English', async ({ page }) => {
    await page.locator(LANG_BTN).click();
    await expect(page.locator(SEL.origInput)).toHaveAttribute('placeholder', /E\.g\./);
  });

  test('toggle twice returns to French', async ({ page }) => {
    await page.locator(LANG_BTN).click();
    await page.locator(LANG_BTN).click();
    await expect(page.locator(SEL.origInput)).toHaveAttribute('placeholder', /Ex:/);
  });

  test('analyze button text translates', async ({ page }) => {
    await expect(page.locator(SEL.analyzeBtn)).toContainText('Analyser');
    await page.locator(LANG_BTN).click();
    await expect(page.locator(SEL.analyzeBtn)).toContainText('Analyze');
  });

  test('date label "Aujourd\'hui" translates to "Today"', async ({ page }) => {
    await expect(page.locator(SEL.dateLabel)).toHaveText("Aujourd'hui");
    await page.locator(LANG_BTN).click();
    await expect(page.locator(SEL.dateLabel)).toHaveText('Today');
  });

  test('back button on dashboard translates', async ({ page }) => {
    await page.locator(LANG_BTN).click();
    await expect(page.locator(SEL.backBtn)).toContainText('Edit');
    await page.locator(LANG_BTN).click();
    await expect(page.locator(SEL.backBtn)).toContainText('Modifier');
  });
});

test.describe('Language toggle — dashboard re-render', () => {
  // On the dashboard, use #lang-toggle-dash (search screen toggle is hidden)
  const DASH_LANG_BTN = '#lang-toggle-dash';

  test.beforeEach(async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
  });

  test('score label re-renders on language switch', async ({ page }) => {
    await expect(page.locator(SEL.scoreLbl)).toContainText('conditions');
    await page.locator(DASH_LANG_BTN).click();
    // Label should now be in English
    const txt = await page.locator(SEL.scoreLbl).textContent();
    expect(['Good conditions', 'Average conditions', 'Poor conditions'])
      .toContain(txt?.trim());
  });

  test('tab labels translate on switch', async ({ page }) => {
    await expect(page.locator(SEL.tabRoute)).toContainText('Trajet');
    await page.locator(DASH_LANG_BTN).click();
    await expect(page.locator(SEL.tabRoute)).toContainText('Journey');
  });

  test('overview tab content re-renders on switch', async ({ page }) => {
    // Overview is active by default
    await expect(page.locator(SEL.tabContent)).toContainText('Météo');
    await page.locator(DASH_LANG_BTN).click();
    await expect(page.locator(SEL.tabContent)).toContainText('Weather');
  });

  test('route tab re-renders on switch', async ({ page }) => {
    await clickTab(page, 'route');
    await expect(page.locator(SEL.tabContent)).toContainText('Voiture');
    await page.locator(DASH_LANG_BTN).click();
    await expect(page.locator(SEL.tabContent)).toContainText('Car');
  });
});
