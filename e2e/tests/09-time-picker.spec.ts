/**
 * Time picker — departure time selection (HH:MM wheel) for train search.
 * All mocked, no @live.
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, mockGoodConditions } from './helpers';

const TIME_SECTION = '#time-section';
const TIME_PICKER  = '#time-picker';
const NOW_BTN      = '#time-now-btn';

// The wheel picker renders two `.tw-col` columns in DOM order: hour, minute.
// Both columns' items share the `data-val` attribute, so column scoping is required.
function hourCol(page: import('@playwright/test').Page) {
  return page.locator(`${TIME_PICKER} .tw-col`).nth(0);
}
function minuteCol(page: import('@playwright/test').Page) {
  return page.locator(`${TIME_PICKER} .tw-col`).nth(1);
}

test.describe('Time picker — static layout', () => {

  test.beforeEach(async ({ page }) => { await gotoSearch(page); });

  test('time section is visible on search screen', async ({ page }) => {
    await expect(page.locator(TIME_SECTION)).toBeVisible();
  });

  test('hour column renders items from 00 to 23', async ({ page }) => {
    const items = hourCol(page).locator('.tw-item');
    await expect(items).toHaveCount(24); // 00→23 inclusive
    await expect(items.first()).toHaveText('00');
    await expect(items.last()).toHaveText('23');
  });

  test('minute column renders items from 00 to 55 in steps of 5', async ({ page }) => {
    const items = minuteCol(page).locator('.tw-item');
    await expect(items).toHaveCount(12); // 00,05,...,55
    await expect(items.first()).toHaveText('00');
    await expect(items.last()).toHaveText('55');
  });

  test('exactly one item is active in each column by default', async ({ page }) => {
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveCount(1);
    await expect(minuteCol(page).locator('.tw-item.tw-active')).toHaveCount(1);
  });

  test('clicking an hour item makes it active and deactivates the others', async ({ page }) => {
    await hourCol(page).locator('.tw-item[data-val="10"]').click();
    const active = hourCol(page).locator('.tw-item.tw-active');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText('10');
  });

  test('clicking a minute item makes it active and deactivates the others', async ({ page }) => {
    await minuteCol(page).locator('.tw-item[data-val="30"]').click();
    const active = minuteCol(page).locator('.tw-item.tw-active');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText('30');
  });

  test('the "now" button keeps exactly one active item per column', async ({ page }) => {
    await hourCol(page).locator('.tw-item[data-val="10"]').click();
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveText('10');
    await page.locator(NOW_BTN).click();
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveCount(1);
    await expect(minuteCol(page).locator('.tw-item.tw-active')).toHaveCount(1);
  });
});

test.describe('Time picker — future date interaction', () => {

  test('selecting J+1 then a time updates the trains banner label', async ({ page }) => {
    await mockGoodConditions(page);
    await gotoSearch(page);
    await page.locator('.date-chip[data-offset="1"]').click();
    // Select 14:00
    await hourCol(page).locator('.tw-item[data-val="14"]').click();
    await minuteCol(page).locator('.tw-item[data-val="0"]').click();
    await page.locator(SEL.origInput).fill('Paris');
    await page.locator(SEL.destInput).fill('Lyon');
    await page.locator(SEL.analyzeBtn).click();
    await expect(page.locator(SEL.scrDash)).toHaveClass(/\bon\b/, { timeout: 15_000 });
    // Click trains tab and verify the banner mentions 14:00
    await page.locator(SEL.tabTrains).click();
    await expect(page.locator(SEL.tabContent)).toContainText('14:00');
  });
});

test.describe('Time picker — cache interaction', () => {

  test('changing hour clears the previous active item and picks the new one', async ({ page }) => {
    await gotoSearch(page);
    const item8  = hourCol(page).locator('.tw-item[data-val="8"]');
    const item12 = hourCol(page).locator('.tw-item[data-val="12"]');
    await item12.click();
    await expect(item12).toHaveClass(/tw-active/);
    await expect(item8).not.toHaveClass(/tw-active/);
  });
});
