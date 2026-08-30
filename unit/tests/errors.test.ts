import { describe, it, expect } from 'vitest';
import { classifyError } from '../lib/errors';

const e = (msg: string, name?: string): Error => {
  const err = new Error(msg);
  if (name) err.name = name;
  return err;
};

describe('classifyError — city not found', () => {
  it('FR: introuvable message (exact)', () => {
    expect(classifyError(e('"Lyon" introuvable'), 'Lyon', 'fr'))
      .toBe('🔍 Ville introuvable : "Lyon". Essayez d\'ajouter le pays (ex: "Paris, France").');
  });

  it('EN: not found message (exact)', () => {
    expect(classifyError(e('"London" not found'), 'London', 'en'))
      .toBe('🔍 City not found: "London". Try adding the country (e.g. "Paris, France").');
  });

  it('includes the context city name', () => {
    const msg = classifyError(e('"Berlin" introuvable'), 'Berlin', 'fr');
    expect(msg).toContain('Berlin');
  });
});

describe('classifyError — HTTP 5xx', () => {
  it('FR: server error (exact)', () => {
    expect(classifyError(e('Open-Meteo HTTP 500'), '', 'fr'))
      .toBe('⚙️ Un service de données est temporairement indisponible. Réessayez dans un instant.');
  });

  it('EN: server error (exact)', () => {
    expect(classifyError(e('BAN HTTP 503'), '', 'en'))
      .toBe('⚙️ A data service is temporarily unavailable. Please try again in a moment.');
  });

  it('matches 502, 503, 504', () => {
    for (const code of [502, 503, 504]) {
      const msg = classifyError(e(`HTTP ${code}`), '', 'en');
      expect(msg).toContain('⚙️');
    }
  });

  it('defaults to French when lang is omitted', () => {
    expect(classifyError(e('HTTP 500'), ''))
      .toBe('⚙️ Un service de données est temporairement indisponible. Réessayez dans un instant.');
  });
});

describe('classifyError — HTTP 4xx', () => {
  it('FR: shows HTTP code (exact)', () => {
    expect(classifyError(e('BAN HTTP 401'), '', 'fr'))
      .toBe('🔒 Accès refusé par un service de données (HTTP 401).');
  });

  it('EN: shows HTTP code (exact)', () => {
    expect(classifyError(e('API HTTP 403'), '', 'en'))
      .toBe('🔒 Access denied by a data service (HTTP 403).');
  });
});

describe('classifyError — timeout / abort', () => {
  it('FR: timeout message (exact)', () => {
    expect(classifyError(e('Request timeout'), '', 'fr'))
      .toBe('⏱ La requête a expiré. Le service est peut-être surchargé — réessayez.');
  });

  it('EN: AbortError name (exact)', () => {
    expect(classifyError(e('The operation was aborted', 'AbortError'), '', 'en'))
      .toBe('⏱ Request timed out. The service may be overloaded — try again.');
  });
});

describe('classifyError — network error', () => {
  it('FR: Failed to fetch (exact)', () => {
    expect(classifyError(e('Failed to fetch'), '', 'fr'))
      .toBe('🌐 Erreur réseau. Vérifiez votre connexion ou désactivez un VPN/proxy.');
  });

  it('EN: NetworkError (exact)', () => {
    expect(classifyError(e('NetworkError when attempting to fetch'), '', 'en'))
      .toBe('🌐 Network error. Check your connection or try disabling a VPN/proxy.');
  });

  it('FR: plain "fetch" mention alone still hits the network branch', () => {
    expect(classifyError(e('fetch aborted'), '', 'fr'))
      .toBe('🌐 Erreur réseau. Vérifiez votre connexion ou désactivez un VPN/proxy.');
  });

  it('FR: NetworkError without "fetch" mention still hits the network branch', () => {
    expect(classifyError(e('NetworkError: connection refused'), '', 'fr'))
      .toBe('🌐 Erreur réseau. Vérifiez votre connexion ou désactivez un VPN/proxy.');
  });
});

describe('classifyError — fallback', () => {
  it('returns cleaned raw message for unknown errors', () => {
    expect(classifyError(e('Something unexpected'), 'ctx', 'fr')).toBe('Something unexpected');
  });

  it('strips "Error: " prefix', () => {
    expect(classifyError(e('Error: Something bad'), 'ctx', 'en')).toBe('Something bad');
  });

  it('strips "Error:" only at the start of the message', () => {
    expect(classifyError(e('boom Error: oops'), 'ctx', 'en')).toBe('boom Error: oops');
  });

  it('strips all whitespace after "Error:"', () => {
    expect(classifyError(e('Error:    lots of spaces'), 'ctx', 'en')).toBe('lots of spaces');
  });

  it('handles null error with an exact fallback message', () => {
    expect(classifyError(null, 'ctx', 'en')).toBe('Unexpected error.');
    expect(classifyError(null, 'ctx', 'fr')).toBe('Erreur inattendue.');
  });
});