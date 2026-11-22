/**
 * score.ts — Pure score calculation logic extracted from app.js
 * Kept in sync with SCORE_WEIGHTS and calcScore in app.js
 */

export const SCORE_WEIGHTS = {
  wmo:       { storm: 25, freezing: 22, heavyRain: 18, snow: 15, rain: 12, drizzle: 7, fog: 5, cloudy: 3 },
  precip:    { veryHigh: 30, high: 18, moderate: 8, low: 3 },
  precipAmt: { heavy: 18, moderate: 10, light: 4 },
  snow:      { heavy: 20, moderate: 12, light: 6 },
  visibility:{ veryPoor: 10, poor: 6, moderate: 3 },
  daylight:  { short: 4, limited: 2 },
  cloud:     { overcast: 5, cloudy: 3, partly: 1 },
  temp:      { extreme: 10, uncomfortable: 5 },
  wind:      { severe: 8, strong: 5, moderate: 2 },
  uv:        { extreme: 6, veryHigh: 4, high: 2 },
  humidity:  { veryHigh: 3, high: 2 },
  aqi:       { veryPoor: 25, poor: 15, moderate: 8, fair: 3 },
  pollutant: { high: 8, medium: 4, low: 2 },
  pollen:    { veryHigh: 12, high: 7, moderate: 3 },
};

export interface WeatherInput {
  code: number | null | undefined;
  temp: number;
  feels?: number | null;
  tmax?: number | null;
  tmin?: number | null;
  precipProb?: number | null;
  precipMm?: number | null;
  snowCm?: number | null;
  visibility?: number | null;
  gust?: number | null;
  daylight?: number | null;
  clouds?: number | null;
  humidity?: number | null;
  wind?: number | null;
  uv?: number | null;
}

export interface AirInput {
  aqi: number | null;
  polMax: number;
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  o3?: number | null;
  so2?: number | null;
  co?: number | null;
  nh3?: number | null;
  dust?: number | null;
  aod?: number | null;
}

