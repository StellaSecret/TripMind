import { describe, it, expect } from 'vitest';
import { calcScore, scLbl, SCORE_WEIGHTS, type Lang } from '../lib/score';

describe('calcScore — weather thresholds', () => {
  const clearAQ = { aqi: 0, polMax: 0 };

  it('clear sky, mild temp → 100', () => {
    expect(calcScore({ code: 0, temp: 20 }, clearAQ)).toBe(100);
  });

  it('cloudy (code 3) → -3', () => {
    expect(calcScore({ code: 3, temp: 20 }, clearAQ)).toBe(97);
  });

  it('fog (code 45) → -5', () => {
    expect(calcScore({ code: 45, temp: 20 }, clearAQ)).toBe(95);
  });

  it('drizzle (code 51) → -7', () => {
    expect(calcScore({ code: 51, temp: 20 }, clearAQ)).toBe(93);
  });

  it('rain (code 61) → -12', () => {
    expect(calcScore({ code: 61, temp: 20 }, clearAQ)).toBe(88);
  });

  it('heavy rain (code 80) → -18', () => {
    expect(calcScore({ code: 80, temp: 20 }, clearAQ)).toBe(82);
  });

  it('storm (code 95) → -25', () => {
    expect(calcScore({ code: 95, temp: 20 }, clearAQ)).toBe(75);
  });
});

describe('calcScore — temperature penalties', () => {
  const clearAQ = { aqi: 0, polMax: 0 };

  it('comfortable temp 20°C → no penalty', () => {
    expect(calcScore({ code: 0, temp: 20 }, clearAQ)).toBe(100);
  });

  it('uncomfortable temp 34°C → -5', () => {
    expect(calcScore({ code: 0, temp: 34 }, clearAQ)).toBe(95);
  });

  it('extreme temp 38°C → -10', () => {
    expect(calcScore({ code: 0, temp: 38 }, clearAQ)).toBe(90);
  });

  it('freezing -1°C → -10', () => {
    expect(calcScore({ code: 0, temp: -1 }, clearAQ)).toBe(90);
  });

  it('cold 4°C → -5', () => {
    expect(calcScore({ code: 0, temp: 4 }, clearAQ)).toBe(95);
  });
});

describe('calcScore — AQI penalties', () => {
  const clearWeather = { code: 0, temp: 20 };

  it('AQI 0 → no penalty', () => {
    expect(calcScore(clearWeather, { aqi: 0, polMax: 0 })).toBe(100);
  });

  it('AQI 41 (fair) → -3', () => {
    expect(calcScore(clearWeather, { aqi: 41, polMax: 0 })).toBe(97);
  });

  it('AQI 61 (moderate) → -8', () => {
    expect(calcScore(clearWeather, { aqi: 61, polMax: 0 })).toBe(92);
  });

  it('AQI 81 (poor) → -15', () => {
    expect(calcScore(clearWeather, { aqi: 81, polMax: 0 })).toBe(85);
  });

  it('AQI 101 (very poor) → -25', () => {
    expect(calcScore(clearWeather, { aqi: 101, polMax: 0 })).toBe(75);
  });

  it('null AQI treated as 0', () => {
    expect(calcScore(clearWeather, { aqi: null, polMax: 0 })).toBe(100);
  });
});

describe('calcScore — pollen penalties', () => {
  const clearWeather = { code: 0, temp: 20 };

  it('polMax 0 → no penalty', () => {
    expect(calcScore(clearWeather, { aqi: 0, polMax: 0 })).toBe(100);
  });

  it('polMax 11 (moderate) → -3', () => {
    expect(calcScore(clearWeather, { aqi: 0, polMax: 11 })).toBe(97);
  });

  it('polMax 51 (high) → -7', () => {
    expect(calcScore(clearWeather, { aqi: 0, polMax: 51 })).toBe(93);
  });

  it('polMax 201 (very high) → -12', () => {
    expect(calcScore(clearWeather, { aqi: 0, polMax: 201 })).toBe(88);
  });
});

