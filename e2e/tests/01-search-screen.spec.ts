/**
 * Search screen — layout, date picker, validation, swap, navigation
 * Tag: no @live annotation → runs in CI offline suite
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch } from './helpers';

test.describe('Search screen — static layout', () => {

  test.beforeEach(async ({ page }) => {
    await gotoSearch(page);
  });

  // ── Screen visibility ─────────────────────────────────────────────────────

  test('search screen is on at startup, others are off', async ({ page }) => {
    await expect(page.locator(SEL.scrSearch)).toHaveClass(/\bon\b/);
    await expect(page.locator(SEL.scrDash)).not.toHaveClass(/\bon\b/);
    await expect(page.locator(SEL.scrLoading)).not.toHaveClass(/\bon\b/);
    await expect(page.locator(SEL.scrSettings)).not.toHaveClass(/\bon\b/);
  });

  test('page title is "TripMind"', async ({ page }) => {
    await expect(page).toHaveTitle('TripMind');
  });

  test('logo shows "TripMind"', async ({ page }) => {
    await expect(page.locator('.logo-nm')).toHaveText('TripMind');
  });

  test('logo sub shows "France · APIs publiques"', async ({ page }) => {
    await expect(page.locator('.logo-sub')).toHaveText('France · APIs publiques');
  });

  // ── API pills ─────────────────────────────────────────────────────────────

  test('renders exactly 6 API pills', async ({ page }) => {
    await expect(page.locator('.api-pill')).toHaveCount(6);
  });

  test('first pill mentions Open-Meteo météo', async ({ page }) => {
    await expect(page.locator('.api-pill').nth(0)).toContainText('Open-Meteo météo');
  });

  test('last pill mentions Transitous trains', async ({ page }) => {
    await expect(page.locator('.api-pill').nth(5)).toContainText('Transitous trains');
  });

  // ── Inputs ───────────────────────────────────────────────────────────────

  test('origin input has correct placeholder', async ({ page }) => {
    await expect(page.locator(SEL.origInput)).toHaveAttribute('placeholder', /Paris/);
  });

  test('destination input has correct placeholder', async ({ page }) => {
    await expect(page.locator(SEL.destInput)).toHaveAttribute('placeholder', /Marseille/);
  });

  test('origin input has aria-expanded="false" initially', async ({ page }) => {
    await expect(page.locator(SEL.origInput)).toHaveAttribute('aria-expanded', 'false');
  });

  test('origin autocomplete list has role="listbox"', async ({ page }) => {
    await expect(page.locator(SEL.origAc)).toHaveAttribute('role', 'listbox');
  });

  // ── Date picker ───────────────────────────────────────────────────────────

  test('date picker renders 16 chips', async ({ page }) => {
    await expect(page.locator('.date-chip')).toHaveCount(16);
  });

  test('first chip (today) is active by default', async ({ page }) => {
    await expect(page.locator('.date-chip').first()).toHaveClass(/active/);
  });

  test('first chip day label is "Auj."', async ({ page }) => {
    await expect(page.locator('.date-chip').first().locator('.dc-day')).toHaveText('Auj.');
  });

  test('second chip day label is "Dem."', async ({ page }) => {
    await expect(page.locator('.date-chip').nth(1).locator('.dc-day')).toHaveText('Dem.');
  });

  test('date label shows "Aujourd\'hui" by default', async ({ page }) => {
    await expect(page.locator(SEL.dateLabel)).toHaveText("Aujourd'hui");
  });

  test('clicking tomorrow chip sets label to "Demain"', async ({ page }) => {
    await page.locator('.date-chip[data-offset="1"]').click();
    await expect(page.locator(SEL.dateLabel)).toHaveText('Demain');
  });

  test('clicking J+2 chip updates active class and shows weekday label', async ({ page }) => {
    await page.locator('.date-chip[data-offset="2"]').click();
    await expect(page.locator('.date-chip[data-offset="2"]')).toHaveClass(/active/);
    await expect(page.locator('.date-chip[data-offset="0"]')).not.toHaveClass(/active/);
    const label = await page.locator(SEL.dateLabel).textContent();
    expect(label).not.toBe("Aujourd'hui");
    expect(label).not.toBe('Demain');
    expect(label!.length).toBeGreaterThan(5);
  });

  // ── Swap button ───────────────────────────────────────────────────────────

  test('swap button swaps the two input values', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.swapBtn).click();
    await expect(page.locator(SEL.origInput)).toHaveValue('Lyon');
    await expect(page.locator(SEL.destInput)).toHaveValue('Paris');
  });

  test('swap with empty fields does not crash', async ({ page }) => {
    await page.locator(SEL.swapBtn).click();
    await expect(page.locator(SEL.origInput)).toHaveValue('');
    await expect(page.locator(SEL.destInput)).toHaveValue('');
  });

  // ── Validation ────────────────────────────────────────────────────────────

  test('clicking Analyze with both fields empty stays on search screen', async ({ page }) => {
    await page.locator(SEL.analyzeBtn).click();
    // App returns early — no navigation, stays on search
    await expect(page.locator(SEL.scrSearch)).toHaveClass(/\bon\b/);
  });

  // ── Settings navigation ───────────────────────────────────────────────────

  test('"À propos des sources" opens settings screen', async ({ page }) => {
    await page.locator(SEL.goSettings).click();
    await expect(page.locator(SEL.scrSettings)).toHaveClass(/\bon\b/);
    await expect(page.locator(SEL.scrSearch)).not.toHaveClass(/\bon\b/);
  });
});
