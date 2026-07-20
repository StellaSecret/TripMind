/**
 * Time picker — departure time selection (circular HH:MM wheel) for train search.
 * All mocked, no @live.
 */
import { test, expect } from '@playwright/test';
import { SEL, gotoSearch, mockGoodConditions } from './helpers';

const TIME_SECTION = '#time-section';
const TIME_PICKER  = '#time-picker';
const NOW_BTN      = '#time-now-btn';
const ITEM_H = 36; // must match .tw-item height in app CSS

// The wheel picker renders two `.tw-col` columns in DOM order: hour, minute.
// Each column renders 3 back-to-back copies of its values for seamless
// wraparound (00 → 23 → 00 → ... and back), so items share `data-val` across
// copies — `data-copy` ("0"|"1"|"2") distinguishes which instance is which.
// Tests target `data-copy="1"` (the middle copy) since that's what's visible
// and active by default on first render.
function hourCol(page: import('@playwright/test').Page) {
  return page.locator(`${TIME_PICKER} .tw-col`).nth(0);
}
function minuteCol(page: import('@playwright/test').Page) {
  return page.locator(`${TIME_PICKER} .tw-col`).nth(1);
}
function item(col: ReturnType<typeof hourCol>, val: number, copy = 1) {
  return col.locator(`.tw-item[data-val="${val}"][data-copy="${copy}"]`);
}
async function waitForColSettled(page: import('@playwright/test').Page, colIndex: 0 | 1) {
  // A click's cosmetic recenter animation (col._programmatic) must fully
  // finish before we start synthetically poking scrollTop in a test — doing
  // both at once races the two and can leave scrollTop at a non-integer
  // row offset, throwing off every subsequent step by a row.
  await page.waitForFunction((colIndex) => {
    const col = document.querySelectorAll('#time-picker .tw-col')[colIndex] as any;
    return !col._programmatic;
  }, colIndex);
}

async function scrollRows(page: import('@playwright/test').Page, colIndex: 0 | 1, rows: number) {
  // Real scrolling fires many incremental 'scroll' events, giving the app's
  // wraparound re-centering logic repeated chances to re-anchor into the
  // middle copy. Simulating one giant jump instead would overshoot the
  // 3-copy buffer and get clamped by the browser — unrepresentative of any
  // real gesture, so we step row-by-row here instead.
  const step = rows > 0 ? 1 : -1;
  for (let i = 0; i < Math.abs(rows); i++) {
    await page.evaluate(({ colIndex, step, ITEM_H }) => {
      const col = document.querySelectorAll('#time-picker .tw-col')[colIndex] as HTMLElement;
      col.scrollTop += ITEM_H * step;
      col.dispatchEvent(new Event('scroll'));
    }, { colIndex, step, ITEM_H });
    await page.waitForTimeout(20); // let native scroll-snap settle between steps
  }
  await page.waitForTimeout(250); // let the final 120ms settle timer resolve
}

