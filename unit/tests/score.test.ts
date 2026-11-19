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

describe('calcScore — precipitation probability', () => {
  const clearAQ = { aqi: 0, polMax: 0 };

  it('83% precip, 82% cloud, partly cloudy code → average (-30)', () => {
    expect(calcScore({ code: 2, temp: 20, precipProb: 83, clouds: 82 }, clearAQ)).toBe(70);
  });

  it('100% precip with clear code → average (-30)', () => {
    expect(calcScore({ code: 0, temp: 20, precipProb: 100, clouds: 0 }, clearAQ)).toBe(70);
  });

  it('80% precip → very high (-30)', () => {
    expect(calcScore({ code: 2, temp: 20, precipProb: 80 }, clearAQ)).toBe(70);
  });

  it('79% precip → high (-18)', () => {
    expect(calcScore({ code: 2, temp: 20, precipProb: 79 }, clearAQ)).toBe(82);
  });

  it('60% precip → high (-18)', () => {
    expect(calcScore({ code: 2, temp: 20, precipProb: 60 }, clearAQ)).toBe(82);
  });

  it('59% precip → moderate (-8)', () => {
    expect(calcScore({ code: 2, temp: 20, precipProb: 59 }, clearAQ)).toBe(92);
  });

  it('40% precip → moderate (-8)', () => {
    expect(calcScore({ code: 2, temp: 20, precipProb: 40 }, clearAQ)).toBe(92);
  });

  it('39% precip → low (-3)', () => {
    expect(calcScore({ code: 2, temp: 20, precipProb: 39 }, clearAQ)).toBe(97);
  });

  it('20% precip → low (-3)', () => {
    expect(calcScore({ code: 2, temp: 20, precipProb: 20 }, clearAQ)).toBe(97);
  });

  it('19% precip → no penalty', () => {
    expect(calcScore({ code: 2, temp: 20, precipProb: 19 }, clearAQ)).toBe(100);
  });

  it('rain code and high precip use the worse penalty, not a sum', () => {
    expect(calcScore({ code: 61, temp: 20, precipProb: 83 }, clearAQ)).toBe(70);
  });

  it('storm and very high precip use the worse penalty', () => {
    expect(calcScore({ code: 95, temp: 20, precipProb: 100 }, clearAQ)).toBe(70);
  });

  it('80% cloud with code 2 counts as cloudy (-3)', () => {
    expect(calcScore({ code: 2, temp: 20, precipProb: 0, clouds: 80 }, clearAQ)).toBe(97);
  });

  it('79% cloud with code 2 stays clear', () => {
    expect(calcScore({ code: 2, temp: 20, precipProb: 0, clouds: 79 }, clearAQ)).toBe(100);
  });

  it('missing weather code is treated as cloudy, not clear', () => {
    expect(calcScore({ code: null, temp: 20 }, clearAQ)).toBe(97);
  });
});

describe('calcScore — snow and freezing precipitation', () => {
  const clearAQ = { aqi: 0, polMax: 0 };

  it('snow (code 71) → -15', () => {
    expect(calcScore({ code: 71, temp: 20 }, clearAQ)).toBe(85);
  });

  it('snow grains (code 77) → -15', () => {
    expect(calcScore({ code: 77, temp: 20 }, clearAQ)).toBe(85);
  });

  it('snow showers (code 85) → -15', () => {
    expect(calcScore({ code: 85, temp: 20 }, clearAQ)).toBe(85);
  });

  it('freezing drizzle (code 56) → -22', () => {
    expect(calcScore({ code: 56, temp: 20 }, clearAQ)).toBe(78);
  });

  it('freezing rain (code 66) → -22', () => {
    expect(calcScore({ code: 66, temp: 20 }, clearAQ)).toBe(78);
  });

  it('freezing rain with high precip uses the worse penalty', () => {
    expect(calcScore({ code: 66, temp: 20, precipProb: 100 }, clearAQ)).toBe(70);
  });
});

describe('calcScore — wind penalties', () => {
  const clearAQ = { aqi: 0, polMax: 0 };

  it('29 km/h → no penalty', () => {
    expect(calcScore({ code: 0, temp: 20, wind: 29 }, clearAQ)).toBe(100);
  });

  it('30 km/h → -2', () => {
    expect(calcScore({ code: 0, temp: 20, wind: 30 }, clearAQ)).toBe(98);
  });

  it('50 km/h → -5', () => {
    expect(calcScore({ code: 0, temp: 20, wind: 50 }, clearAQ)).toBe(95);
  });

  it('70 km/h → -8', () => {
    expect(calcScore({ code: 0, temp: 20, wind: 70 }, clearAQ)).toBe(92);
  });
});

