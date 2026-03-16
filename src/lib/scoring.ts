import type { Vehicle } from "../types/vehicle";

export interface ScoreWeights {
  price: number;
  range: number;
  efficiency: number;
  dcCharge: number;
  cargo: number;
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  price: 5,
  range: 5,
  efficiency: 5,
  dcCharge: 3,
  cargo: 3,
};

const LS_KEY = "ev-decide-weights";

export function loadWeights(): ScoreWeights {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as ScoreWeights;
  } catch {}
  return { ...DEFAULT_WEIGHTS };
}

export function saveWeights(w: ScoreWeights) {
  localStorage.setItem(LS_KEY, JSON.stringify(w));
}

export function computeScores(
  vehicles: Vehicle[],
  weights: ScoreWeights
): Map<string, number> {
  const result = new Map<string, number>();
  if (vehicles.length === 0) return result;
  if (vehicles.length === 1) {
    result.set(vehicles[0].id, 75);
    return result;
  }

  const prices = vehicles.map((v) => v.price_sek);
  const ranges = vehicles.map((v) => v.range_km);
  const efficiencies = vehicles.map((v) => v.efficiency_kwh_per_100km);
  const dcCharges = vehicles.map((v) => v.charge_dc_kw);
  const cargos = vehicles.map((v) => v.cargo_l);

  function norm(val: number, vals: number[], lowerIsBetter = false): number {
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (max === min) return 0.5;
    return lowerIsBetter ? (max - val) / (max - min) : (val - min) / (max - min);
  }

  const totalWeight =
    weights.price + weights.range + weights.efficiency + weights.dcCharge + weights.cargo;

  if (totalWeight === 0) {
    vehicles.forEach((v) => result.set(v.id, 50));
    return result;
  }

  vehicles.forEach((v, i) => {
    const score =
      (weights.price * norm(prices[i], prices, true) +
        weights.range * norm(ranges[i], ranges) +
        weights.efficiency * norm(efficiencies[i], efficiencies, true) +
        weights.dcCharge * norm(dcCharges[i], dcCharges) +
        weights.cargo * norm(cargos[i], cargos)) /
      totalWeight;
    result.set(v.id, Math.round(score * 100));
  });

  return result;
}
