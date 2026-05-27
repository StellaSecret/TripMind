/**
 * Analysis result cache — ⚡ cached badge, LRU behaviour, TTL.
 * All mocked, no @live.
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, mockGoodConditions, runMockedAnalysis, clickTab } from './helpers';

test.describe('Analysis cache — cache hit', () => {

  test('second analysis of same route shows ⚡ cached badge', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    // Go back and re-analyze same route
    await page.locator(SEL.backBtn).click();
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 5_000 });
    await expect(page.locator(SEL.dashDateLabel)).toContainText('cached');
  });

  test('cache hit is instant — no loading screen shown', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await page.locator(SEL.backBtn).click();
    await page.locator(SEL.analyzeBtn).click();
    // Loading screen should not appear (or disappear within 500ms)
    const loadingVisible = await page.locator(SEL.scrLoading).isVisible();
    if (loadingVisible) {
      // If it briefly appeared, it should clear very quickly
      await expect(page.locator(SEL.scrLoading)).not.toHaveClass(/\bon\b/, { timeout: 500 });
    }
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/);
  });

  test('cached result preserves score', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    const firstScore = await page.locator(SEL.scoreLbl).textContent();
    await page.locator(SEL.backBtn).click();
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 5_000 });
    const cachedScore = await page.locator(SEL.scoreLbl).textContent();
    expect(cachedScore).toBe(firstScore);
  });

  test('fresh analysis (different route) has no cached badge', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await page.locator(SEL.backBtn).click();
    // Change destination
    await page.locator(SEL.destInput).fill('Marseille');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    const label = await page.locator(SEL.dashDateLabel).textContent();
    expect(label).not.toContain('cached');
  });
});

test.describe('Analysis cache — date/time invalidation', () => {

  test('changing date shows fresh analysis (no badge) on re-analyze', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await page.locator(SEL.backBtn).click();
    // Switch to tomorrow
    await page.locator('.date-chip[data-offset="1"]').click();
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    const label = await page.locator(SEL.dashDateLabel).textContent();
    expect(label).not.toContain('cached');
  });
});