function scoreOne(m: WeatherInput, aq: AirInput): number {
  let s = 100;
  const w = SCORE_WEIGHTS;
  const num = (v: unknown): number | null =>
    // Stryker disable next-line ConditionalExpression,LogicalOperator: finite-number guard
    typeof v === 'number' && Number.isFinite(v) ? v : null;
  const c     = num(m.code);
  const pp    = num(m.precipProb);
  const pmm   = num(m.precipMm);
  const snow  = num(m.snowCm);
  const vis   = num(m.visibility);
  const dl    = num(m.daylight);
  const cl    = num(m.clouds);
  const wind  = num(m.wind);
  const gust  = num(m.gust);
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

  let cloudPenalty = 0;
  // Stryker disable ConditionalExpression: redundant null guards
  if      (cl !== null && cl >= 90) cloudPenalty = w.cloud.overcast;
  else if (cl !== null && cl >= 70) cloudPenalty = w.cloud.cloudy;
  else if (cl !== null && cl >= 50) cloudPenalty = w.cloud.partly;
  // Stryker restore ConditionalExpression

  let precipPenalty = 0;
  // Stryker disable ConditionalExpression: redundant null guards
  if      (pp !== null && pp >= 80) precipPenalty = w.precip.veryHigh;
  else if (pp !== null && pp >= 60) precipPenalty = w.precip.high;
  else if (pp !== null && pp >= 40) precipPenalty = w.precip.moderate;
  else if (pp !== null && pp >= 20) precipPenalty = w.precip.low;
  // Stryker restore ConditionalExpression

  let precipAmtPenalty = 0;
  // Stryker disable ConditionalExpression: redundant null guards
  if      (pmm !== null && pmm >= 10) precipAmtPenalty = w.precipAmt.heavy;
  else if (pmm !== null && pmm >= 5)  precipAmtPenalty = w.precipAmt.moderate;
  else if (pmm !== null && pmm >= 1)  precipAmtPenalty = w.precipAmt.light;
  // Stryker restore ConditionalExpression

  let snowPenalty = 0;
  // Stryker disable ConditionalExpression: redundant null guards
  if      (snow !== null && snow >= 5) snowPenalty = w.snow.heavy;
  else if (snow !== null && snow >= 2) snowPenalty = w.snow.moderate;
  else if (snow !== null && snow >= 0.5) snowPenalty = w.snow.light;
  // Stryker restore ConditionalExpression

  let visibilityPenalty = 0;
  // Stryker disable ConditionalExpression: redundant null guards
  if      (vis !== null && vis < 1)  visibilityPenalty = w.visibility.veryPoor;
  else if (vis !== null && vis < 5)  visibilityPenalty = w.visibility.poor;
  else if (vis !== null && vis < 10) visibilityPenalty = w.visibility.moderate;
  // Stryker restore ConditionalExpression

  let daylightPenalty = 0;
  if      (dl !== null && dl < 4) daylightPenalty = w.daylight.short;
  else if (dl !== null && dl < 8) daylightPenalty = w.daylight.limited;

  s -= Math.max(weatherPenalty, cloudPenalty, precipPenalty,
                precipAmtPenalty, snowPenalty, visibilityPenalty, daylightPenalty);

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

  // Wind: worst of sustained speed and gusts.
  const windPenalty = (v: number | null): number => {
    // Stryker disable next-line ConditionalExpression: null falls through to zero penalty
    if (v === null) return 0;
    if      (v >= 70) return w.wind.severe;
    if      (v >= 50) return w.wind.strong;
    if      (v >= 30) return w.wind.moderate;
    return 0;
  };
  s -= Math.max(windPenalty(wind), windPenalty(gust));

  // UV
  // Stryker disable next-line ConditionalExpression: null falls through to zero penalty
  if (uv !== null) {
    if      (uv >= 11) s -= w.uv.extreme;
    else if (uv >= 8)  s -= w.uv.veryHigh;
    else if (uv >= 6)  s -= w.uv.high;
  }

  // Humidity
  // Stryker disable next-line ConditionalExpression: null falls through to zero penalty
  if (hum !== null) {
    if      (hum >= 95) s -= w.humidity.veryHigh;
    else if (hum >= 85) s -= w.humidity.high;
  }

  // Air quality: use the worse of AQI and individual pollutant thresholds.
  const a = aq.aqi ?? 0;
  let airPenalty = 0;
  if      (a > 100) airPenalty = w.aqi.veryPoor;
  else if (a > 80)  airPenalty = w.aqi.poor;
  else if (a > 60)  airPenalty = w.aqi.moderate;
  else if (a > 40)  airPenalty = w.aqi.fair;

  const pollutantPenalty = (v: number | null | undefined, high: number, medium: number, low: number): number => {
    // Stryker disable next-line ConditionalExpression,LogicalOperator: finite-number guard
    if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
    if (v >= high) return w.pollutant.high;
    if (v >= medium) return w.pollutant.medium;
    if (v >= low) return w.pollutant.low;
    return 0;
  };
  airPenalty = Math.max(
    airPenalty,
    pollutantPenalty(aq.pm25, 25, 15, 10),
    pollutantPenalty(aq.pm10, 50, 30, 20),
    pollutantPenalty(aq.no2, 40, 25, 15),
    pollutantPenalty(aq.o3, 120, 100, 80),
    pollutantPenalty(aq.so2, 125, 80, 40),
    pollutantPenalty(aq.co, 10000, 6000, 4000),
    pollutantPenalty(aq.nh3, 50, 20, 10),
    pollutantPenalty(aq.dust, 200, 100, 50),
    pollutantPenalty(aq.aod, 1.5, 1, 0.5)
  );
  s -= airPenalty;

  // Pollen
  const p = aq.polMax ?? 0;
  if      (p > 200) s -= w.pollen.veryHigh;
  else if (p > 50)  s -= w.pollen.high;
  else if (p > 10)  s -= w.pollen.moderate;

  return Math.max(5, Math.min(100, Math.round(s)));
}

