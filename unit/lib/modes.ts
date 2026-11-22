/**
 * modes.ts — MODE_COSTS constants and calcModes cost/CO2 formulas
 * Extracted from app.js for independent testing.
 */
import { MODE_COSTS } from './constants.generated';

export { MODE_COSTS };

export function carCost(distKm: number): { fuel: number; toll: number; running: number; total: number; co2kg: number } {
  const c = MODE_COSTS.car;
  const fuel = Math.round(distKm * c.fuelLPer100km / 100 * c.fuelEurPerL);
  const toll = distKm > c.tollThresholdKm ? Math.round(distKm * c.tollEurPerKm) : 0;
  const running = Math.round(distKm * c.runningEurPerKm);
  return { fuel, toll, running, total: fuel + toll + running, co2kg: Math.round(c.co2gPerKm * distKm / 1000) };
}

export function trainCost(distKm: number): { eur: number; co2kg: number } {
  const c = MODE_COSTS.train;
  const eur = distKm < c.tgvThresholdKm
    ? Math.round(Math.max(c.terMin, distKm * c.terEurPerKm))
    : Math.round(Math.min(c.tgvMax, Math.max(c.tgvMin, distKm * c.tgvEurPerKm)));
  return { eur, co2kg: +(c.co2gPerKm * distKm / 1000).toFixed(2) };
}

export function busCost(distKm: number): { eur: number; co2kg: number } {
  const c = MODE_COSTS.bus;
  return {
    eur:   Math.round(Math.max(c.minEur, distKm * c.eurPerKm)),
    co2kg: +(c.co2gPerKm * distKm / 1000).toFixed(1),
  };
}

export function carpoolCost(distKm: number): { eur: number; co2kg: number } {
  const c = MODE_COSTS.carpool;
  return {
    eur:   Math.round(Math.max(c.minEur, distKm * c.eurPerKm)),
    co2kg: +(c.co2gPerKm * distKm / 1000).toFixed(1),
  };
}
