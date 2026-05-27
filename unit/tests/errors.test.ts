import { describe, it, expect } from 'vitest';
import { classifyError } from '../lib/errors';

const e = (msg: string, name?: string): Error => {
  const err = new Error(msg);
  if (name) err.name = name;
  return err;
};

describe('classifyError — city not found', () => {
  it('FR: introuvable message', () => {
    const msg = classifyError(e('"Lyon" introuvable'), 'Lyon', 'fr');
    expect(msg).toContain('🔍');
    expect(msg).toContain('Lyon');
    expect(msg).toContain('pays');
  });

  it('EN: not found message', () => {
    const msg = classifyError(e('"London" not found'), 'London', 'en');
    expect(msg).toContain('🔍');
    expect(msg).toContain('London');
    expect(msg).toContain('country');
  });

  it('includes the context city name', () => {
    const msg = classifyError(e('"Berlin" introuvable'), 'Berlin', 'fr');
    expect(msg).toContain('Berlin');
  });
});

describe('classifyError — HTTP 5xx', () => {
  it('FR: server error', () => {
    const msg = classifyError(e('Open-Meteo HTTP 500'), '', 'fr');
    expect(msg).toContain('⚙️');
    expect(msg).toContain('indisponible');
  });

  it('EN: server error', () => {
    const msg = classifyError(e('BAN HTTP 503'), '', 'en');
    expect(msg).toContain('⚙️');
    expect(msg).toContain('unavailable');
  });

  it('matches 502, 503, 504', () => {
    for (const code of [502, 503, 504]) {
      const msg = classifyError(e(`HTTP ${code}`), '', 'en');
      expect(msg).toContain('⚙️');
    }
  });
});

describe('classifyError — HTTP 4xx', () => {
  it('FR: shows HTTP code', () => {
    const msg = classifyError(e('BAN HTTP 401'), '', 'fr');
    expect(msg).toContain('🔒');
    expect(msg).toContain('401');
  });

  it('EN: shows HTTP code', () => {
    const msg = classifyError(e('API HTTP 403'), '', 'en');
    expect(msg).toContain('🔒');
    expect(msg).toContain('403');
  });
});

describe('classifyError — timeout / abort', () => {
  it('FR: timeout message', () => {
    const msg = classifyError(e('Request timeout'), '', 'fr');
    expect(msg).toContain('⏱');
    expect(msg).toContain('surchargé');
  });

  it('EN: AbortError name', () => {
    const msg = classifyError(e('The operation was aborted', 'AbortError'), '', 'en');
    expect(msg).toContain('⏱');
    expect(msg).toContain('overloaded');
  });
});

describe('classifyError — network error', () => {
  it('FR: Failed to fetch', () => {
    const msg = classifyError(e('Failed to fetch'), '', 'fr');
    expect(msg).toContain('🌐');
    expect(msg).toContain('réseau');
  });

  it('EN: NetworkError', () => {
    const msg = classifyError(e('NetworkError when attempting to fetch'), '', 'en');
    expect(msg).toContain('🌐');
    expect(msg).toContain('Network');
  });
});

describe('classifyError — fallback', () => {
  it('returns cleaned raw message for unknown errors', () => {
    const msg = classifyError(e('Something unexpected'), 'ctx', 'fr');
    expect(msg).toBe('Something unexpected');
  });

  it('strips "Error: " prefix', () => {
    const msg = classifyError(e('Error: Something bad'), 'ctx', 'en');
    expect(msg).toBe('Something bad');
  });

  it('handles null error gracefully', () => {
    const msg = classifyError(null, 'ctx', 'en');
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});
