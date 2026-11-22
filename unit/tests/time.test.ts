import { describe, it, expect } from 'vitest';
import { effectiveHour, hourlyIndex } from '../lib/time';

describe('effectiveHour', () => {
  it('future date keeps the chosen hour', () => {
    expect(effectiveHour(3, 8, 0, 14, 30)).toBe(8);
  });

  it('today with a future chosen time keeps the chosen hour', () => {
    expect(effectiveHour(0, 16, 30, 14, 10)).toBe(16);
  });

  it('today with a past chosen time uses the current hour', () => {
    expect(effectiveHour(0, 9, 0, 14, 10)).toBe(14);
  });

  it('today at the exact chosen minute uses the current hour', () => {
    expect(effectiveHour(0, 14, 10, 14, 10)).toBe(14);
  });

  it('today with chosen minute after now keeps the chosen hour', () => {
    expect(effectiveHour(0, 14, 11, 14, 10)).toBe(14);
  });
});

describe('hourlyIndex', () => {
  it('finds the exact local date and hour', () => {
    const times = ['2026-11-22T07:00', '2026-11-22T08:00', '2026-11-22T09:00'];
    expect(hourlyIndex(times, '2026-11-22', 9, 99)).toBe(2);
  });

  it('falls back when the hour is missing (DST)', () => {
    const times = ['2026-03-29T01:00', '2026-03-29T03:00'];
    expect(hourlyIndex(times, '2026-03-29', 2, 25)).toBe(25);
  });

  it('falls back when no time array is provided', () => {
    expect(hourlyIndex(undefined, '2026-11-22', 8, 12)).toBe(12);
  });
});