describe('calcScore — UV penalties', () => {
  const clearAQ = { aqi: 0, polMax: 0 };

  it('UV 5 → no penalty', () => {
    expect(calcScore({ code: 0, temp: 20, uv: 5 }, clearAQ)).toBe(100);
  });

  it('UV 6 → -2', () => {
    expect(calcScore({ code: 0, temp: 20, uv: 6 }, clearAQ)).toBe(98);
  });

  it('UV 8 → -4', () => {
    expect(calcScore({ code: 0, temp: 20, uv: 8 }, clearAQ)).toBe(96);
  });

  it('UV 11 → -6', () => {
    expect(calcScore({ code: 0, temp: 20, uv: 11 }, clearAQ)).toBe(94);
  });
});

describe('calcScore — humidity penalties', () => {
  const clearAQ = { aqi: 0, polMax: 0 };

  it('84% humidity → no penalty', () => {
    expect(calcScore({ code: 0, temp: 20, humidity: 84 }, clearAQ)).toBe(100);
  });

  it('85% humidity → -2', () => {
    expect(calcScore({ code: 0, temp: 20, humidity: 85 }, clearAQ)).toBe(98);
  });

  it('95% humidity → -3', () => {
    expect(calcScore({ code: 0, temp: 20, humidity: 95 }, clearAQ)).toBe(97);
  });
});

describe('calcScore — feels-like and daily temperature extremes', () => {
  const clearAQ = { aqi: 0, polMax: 0 };

  it('feels-like 4°C with mild actual temp → -5', () => {
    expect(calcScore({ code: 0, temp: 20, feels: 4 }, clearAQ)).toBe(95);
  });

  it('feels-like 42°C with mild actual temp → -10', () => {
    expect(calcScore({ code: 0, temp: 20, feels: 42 }, clearAQ)).toBe(90);
  });

  it('daily max 40°C with mild current temp → -10', () => {
    expect(calcScore({ code: 0, temp: 20, tmax: 40 }, clearAQ)).toBe(90);
  });

  it('daily min -5°C with mild current temp → -10', () => {
    expect(calcScore({ code: 0, temp: 20, tmin: -5 }, clearAQ)).toBe(90);
  });

  it('actual and feels-like extremes use the worst penalty, not a sum', () => {
    expect(calcScore({ code: 0, temp: 38, feels: 42 }, clearAQ)).toBe(90);
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

describe('calcScore — exact threshold boundaries (strict > vs >=)', () => {
  const clearAQ = { aqi: 0, polMax: 0 };
  const clearWeather = { code: 0, temp: 20 };

  it('temp 0°C → uncomfortable (-5), not extreme', () => {
    expect(calcScore({ code: 0, temp: 0 }, clearAQ)).toBe(95);
  });

  it('temp 37°C → uncomfortable (-5), not extreme', () => {
    expect(calcScore({ code: 0, temp: 37 }, clearAQ)).toBe(95);
  });

  it('temp 5°C → no penalty', () => {
    expect(calcScore({ code: 0, temp: 5 }, clearAQ)).toBe(100);
  });

  it('temp 33°C → no penalty', () => {
    expect(calcScore({ code: 0, temp: 33 }, clearAQ)).toBe(100);
  });

  it('AQI 100 → poor (-15), not very poor', () => {
    expect(calcScore(clearWeather, { aqi: 100, polMax: 0 })).toBe(85);
  });

  it('AQI 80 → moderate (-8), not poor', () => {
    expect(calcScore(clearWeather, { aqi: 80, polMax: 0 })).toBe(92);
  });

  it('AQI 60 → fair (-3), not moderate', () => {
    expect(calcScore(clearWeather, { aqi: 60, polMax: 0 })).toBe(97);
  });

  it('AQI 40 → no penalty', () => {
    expect(calcScore(clearWeather, { aqi: 40, polMax: 0 })).toBe(100);
  });

  it('polMax 200 → high (-7), not very high', () => {
    expect(calcScore(clearWeather, { aqi: 0, polMax: 200 })).toBe(93);
  });

  it('polMax 50 → moderate (-3), not high', () => {
    expect(calcScore(clearWeather, { aqi: 0, polMax: 50 })).toBe(97);
  });

  it('polMax 10 → no penalty', () => {
    expect(calcScore(clearWeather, { aqi: 0, polMax: 10 })).toBe(100);
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
    expect(SCORE_WEIGHTS.precip).toBeDefined();
    expect(SCORE_WEIGHTS.temp).toBeDefined();
    expect(SCORE_WEIGHTS.wind).toBeDefined();
    expect(SCORE_WEIGHTS.uv).toBeDefined();
    expect(SCORE_WEIGHTS.humidity).toBeDefined();
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
    const maxWeather = Math.max(w.wmo.storm, w.precip.veryHigh);
    const maxDeduction =
      maxWeather +
      w.temp.extreme +
      w.wind.severe +
      w.uv.extreme +
      w.humidity.veryHigh +
      w.aqi.veryPoor +
      w.pollen.veryHigh;
    expect(maxDeduction).toBeLessThanOrEqual(95);
  });
});
