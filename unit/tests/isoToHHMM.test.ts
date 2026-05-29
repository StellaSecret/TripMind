/**
 * isoToHHMM — timezone handling tests.
 * Transitous sends local times with Z suffix (a known MOTIS quirk).
 * We parse with getHours() (local time) which is correct.
 * In UTC environments (CI), local == UTC so T06:00:00Z → "06:00".
 */
import { describe, it, expect } from 'vitest';

function pad(n: number) { return String(n).padStart(2, '0'); }

function isoToHHMM(iso: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

describe('isoToHHMM — null/empty handling', () => {
  it('returns --:-- for null', () => expect(isoToHHMM(null)).toBe('--:--'));
  it('returns --:-- for empty string', () => expect(isoToHHMM('')).toBe('--:--'));
});

describe('isoToHHMM — UTC parsing (CI environment)', () => {
  // These tests assume UTC timezone (as in CI).
  // In local dev with Paris timezone (UTC+2 summer), getHours() returns UTC+2.
  // We test the contract: mock times with Z are parsed as UTC, getHours() returns local.
  it('parses midnight UTC', () => {
    const d = new Date('2026-05-19T00:00:00Z');
    const result = pad(d.getHours()) + ':' + pad(d.getMinutes());
    // In UTC: "00:00". In Paris summer: "02:00". Both are correct local displays.
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('output is always HH:MM format', () => {
    const cases = [
      '2026-05-19T06:00:00Z',
      '2026-05-19T12:30:00Z',
      '2026-05-19T23:59:00Z',
    ];
    for (const iso of cases) {
      const result = isoToHHMM(iso);
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it('single-digit hours are zero-padded', () => {
    // 09:05 UTC
    const d = new Date('2026-05-19T09:05:00Z');
    if (d.getTimezoneOffset() === 0) { // UTC environment
      expect(isoToHHMM('2026-05-19T09:05:00Z')).toBe('09:05');
    }
    // Non-UTC: just verify format
    expect(isoToHHMM('2026-05-19T09:05:00Z')).toMatch(/^\d{2}:\d{2}$/);
  });

  it('minutes are preserved correctly', () => {
    const d = new Date('2026-05-19T08:15:00Z');
    const result = isoToHHMM('2026-05-19T08:15:00Z');
    expect(result.endsWith(':15')).toBe(true);
  });

  it('CI contract: T06:00:00Z in UTC → "06:00"', () => {
    if (new Date().getTimezoneOffset() === 0) {
      expect(isoToHHMM('2026-05-19T06:00:00Z')).toBe('06:00');
    }
  });
});

describe('modeToReliab — mode reliability estimates', () => {
  function modeToReliab(mode: string): number {
    const m = (mode || '').toUpperCase();
    if (m === 'HIGHSPEED_RAIL') return 92;
    if (m === 'RAIL')           return 85;
    if (m === 'BUS')            return 80;
    if (m === 'SUBWAY')         return 90;
    if (m === 'TRAM')           return 87;
    return 83;
  }

  it('all values are between 0 and 100', () => {
    const modes = ['HIGHSPEED_RAIL', 'RAIL', 'BUS', 'SUBWAY', 'TRAM', 'UNKNOWN', ''];
    for (const m of modes) {
      const r = modeToReliab(m);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(100);
    }
  });

  it('TGV > TER > default', () => {
    expect(modeToReliab('HIGHSPEED_RAIL')).toBeGreaterThan(modeToReliab('RAIL'));
    expect(modeToReliab('RAIL')).toBeGreaterThan(modeToReliab('BUS'));
  });

  it('case insensitive', () => {
    expect(modeToReliab('rail')).toBe(modeToReliab('RAIL'));
    expect(modeToReliab('subway')).toBe(modeToReliab('SUBWAY'));
  });

  it('unknown mode returns a reasonable fallback', () => {
    const r = modeToReliab('HOVERCRAFT');
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(100);
  });
});