test.describe('Time picker — static layout', () => {

  test.beforeEach(async ({ page }) => { await gotoSearch(page); });

  test('time section is visible on search screen', async ({ page }) => {
    await expect(page.locator(TIME_SECTION)).toBeVisible();
  });

  test('hour column renders 3 circular copies of 00–23', async ({ page }) => {
    await expect(hourCol(page).locator('.tw-item')).toHaveCount(72); // 24 × 3 copies
    const middleCopy = hourCol(page).locator('.tw-item[data-copy="1"]');
    await expect(middleCopy).toHaveCount(24);
    await expect(middleCopy.first()).toHaveText('00');
    await expect(middleCopy.last()).toHaveText('23');
  });

  test('minute column renders 3 circular copies of 00–55 in steps of 5', async ({ page }) => {
    await expect(minuteCol(page).locator('.tw-item')).toHaveCount(36); // 12 × 3 copies
    const middleCopy = minuteCol(page).locator('.tw-item[data-copy="1"]');
    await expect(middleCopy).toHaveCount(12);
    await expect(middleCopy.first()).toHaveText('00');
    await expect(middleCopy.last()).toHaveText('55');
  });

  test('exactly one item is active in each column by default', async ({ page }) => {
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveCount(1);
    await expect(minuteCol(page).locator('.tw-item.tw-active')).toHaveCount(1);
  });

  test('clicking an hour item makes it active and deactivates the others', async ({ page }) => {
    await item(hourCol(page), 10).click();
    const active = hourCol(page).locator('.tw-item.tw-active');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText('10');
  });

  test('clicking a minute item makes it active and deactivates the others', async ({ page }) => {
    await item(minuteCol(page), 30).click();
    const active = minuteCol(page).locator('.tw-item.tw-active');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText('30');
  });

  test('the "now" button keeps exactly one active item per column', async ({ page }) => {
    await item(hourCol(page), 10).click();
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveText('10');
    await page.locator(NOW_BTN).click();
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveCount(1);
    await expect(minuteCol(page).locator('.tw-item.tw-active')).toHaveCount(1);
  });
});

test.describe('Time picker — circular wraparound', () => {

  test.beforeEach(async ({ page }) => { await gotoSearch(page); });

  test('scrolling forward past 23:xx wraps the hour to 00', async ({ page }) => {
    await item(hourCol(page), 23).click();
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveText('23');
    await waitForColSettled(page, 0);
    await scrollRows(page, 0, 1); // one row further
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveText('00');
  });

  test('scrolling backward past 00:xx wraps the hour to 23', async ({ page }) => {
    await item(hourCol(page), 0).click();
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveText('00');
    await waitForColSettled(page, 0);
    await scrollRows(page, 0, -1);
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveText('23');
  });

  test('scrolling forward past xx:55 wraps the minute to 00', async ({ page }) => {
    await item(minuteCol(page), 55).click();
    await expect(minuteCol(page).locator('.tw-item.tw-active')).toHaveText('55');
    await waitForColSettled(page, 1);
    await scrollRows(page, 1, 1);
    await expect(minuteCol(page).locator('.tw-item.tw-active')).toHaveText('00');
  });

  test('scrolling backward past xx:00 wraps the minute to 55', async ({ page }) => {
    await item(minuteCol(page), 0).click();
    await expect(minuteCol(page).locator('.tw-item.tw-active')).toHaveText('00');
    await waitForColSettled(page, 1);
    await scrollRows(page, 1, -1);
    await expect(minuteCol(page).locator('.tw-item.tw-active')).toHaveText('55');
  });

  test('hour column survives a multi-step forward wrap', async ({ page }) => {
    await item(hourCol(page), 20).click();
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveText('20');
    await waitForColSettled(page, 0);
    await scrollRows(page, 0, 6); // 20 + 6 = 26 -> 26 % 24 = 2
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveText('02');
  });

  test('hour column survives a multi-step backward wrap', async ({ page }) => {
    await item(hourCol(page), 3).click();
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveText('03');
    await waitForColSettled(page, 0);
    await scrollRows(page, 0, -6); // 3 - 6 = -3 -> wraps to 21
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveText('21');
  });
});

test.describe('Time picker — future date interaction', () => {

  test('selecting J+1 then a time updates the trains banner label', async ({ page }) => {
    await mockGoodConditions(page);
    await gotoSearch(page);
    await page.locator('.date-chip[data-offset="1"]').click();
    // Select 14:00
    await item(hourCol(page), 14).click();
    await expect(hourCol(page).locator('.tw-item.tw-active')).toHaveText('14');
    await item(minuteCol(page), 0).click();
    await expect(minuteCol(page).locator('.tw-item.tw-active')).toHaveText('00');
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
    const item8  = item(hourCol(page), 8);
    const item12 = item(hourCol(page), 12);
    await item12.click();
    await expect(item12).toHaveClass(/tw-active/);
    await expect(item8).not.toHaveClass(/tw-active/);
  });
});
