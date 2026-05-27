/**
 * Time picker — departure hour selection for train search.
 * All mocked, no @live.
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, mockGoodConditions, runMockedAnalysis } from './helpers';

const TIME_SECTION = '#time-section';
const TIME_PICKER  = '#time-picker';

test.describe('Time picker — static layout', () => {

  test.beforeEach(async ({ page }) => { await gotoSearch(page); });

  test('time section is visible on search screen', async ({ page }) => {
    await expect(page.locator(TIME_SECTION)).toBeVisible();
  });

  test('time picker renders chips from 05:00 to 22:00', async ({ page }) => {
    const chips = page.locator(`${TIME_PICKER} .time-chip`);
    await expect(chips).toHaveCount(18); // 05→22 inclusive
  });

  test('first chip is 05:00', async ({ page }) => {
    await expect(page.locator(`${TIME_PICKER} .time-chip`).first()).toHaveText('05:00');
  });

  test('last chip is 22:00', async ({ page }) => {
    await expect(page.locator(`${TIME_PICKER} .time-chip`).last()).toHaveText('22:00');
  });

  test('exactly one chip is active by default', async ({ page }) => {
    const active = page.locator(`${TIME_PICKER} .time-chip.active`);
    await expect(active).toHaveCount(1);
  });

  test('clicking a chip makes it active and deactivates others', async ({ page }) => {
    await page.locator(`${TIME_PICKER} .time-chip`).nth(5).click(); // 10:00
    const active = page.locator(`${TIME_PICKER} .time-chip.active`);
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText('10:00');
  });
});

test.describe('Time picker — future date interaction', () => {

  test('selecting J+1 then a time updates the trains banner label', async ({ page }) => {
    await mockGoodConditions(page);
    await gotoSearch(page);
    await page.locator('.date-chip[data-offset="1"]').click();
    // Select 14:00
    await page.locator(`${TIME_PICKER} .time-chip[data-hour="14"]`).click();
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    // Click trains tab and verify the banner mentions 14h00
    await page.locator(SEL.tabTrains).click();
    await expect(page.locator(SEL.tabContent)).toContainText('14h00');
  });
});

test.describe('Time picker — cache interaction', () => {

  test('changing time clears active chip and picks new one', async ({ page }) => {
    await gotoSearch(page);
    const chip8  = page.locator(`${TIME_PICKER} .time-chip[data-hour="8"]`);
    const chip12 = page.locator(`${TIME_PICKER} .time-chip[data-hour="12"]`);
    await chip12.click();
    await expect(chip12).toHaveClass(/active/);
    await expect(chip8).not.toHaveClass(/active/);
  });
});
