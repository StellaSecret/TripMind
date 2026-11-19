/**
 * score.ts — Pure score calculation logic extracted from app.js
 * Kept in sync with SCORE_WEIGHTS and calcScore in app.js
 */

export const SCORE_WEIGHTS = {
  wmo:      { storm: 25, freezing: 22, heavyRain: 18, snow: 15, rain: 12, drizzle: 7, fog: 5, cloudy: 3 },
  precip:   { veryHigh: 30, high: 18, moderate: 8, low: 3 },
  temp:     { extreme: 10, uncomfortable: 5 },
  wind:     { severe: 8, strong: 5, moderate: 2 },
  uv:       { extreme: 6, veryHigh: 4, high: 2 },
  humidity: { veryHigh: 3, high: 2 },
  aqi:      { veryPoor: 25, poor: 15, moderate: 8, fair: 3 },
  pollen:   { veryHigh: 12, high: 7, moderate: 3 },
};

export interface WeatherInput {
  code: number | null | undefined;
  temp: number;
  feels?: number | null;
  tmax?: number | null;
  tmin?: number | null;
  precipProb?: number | null;
  clouds?: number | null;
  humidity?: number | null;
  wind?: number | null;
  uv?: number | null;
}

export interface AirInput {
  aqi: number | null;
  polMax: number;
}

export function calcScore(m: WeatherInput, aq: AirInput): number {
  let s = 100;
  const w = SCORE_WEIGHTS;
  const num = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null;
  const c     = num(m.code);
  const pp    = num(m.precipProb);
  const cl    = num(m.clouds);
  const wind  = num(m.wind);
  const uv    = num(m.uv);
  const hum   = num(m.humidity);
  const feels = num(m.feels);
  const tmax  = num(m.tmax);
  const tmin  = num(m.tmin);

  // Weather: use the worse of WMO condition and precipitation probability.
  let weatherPenalty = 0;
  if      (c === null) weatherPenalty = w.wmo.cloudy;
  else if (c >= 95) weatherPenalty = w.wmo.storm;
  else if (c === 56 || c === 57 || c === 66 || c === 67) weatherPenalty = w.wmo.freezing;
  else if (c === 85 || c === 86) weatherPenalty = w.wmo.snow;
  else if (c >= 80) weatherPenalty = w.wmo.heavyRain;
  else if (c >= 71 && c <= 77) weatherPenalty = w.wmo.snow;
  else if (c >= 61) weatherPenalty = w.wmo.rain;
  else if (c >= 51) weatherPenalty = w.wmo.drizzle;
  else if (c >= 45) weatherPenalty = w.wmo.fog;
  else if (c >= 3)  weatherPenalty = w.wmo.cloudy;

  // WMO codes 0–2 can still be heavily overcast.
  if (cl !== null && cl >= 80 && weatherPenalty < w.wmo.cloudy) {
    weatherPenalty = w.wmo.cloudy;
  }

  let precipPenalty = 0;
  if      (pp !== null && pp >= 80) precipPenalty = w.precip.veryHigh;
  else if (pp !== null && pp >= 60) precipPenalty = w.precip.high;
  else if (pp !== null && pp >= 40) precipPenalty = w.precip.moderate;
  else if (pp !== null && pp >= 20) precipPenalty = w.precip.low;

  s -= Math.max(weatherPenalty, precipPenalty);

  // Temperature: use the worst of current, feels-like and daily extremes.
  const tempPenalty = (t: number | null): number => {
    if (t === null) return 0;
    if (t < 0 || t > 37) return w.temp.extreme;
    if (t < 5 || t > 33) return w.temp.uncomfortable;
    return 0;
  };
  s -= Math.max(
    tempPenalty(num(m.temp)),
    tempPenalty(feels),
    tempPenalty(tmax),
    tempPenalty(tmin)
  );

  // Wind
  if (wind !== null) {
    if      (wind >= 70) s -= w.wind.severe;
    else if (wind >= 50) s -= w.wind.strong;
    else if (wind >= 30) s -= w.wind.moderate;
  }

  // UV
  if (uv !== null) {
    if      (uv >= 11) s -= w.uv.extreme;
    else if (uv >= 8)  s -= w.uv.veryHigh;
    else if (uv >= 6)  s -= w.uv.high;
  }

  // Humidity
  if (hum !== null) {
    if      (hum >= 95) s -= w.humidity.veryHigh;
    else if (hum >= 85) s -= w.humidity.high;
  }

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
