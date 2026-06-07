/**
 * score.ts — Pure score calculation logic extracted from app.js
 * Kept in sync with SCORE_WEIGHTS and calcScore in app.js
 */

export const SCORE_WEIGHTS = {
  wmo:    { storm: 25, heavyRain: 18, rain: 12, drizzle: 7, fog: 5, cloudy: 3 },
  temp:   { extreme: 10, uncomfortable: 5 },
  aqi:    { veryPoor: 25, poor: 15, moderate: 8, fair: 3 },
  pollen: { veryHigh: 12, high: 7, moderate: 3 },
};

export interface WeatherInput {
  code: number;
  temp: number;
}

export interface AirInput {
  aqi: number | null;
  polMax: number;
}

export function calcScore(m: WeatherInput, aq: AirInput): number {
  let s = 100;
  const c = m.code;
  const w = SCORE_WEIGHTS;

  // Weather
  if      (c >= 95) s -= w.wmo.storm;
  else if (c >= 80) s -= w.wmo.heavyRain;
  else if (c >= 61) s -= w.wmo.rain;
  else if (c >= 51) s -= w.wmo.drizzle;
  else if (c >= 45) s -= w.wmo.fog;
  else if (c >= 3)  s -= w.wmo.cloudy;

  // Temperature
  if      (m.temp < 0  || m.temp > 37) s -= w.temp.extreme;
  else if (m.temp < 5  || m.temp > 33) s -= w.temp.uncomfortable;

  // AQI
  const a = aq.aqi ?? 0;
  if      (a > 100) s -= w.aqi.veryPoor;
  else if (a > 80)  s -= w.aqi.poor;
  else if (a > 60)  s -= w.aqi.moderate;
  else if (a > 40)  s -= w.aqi.fair;

  // Pollen
  const p = aq.polMax ?? 0;
  if      (p > 200) s -= w.pollen.veryHigh;
  else if (p > 50)  s -= w.pollen.high;
  else if (p > 10)  s -= w.pollen.moderate;

  return Math.max(5, Math.min(100, Math.round(s)));
}

export type Lang = 'fr' | 'en';

const SC_LABELS: Record<Lang, [string, string, string]> = {
  fr: ['Bonnes conditions',  'Conditions moyennes', 'Conditions dégradées'],
  en: ['Good conditions',    'Average conditions',  'Poor conditions'],
};

/** Returns a human-readable label for a score.
 *  @param s    Score value (5–100)
 *  @param lang 'fr' (default) or 'en'
 */
export function scLbl(s: number, lang: Lang = 'fr'): string {
  const [good, avg, poor] = SC_LABELS[lang];
  if (s >= 75) return good;
  if (s >= 50) return avg;
  return poor;
}
