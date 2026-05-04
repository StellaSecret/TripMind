/**
 * Full E2E with real APIs — tagged @live, skipped in CI.
 * Run locally: BASE_URL=http://localhost:3000 npm run test:live
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, fillAndAnalyze, clickTab } from './helpers';

test.describe('Real analysis — Paris → Lyon @live', () => {

  test('full flow reaches dashboard @live', async ({ page }) => {
    await gotoSearch(page);
    await fillAndAnalyze(page, 'Paris', 'Lyon');
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/);
  });

  test('city pills show Paris and Lyon @live', async ({ page }) => {
    await gotoSearch(page);
    await fillAndAnalyze(page, 'Paris', 'Lyon');
    await expect(page.locator(SEL.dOrig)).toContainText('Paris');
    await expect(page.locator(SEL.dDest)).toContainText('Lyon');
  });

  test('score is one of three valid labels @live', async ({ page }) => {
    await gotoSearch(page);
    await fillAndAnalyze(page, 'Paris', 'Lyon');
    const text = await page.locator(SEL.scoreLbl).textContent();
    const valid = ['Bonnes conditions', 'Conditions moyennes', 'Conditions dégradées'];
    expect(valid.some(l => text!.includes(l))).toBeTruthy();
  });

  test('route tab shows km distance @live', async ({ page }) => {
    await gotoSearch(page);
    await fillAndAnalyze(page, 'Paris', 'Lyon');
    await clickTab(page, 'route');
    await expect(page.locator(SEL.tabContent)).toContainText('km');
  });

  test('J+1 analysis shows "Demain" in date bar @live', async ({ page }) => {
    await gotoSearch(page);
    await page.locator('.date-chip[data-offset="1"]').click();
    await expect(page.locator(SEL.dateLabel)).toHaveText('Demain');
    await fillAndAnalyze(page, 'Paris', 'Lyon');
    await expect(page.locator(SEL.dashDateLabel)).toHaveText('Demain');
  });

  test('short route Paris → Versailles completes @live', async ({ page }) => {
    await gotoSearch(page);
    await fillAndAnalyze(page, 'Paris', 'Versailles');
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/);
  });

  test('second analysis updates city pills @live', async ({ page }) => {
    await gotoSearch(page);
    await fillAndAnalyze(page, 'Paris', 'Lyon');
    await page.locator(SEL.backBtn).click();
    await page.locator(SEL.origInput).fill('Bordeaux');
    await page.locator(SEL.destInput).fill('Toulouse');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 25_000 });
    await expect(page.locator(SEL.dOrig)).toContainText('Bordeaux');
    await expect(page.locator(SEL.dDest)).toContainText('Toulouse');
  });
});