describe('calcScore — combined scenarios matching Playwright tests', () => {
  it('good conditions (code=0, UV=3, AQI=25) → >= 75', () => {
    const s = calcScore({ code: 0, temp: 20 }, { aqi: 25, polMax: 8 });
    expect(s).toBeGreaterThanOrEqual(75);
  });

  it('average conditions (code=61, UV=7, AQI=80) → 50-74', () => {
    const s = calcScore({ code: 61, temp: 14 }, { aqi: 80, polMax: 60 });
    expect(s).toBeGreaterThanOrEqual(50);
    expect(s).toBeLessThan(75);
  });

  it('bad conditions (code=95, UV=10, AQI=150) → < 50', () => {
    const s = calcScore({ code: 95, temp: 38 }, { aqi: 150, polMax: 250 });
    expect(s).toBeLessThan(50);
  });

  it('minimum score is clamped to 5', () => {
    const s = calcScore({ code: 95, temp: 40 }, { aqi: 200, polMax: 300 });
    expect(s).toBeGreaterThanOrEqual(5);
  });
});

describe('scLbl — French (default)', () => {
  it('75 → Bonnes conditions', () => expect(scLbl(75)).toBe('Bonnes conditions'));
  it('100 → Bonnes conditions', () => expect(scLbl(100)).toBe('Bonnes conditions'));
  it('74 → Conditions moyennes', () => expect(scLbl(74)).toBe('Conditions moyennes'));
  it('50 → Conditions moyennes', () => expect(scLbl(50)).toBe('Conditions moyennes'));
  it('49 → Conditions dégradées', () => expect(scLbl(49)).toBe('Conditions dégradées'));
  it('5 → Conditions dégradées', () => expect(scLbl(5)).toBe('Conditions dégradées'));

  it('explicit lang="fr" matches default', () => {
    expect(scLbl(80, 'fr')).toBe(scLbl(80));
    expect(scLbl(60, 'fr')).toBe(scLbl(60));
    expect(scLbl(30, 'fr')).toBe(scLbl(30));
  });
});

describe('scLbl — English', () => {
  it('75 → Good conditions', () => expect(scLbl(75, 'en')).toBe('Good conditions'));
  it('100 → Good conditions', () => expect(scLbl(100, 'en')).toBe('Good conditions'));
  it('74 → Average conditions', () => expect(scLbl(74, 'en')).toBe('Average conditions'));
  it('50 → Average conditions', () => expect(scLbl(50, 'en')).toBe('Average conditions'));
  it('49 → Poor conditions', () => expect(scLbl(49, 'en')).toBe('Poor conditions'));
  it('5 → Poor conditions', () => expect(scLbl(5, 'en')).toBe('Poor conditions'));
});

describe('scLbl — boundary scores', () => {
  const langs: Lang[] = ['fr', 'en'];
  for (const lang of langs) {
    it(`score 75 is "good" in ${lang}`, () => {
      const label = scLbl(75, lang);
      expect(label).not.toBe(scLbl(74, lang));
    });
    it(`score 50 is "average" in ${lang}`, () => {
      const label = scLbl(50, lang);
      expect(label).not.toBe(scLbl(49, lang));
    });
  }
});

describe('SCORE_WEIGHTS — structure', () => {
  it('all penalty groups exist', () => {
    expect(SCORE_WEIGHTS.wmo).toBeDefined();
    expect(SCORE_WEIGHTS.temp).toBeDefined();
    expect(SCORE_WEIGHTS.aqi).toBeDefined();
    expect(SCORE_WEIGHTS.pollen).toBeDefined();
  });

  it('penalties are positive integers', () => {
    for (const group of Object.values(SCORE_WEIGHTS)) {
      for (const val of Object.values(group)) {
        expect(val).toBeGreaterThan(0);
        expect(Number.isInteger(val)).toBe(true);
      }
    }
  });

  it('worst case total deductions ≤ 95 (score never below 5)', () => {
    const w = SCORE_WEIGHTS;
    const maxDeduction = w.wmo.storm + w.temp.extreme + w.aqi.veryPoor + w.pollen.veryHigh;
    expect(maxDeduction).toBeLessThanOrEqual(95);
  });
});
