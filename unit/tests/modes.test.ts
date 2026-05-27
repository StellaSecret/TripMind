import { describe, it, expect } from 'vitest';
import { MODE_COSTS, carCost, trainCost, busCost, carpoolCost } from '../lib/modes';

describe('MODE_COSTS — structure', () => {
  it('all modes are defined', () => {
    expect(MODE_COSTS.car).toBeDefined();
    expect(MODE_COSTS.train).toBeDefined();
    expect(MODE_COSTS.bus).toBeDefined();
    expect(MODE_COSTS.carpool).toBeDefined();
    expect(MODE_COSTS.bike).toBeDefined();
  });

  it('CO2 rates are in ascending order (bike < train < bus < carpool < car)', () => {
    expect(MODE_COSTS.bike.co2gPerKm).toBeLessThan(MODE_COSTS.train.co2gPerKm);
    expect(MODE_COSTS.train.co2gPerKm).toBeLessThan(MODE_COSTS.bus.co2gPerKm);
    expect(MODE_COSTS.bus.co2gPerKm).toBeLessThan(MODE_COSTS.carpool.co2gPerKm);
    expect(MODE_COSTS.carpool.co2gPerKm).toBeLessThan(MODE_COSTS.car.co2gPerKm);
  });

  it('fuel rate is positive and reasonable', () => {
    const rate = MODE_COSTS.car.fuelLPer100km / 100 * MODE_COSTS.car.fuelEurPerL;
    expect(rate).toBeGreaterThan(0.10);  // > 10 cents/km
    expect(rate).toBeLessThan(0.20);     // < 20 cents/km
  });
});

describe('carCost', () => {
  it('short trip < 80km → no toll', () => {
    const { toll } = carCost(50);
    expect(toll).toBe(0);
  });

  it('long trip > 80km → toll > 0', () => {
    const { toll } = carCost(200);
    expect(toll).toBeGreaterThan(0);
  });

  it('Paris→Lyon (462km) fuel is reasonable', () => {
    const { fuel } = carCost(462);
    expect(fuel).toBeGreaterThan(40);
    expect(fuel).toBeLessThan(80);
  });

  it('CO2 is proportional to distance', () => {
    const short = carCost(100);
    const long = carCost(200);
    expect(long.co2kg).toBeCloseTo(short.co2kg * 2, 0);
  });

  it('total = fuel + toll', () => {
    const r = carCost(300);
    expect(r.total).toBe(r.fuel + r.toll);
  });
});

describe('trainCost', () => {
  it('short trip < 150km uses TER pricing', () => {
    const { eur } = trainCost(100);
    expect(eur).toBeGreaterThanOrEqual(MODE_COSTS.train.terMin);
    expect(eur).toBeLessThan(MODE_COSTS.train.tgvMin);
  });

  it('long trip > 150km uses TGV pricing with min/max', () => {
    const { eur } = trainCost(500);
    expect(eur).toBeGreaterThanOrEqual(MODE_COSTS.train.tgvMin);
    expect(eur).toBeLessThanOrEqual(MODE_COSTS.train.tgvMax);
  });

  it('minimum TER cost is terMin', () => {
    const { eur } = trainCost(10);
    expect(eur).toBe(MODE_COSTS.train.terMin);
  });

  it('maximum TGV cost is tgvMax', () => {
    const { eur } = trainCost(2000);
    expect(eur).toBe(MODE_COSTS.train.tgvMax);
  });

  it('CO2 is very low per km', () => {
    const { co2kg } = trainCost(462);
    expect(co2kg).toBeLessThan(1); // < 1kg for Paris→Lyon
  });
});

describe('busCost', () => {
  it('minimum cost is minEur', () => {
    const { eur } = busCost(10);
    expect(eur).toBe(MODE_COSTS.bus.minEur);
  });

  it('cost scales with distance', () => {
    expect(busCost(200).eur).toBeGreaterThan(busCost(100).eur);
  });

  it('CO2 is between train and car', () => {
    const dist = 200;
    expect(busCost(dist).co2kg).toBeGreaterThan(trainCost(dist).co2kg);
    expect(busCost(dist).co2kg).toBeLessThan(carCost(dist).co2kg);
  });
});

describe('carpoolCost', () => {
  it('minimum cost is minEur', () => {
    const { eur } = carpoolCost(10);
    expect(eur).toBe(MODE_COSTS.carpool.minEur);
  });

  it('CO2 is less than solo car', () => {
    const dist = 300;
    expect(carpoolCost(dist).co2kg).toBeLessThan(carCost(dist).co2kg);
  });

  it('cost is less than solo car fuel', () => {
    const dist = 300;
    expect(carpoolCost(dist).eur).toBeLessThan(carCost(dist).fuel);
  });
});
