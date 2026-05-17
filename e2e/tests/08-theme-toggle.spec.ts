/**
 * 08-theme-toggle.spec.ts
 *
 * Tests for the light/dark mode toggle.
 * No @live → offline, no network calls needed.
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, runMockedAnalysis, mockGoodConditions } from './helpers';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getTheme(page: any): Promise<string> {
  return page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark');
}

async function getToggleEmoji(page: any, id = 'theme-toggle'): Promise<string> {
  return page.locator(`#${id}`).textContent();
}

// ── Initial state ─────────────────────────────────────────────────────────────

test.describe('Theme toggle — initial state', () => {

  test('default theme is dark (no prior preference)', async ({ page }) => {
    await page.context().clearCookies();
    // Clear localStorage before navigating
    await page.addInitScript(() => { try { localStorage.removeItem('tripmind-theme'); } catch(e) {} });
    await gotoSearch(page);
    const theme = await getTheme(page);
    expect(theme).toBe('dark');
  });

  test('theme-toggle button is visible on search screen', async ({ page }) => {
    await gotoSearch(page);
    await expect(page.locator('#theme-toggle')).toBeVisible();
  });

  test('toggle button shows ☀️ in dark mode', async ({ page }) => {
    await gotoSearch(page);
    const emoji = await getToggleEmoji(page);
    expect(emoji.trim()).toBe('☀️');
  });

  test('toggle button has correct aria-label in dark mode', async ({ page }) => {
    await gotoSearch(page);
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-label', 'Passer en mode clair');
  });
});

// ── Toggle behaviour ──────────────────────────────────────────────────────────

test.describe('Theme toggle — switching', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.removeItem('tripmind-theme'); } catch(e) {} });
    await gotoSearch(page);
  });

  test('clicking toggle switches dark → light', async ({ page }) => {
    await page.locator('#theme-toggle').click();
    expect(await getTheme(page)).toBe('light');
  });

  test('clicking toggle twice returns to dark', async ({ page }) => {
    await page.locator('#theme-toggle').click();
    await page.locator('#theme-toggle').click();
    expect(await getTheme(page)).toBe('dark');
  });

  test('emoji changes to 🌙 in light mode', async ({ page }) => {
    await page.locator('#theme-toggle').click();
    const emoji = await getToggleEmoji(page);
    expect(emoji.trim()).toBe('🌙');
  });

  test('aria-label updates to "Passer en mode sombre" in light mode', async ({ page }) => {
    await page.locator('#theme-toggle').click();
    await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-label', 'Passer en mode sombre');
  });

  test('data-theme="light" set on <html> element after click', async ({ page }) => {
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

// ── CSS variables change ──────────────────────────────────────────────────────

test.describe('Theme toggle — CSS variables', () => {

  test('light mode sets a light background color on body', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.removeItem('tripmind-theme'); } catch(e) {} });
    await gotoSearch(page);
    await page.locator('#theme-toggle').click();
    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    // Light mode --bg0 is #F0F4FF → rgb(240, 244, 255)
    // Should NOT be the dark bg rgb(7, 13, 26) = #070D1A
    expect(bg).not.toBe('rgb(7, 13, 26)');
  });

  test('dark mode keeps dark background on body', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.removeItem('tripmind-theme'); } catch(e) {} });
    await gotoSearch(page);
    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    // Dark mode --bg0 is #070D1A → rgb(7, 13, 26)
    expect(bg).toBe('rgb(7, 13, 26)');
  });
});

// ── localStorage persistence ──────────────────────────────────────────────────

test.describe('Theme toggle — persistence', () => {

  test('theme preference is saved to localStorage', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.removeItem('tripmind-theme'); } catch(e) {} });
    await gotoSearch(page);
    await page.locator('#theme-toggle').click();
    const saved = await page.evaluate(() => {
      try { return localStorage.getItem('tripmind-theme'); } catch(e) { return null; }
    });
    expect(saved).toBe('light');
  });

  test('light theme persists after page reload', async ({ page }) => {
    // Load page first, then set localStorage directly — addInitScript would
    // re-run on reload and erase the saved value, so we use evaluate instead
    await gotoSearch(page);
    await page.evaluate(() => { try { localStorage.setItem('tripmind-theme', 'light'); } catch(e) {} });
    await page.reload({ waitUntil: 'domcontentloaded' });
    expect(await getTheme(page)).toBe('light');
  });

  test('dark theme persists after page reload', async ({ page }) => {
    await gotoSearch(page);
    await page.evaluate(() => { try { localStorage.setItem('tripmind-theme', 'dark'); } catch(e) {} });
    await page.reload({ waitUntil: 'domcontentloaded' });
    expect(await getTheme(page)).toBe('dark');
  });
});

// ── Dashboard toggle ──────────────────────────────────────────────────────────

test.describe('Theme toggle — dashboard button', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.removeItem('tripmind-theme'); } catch(e) {} });
  });

  test('dashboard has its own theme-toggle-dash button', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await expect(page.locator('#theme-toggle-dash')).toBeVisible();
  });

  test('dashboard toggle switches to light mode', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await page.locator('#theme-toggle-dash').click();
    expect(await getTheme(page)).toBe('light');
  });

  test('dashboard toggle syncs emoji on search screen toggle too', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await page.locator('#theme-toggle-dash').click();
    // Go back to search screen and check the toggle emoji there
    await page.locator(SEL.backBtn).click();
    const emoji = await getToggleEmoji(page, 'theme-toggle');
    expect(emoji.trim()).toBe('🌙'); // light mode → 🌙
  });

  test('clicking dashboard toggle twice stays in dark mode', async ({ page }) => {
    await runMockedAnalysis(page, mockGoodConditions);
    await page.locator('#theme-toggle-dash').click(); // → light
    await page.locator('#theme-toggle-dash').click(); // → dark
    expect(await getTheme(page)).toBe('dark');
  });

  test('light mode applied from search screen is visible on dashboard', async ({ page }) => {
    await mockGoodConditions(page);
    await gotoSearch(page);
    await page.locator('#theme-toggle').click(); // switch to light before analysis
    expect(await getTheme(page)).toBe('light');
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    // Theme should still be light on dashboard
    expect(await getTheme(page)).toBe('light');
  });
});
