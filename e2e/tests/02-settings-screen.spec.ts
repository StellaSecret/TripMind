/**
 * Settings screen — verified against real index.html content
 * No @live → runs offline in CI
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch } from './helpers';

test.describe('Settings screen — data sources', () => {

  test.beforeEach(async ({ page }) => {
    await gotoSearch(page);
    await page.locator(SEL.goSettings).click();
    await expect(page.locator(SEL.scrSettings)).toHaveClass(/\bon\b/);
  });

  test('settings title is "Sources de données"', async ({ page }) => {
    await expect(page.locator('.settings-title')).toHaveText('Sources de données');
  });

  test('Transitous card name contains "Transitous"', async ({ page }) => {
    await expect(page.locator('.transitous-name')).toContainText('Transitous');
  });

  test('Transitous card subtitle says "Aucun token"', async ({ page }) => {
    await expect(page.locator('.transitous-sub')).toContainText('Aucun token');
  });

  test('Transitous link points to transitous.org', async ({ page }) => {
    await expect(page.locator('.transitous-link')).toHaveAttribute('href', 'https://transitous.org');
  });

  test('Transitous link opens in a new tab', async ({ page }) => {
    await expect(page.locator('.transitous-link')).toHaveAttribute('target', '_blank');
  });

  test('free APIs card has exactly 6 rows', async ({ page }) => {
    await expect(page.locator('.free-api-row')).toHaveCount(6);
  });

  test('free APIs card mentions Open-Meteo', async ({ page }) => {
    await expect(page.locator('.free-apis-card')).toContainText('Open-Meteo');
  });

  test('free APIs card mentions Base Adresse Nationale', async ({ page }) => {
    await expect(page.locator('.free-apis-card')).toContainText('Base Adresse Nationale');
  });

  test('free APIs card mentions OSRM', async ({ page }) => {
    await expect(page.locator('.free-apis-card')).toContainText('OSRM');
  });

  test('privacy notice says no personal data is collected', async ({ page }) => {
    await expect(page.locator('.free-apis-card')).toContainText('aucune donnée personnelle');
  });

  test('"← Retour" button goes back to search screen', async ({ page }) => {
    await page.locator(SEL.settingsBack).click();
    await expect(page.locator(SEL.scrSearch)).toHaveClass(/\bon\b/);
    await expect(page.locator(SEL.scrSettings)).not.toHaveClass(/\bon\b/);
  });

  test('inputs are preserved after going to settings and back', async ({ page }) => {
    // Go back to search, fill fields, then go to settings and back
    await page.locator(SEL.settingsBack).click();
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.goSettings).click();
    await page.locator(SEL.settingsBack).click();
    await expect(page.locator(SEL.origInput)).toHaveValue('Paris');
    await expect(page.locator(SEL.destInput)).toHaveValue('Lyon');
  });
});