export function calcScore(
  m: WeatherInput,
  aq: AirInput,
  om?: WeatherInput | null,
  oaq?: AirInput | null,
  rm?: WeatherInput | null,
  raq?: AirInput | null
): number {
  const scores = [scoreOne(m, aq)];
  if (om && oaq) scores.push(scoreOne(om, oaq));
  if (rm && raq) scores.push(scoreOne(rm, raq));
  return Math.min(...scores);
}

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface RouteInput {
  distKm?: number | null;
  durSec?: number | null;
}

export interface TravelRisk {
  risk: number;
  level: RiskLevel;
}

export const MODE_EXPOSURE = {
  car: 1, carpool: 1, bus: 0.9, bike: 1.2, train: 0.2,
};

function hazardOf(m: WeatherInput): number {
  const num = (v: unknown): number | null =>
    // Stryker disable next-line ConditionalExpression,LogicalOperator: finite-number guard
    typeof v === 'number' && Number.isFinite(v) ? v : null;
  const c = num(m.code);
  let hazard = 0;

  // Stryker disable next-line ConditionalExpression: null falls through to zero hazard
  if (c !== null) {
    if      (c >= 95) hazard += 30;
    else if (c === 56 || c === 57 || c === 66 || c === 67) hazard += 25;
    else if (c === 85 || c === 86 || (c >= 71 && c <= 77)) hazard += 20;
    else if (c >= 80) hazard += 15;
    else if (c >= 51) hazard += 5;
  }

  const pmm = num(m.precipMm);
  const snow = num(m.snowCm);
  const vis = num(m.visibility);
  const wind = num(m.wind);
  const gust = num(m.gust);
  const dl = num(m.daylight);
  // Stryker disable next-line ConditionalExpression: redundant null guard
  if (pmm !== null && pmm >= 10) hazard += 10;
  // Stryker disable next-line ConditionalExpression: redundant null guard
  if (snow !== null && snow >= 5) hazard += 10;
  if (vis !== null && vis < 5) hazard += 15;
  // Stryker disable next-line ConditionalExpression: redundant null guard
  if (wind !== null && wind >= 50) hazard += 5;
  // Stryker disable next-line ConditionalExpression: redundant null guard
  if (gust !== null && gust >= 60) hazard += 15;
  if (dl !== null) {
    if (dl < 4) hazard += 10;
    else if (dl < 8) hazard += 5;
  }
  return hazard;
}

export function calcTravelRisk(
  m: WeatherInput,
  rt?: RouteInput | null,
  om?: WeatherInput | null,
  rm?: WeatherInput | null
): TravelRisk {
  const num = (v: unknown): number | null =>
    // Stryker disable next-line ConditionalExpression,LogicalOperator: finite-number guard
    typeof v === 'number' && Number.isFinite(v) ? v : null;
  let hazard = Math.max(hazardOf(m), om ? hazardOf(om) : 0, rm ? hazardOf(rm) : 0);

  const durSec = num(rt && rt.durSec);
  // Stryker disable next-line ConditionalExpression: null falls through to zero hazard
  if (durSec !== null) {
    if (durSec >= 14400) hazard += 20;
    else if (durSec >= 7200) hazard += 10;
  }

  const risk = Math.max(0, Math.min(100, Math.round(hazard)));
  const level: RiskLevel = risk >= 60 ? 'high' : risk >= 30 ? 'moderate' : 'low';
  return { risk, level };
}

export function modeRisk(risk: number, mode: keyof typeof MODE_EXPOSURE): number {
  return Math.max(0, Math.min(100, Math.round(risk * MODE_EXPOSURE[mode])));
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
