/**
 * Tab render cache — tabs re-use cached HTML, invalidate on DATA change.
 * All mocked, no @live.
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, mockGoodConditions, mockBadConditions,
         runMockedAnalysis, clickTab } from './helpers';

test.describe('Tab cache — basic behaviour', () => {

  test('switching tabs twice shows same content', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await clickTab(page, 'route');
    const routeContent = await page.locator(SEL.tabContent).innerHTML();
    await clickTab(page, 'overview');
    await clickTab(page, 'route');
    const routeContent2 = await page.locator(SEL.tabContent).innerHTML();
    expect(routeContent).toBe(routeContent2);
  });

  test('rapid tab switching does not corrupt content', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    for (let i = 0; i < 5; i++) {
      await clickTab(page, 'route');
      await clickTab(page, 'overview');
      await clickTab(page, 'air');
      await clickTab(page, 'sante');
      await clickTab(page, 'trains');
    }
    // All tabs should still render non-empty content
    for (const tab of ['overview', 'route', 'air', 'sante', 'trains']) {
      await clickTab(page, tab);
      const text = await page.locator(SEL.tabContent).textContent();
      expect(text!.trim().length).toBeGreaterThan(0);
    }
  });
});

test.describe('Tab cache — invalidation', () => {

  test('new analysis invalidates cache — different score shown', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    const scoreBefore = await page.locator(SEL.scoreLbl).textContent();

    await page.locator(SEL.backBtn).click();
    await runMockedAnalysis(page, mockBadConditions);
    const scoreAfter = await page.locator(SEL.scoreLbl).textContent();

    expect(scoreBefore).not.toBe(scoreAfter);
  });

  test('cache hit from ANALYSIS_CACHE still shows correct content', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    const overviewBefore = await page.locator(SEL.tabContent).innerHTML();

    await page.locator(SEL.backBtn).click();
    // Second analysis — cache hit
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 5_000 });

    await clickTab(page, 'overview');
    const overviewAfter = await page.locator(SEL.tabContent).innerHTML();
    // Content should be identical (same data, same render)
    expect(overviewAfter).toBe(overviewBefore);
  });
});
