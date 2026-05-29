/**
 * URL share — hash encodes search params, page restores from hash.
 * All mocked, no @live.
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, mockGoodConditions, runMockedAnalysis } from './helpers';

const COPY_BTN = '#copy-link-btn';

test.describe('URL share — copy link button', () => {

  test('copy-link button is hidden before analysis', async ({ page }) => {
    await gotoSearch(page);
    await expect(page.locator(COPY_BTN)).toBeHidden();
  });

  test('copy-link button appears after analysis', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await expect(page.locator(COPY_BTN)).toBeVisible();
  });

  test('URL hash contains from/to after analysis', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions, 'Paris', 'Lyon');
    const url = page.url();
    expect(url).toContain('#');
    expect(url).toContain('from=Paris');
    expect(url).toContain('to=Lyon');
  });

  test('URL hash contains date offset', async ({ page }) => {
    await mockGoodConditions(page);
    await gotoSearch(page);
    await page.locator('.date-chip[data-offset="1"]').click();
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    expect(page.url()).toContain('d=1');
  });

  test('copy-link button shows ✓ after click', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    // Grant clipboard permission
    await page.context().grantPermissions(['clipboard-write']);
    await page.locator(COPY_BTN).click();
    await expect(page.locator(COPY_BTN)).toHaveText('✓', { timeout: 2_000 });
  });
});

test.describe('URL share — restore from hash', () => {

  test('page restores origin and destination from hash', async ({ page }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await mockGoodConditions(page);
    await page.goto(baseUrl + '#from=Paris&to=Lyon&d=0&h=8');
    await expect(page.locator(SEL.origInput)).toHaveValue('Paris', { timeout: 3_000 });
    await expect(page.locator(SEL.destInput)).toHaveValue('Lyon');
  });

  test('malformed hash does not crash app', async ({ page }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(baseUrl + '#not_valid_params!!!');
    // App should still load normally
    await expect(page.locator(SEL.scrSearch)).toHaveClass(/\bon\b/, { timeout: 5_000 });
  });

  test('empty hash does not affect app', async ({ page }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(baseUrl + '#');
    await expect(page.locator(SEL.scrSearch)).toHaveClass(/\bon\b/, { timeout: 5_000 });
  });

  test('hash with lang=en restores English language', async ({ page }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await mockGoodConditions(page);
    await page.goto(baseUrl + '#from=Paris&to=Lyon&d=0&h=8&lang=en');
    await expect(page.locator(SEL.analyzeBtn)).toContainText('Analyze', { timeout: 3_000 });
  });
});
