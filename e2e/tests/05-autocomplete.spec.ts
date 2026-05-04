/**
 * Autocomplete — BAN real network calls
 * Tagged @live → skipped in CI, run locally or in nightly job
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch } from './helpers';

test.describe('Autocomplete — BAN @live', () => {

  test.beforeEach(async ({ page }) => {
    await gotoSearch(page);
  });

  test('2+ chars in origin shows suggestions @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Pa');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await expect(page.locator(`${SEL.origAc} .ac-item`)).not.toHaveCount(0);
  });

  test('suggestion item contains city name @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Lyon');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await expect(page.locator(`${SEL.origAc} .ac-item .ac-city`).first()).toContainText('Lyon');
  });

  test('single char does NOT trigger suggestions @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('P');
    await page.waitForTimeout(500);
    await expect(page.locator(SEL.origAc)).not.toHaveClass(/visible/);
  });

  test('clicking a suggestion fills input and closes list @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Borde');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator(`${SEL.origAc} .ac-item`).first().click();
    await expect(page.locator(SEL.origAc)).not.toHaveClass(/visible/);
    const val = await page.locator(SEL.origInput).inputValue();
    expect(val.length).toBeGreaterThan(0);
  });

  test('Escape closes the list @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Toulouse');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator(SEL.origInput).press('Escape');
    await expect(page.locator(SEL.origAc)).not.toHaveClass(/visible/);
  });

  test('ArrowDown selects first item, Enter fills input @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Nantes');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator(SEL.origInput).press('ArrowDown');
    await expect(page.locator(`${SEL.origAc} .ac-item.selected`)).toHaveCount(1);
    await page.locator(SEL.origInput).press('Enter');
    await expect(page.locator(SEL.origAc)).not.toHaveClass(/visible/);
    const val = await page.locator(SEL.origInput).inputValue();
    expect(val.length).toBeGreaterThan(0);
  });

  test('origin input has aria-expanded="true" when list is open @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Lille');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await expect(page.locator(SEL.origInput)).toHaveAttribute('aria-expanded', 'true');
  });

  test('destination field also triggers suggestions @live', async ({ page }) => {
    await page.locator(SEL.destInput).fill('Mar');
    await expect(page.locator(SEL.destAc)).toHaveClass(/visible/, { timeout: 6_000 });
  });

  test('blurring origin closes list @live', async ({ page }) => {
    await page.locator(SEL.origInput).fill('Stras');
    await expect(page.locator(SEL.origAc)).toHaveClass(/visible/, { timeout: 6_000 });
    await page.locator(SEL.destInput).click(); // blur origin
    await page.waitForTimeout(400);
    await expect(page.locator(SEL.origAc)).not.toHaveClass(/visible/);
  });
});
