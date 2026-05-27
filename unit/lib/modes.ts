/**
 * modes.ts — MODE_COSTS constants and calcModes cost/CO2 formulas
 * Extracted from app.js for independent testing.
 */

export const MODE_COSTS = {
  car: {
    fuelLPer100km:   7.0,
    fuelEurPerL:     1.85,
    tollEurPerKm:    0.09,
    tollThresholdKm: 80,
    co2gPerKm:       128,
  },
  train: {
    co2gPerKm:       1.7,
    terEurPerKm:     0.08,
    terMin:          8,
    tgvEurPerKm:     0.12,
    tgvMin:          25,
    tgvMax:          90,
    tgvThresholdKm:  150,
  },
  bus: {
    co2gPerKm:       29,
    eurPerKm:        0.05,
    minEur:          5,
    durationFactor:  1.6,
    minDistKm:       15,
  },
  carpool: {
    co2gPerKm:       51,
    eurPerKm:        0.06,
    minEur:          5,
    durationFactor:  1.1,
    minDistKm:       15,
  },
  bike: {
    maxDistKm:       20,
    speedKmH:        15,
    co2gPerKm:       0,
  },
} as const;

export function carCost(distKm: number): { fuel: number; toll: number; total: number; co2kg: number } {
  const c = MODE_COSTS.car;
  const fuel = Math.round(distKm * c.fuelLPer100km / 100 * c.fuelEurPerL);
  const toll = distKm > c.tollThresholdKm ? Math.round(distKm * c.tollEurPerKm) : 0;
  return { fuel, toll, total: fuel + toll, co2kg: Math.round(c.co2gPerKm * distKm / 1000) };
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
