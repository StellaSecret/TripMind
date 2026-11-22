import { describe, it, expect } from 'vitest';
import { arrivalTime, effectiveHour, effectiveMinute, hourlyIndex } from '../lib/time';

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

describe('effectiveMinute', () => {
  it('future date keeps the chosen minute', () => {
    expect(effectiveMinute(3, 8, 45, 14, 10)).toBe(45);
  });

  it('today with a future chosen time keeps the chosen minute', () => {
    expect(effectiveMinute(0, 16, 45, 14, 10)).toBe(45);
  });

  it('today with a past chosen time uses the current minute', () => {
    expect(effectiveMinute(0, 9, 0, 14, 37)).toBe(37);
  });
});

describe('arrivalTime', () => {
  it('adds the route duration within the same day', () => {
    expect(arrivalTime('2026-11-22', 8, 0, 3600, '2026-11-22'))
      .toEqual({ date: '2026-11-22', hour: 9, minute: 0, offset: 0 });
  });

  it('rolls over to the next day', () => {
    expect(arrivalTime('2026-11-22', 23, 30, 3600, '2026-11-22'))
      .toEqual({ date: '2026-11-23', hour: 0, minute: 30, offset: 1 });
  });

  it('missing duration keeps the departure time', () => {
    expect(arrivalTime('2026-11-22', 8, 15, null, '2026-11-22'))
      .toEqual({ date: '2026-11-22', hour: 8, minute: 15, offset: 0 });
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
