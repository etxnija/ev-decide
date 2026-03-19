import type { Vehicle } from "../types/vehicle";

export interface ScoreWeights {
  price: number;
  range: number;
  efficiency: number;
  dcCharge: number;
  cargo: number;
  carbon: number;
  tco: number;
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  price: 5,
  range: 5,
  efficiency: 5,
  dcCharge: 3,
  cargo: 3,
  carbon: 3,
  tco: 5,
};

const LS_KEY = "ev-decide-weights";

export function loadWeights(): ScoreWeights {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT_WEIGHTS, ...JSON.parse(raw) } as ScoreWeights;
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

  // For carbon: null values are treated as median (0.5 normalised)
  const carbonVals = vehicles.map((v) => v.carbon_kg_co2e);
  const knownCarbons = carbonVals.filter((c): c is number => c !== null);

  // For TCO: null values are treated as median (0.5 normalised)
  const tcoVals = vehicles.map((v) => v.tco?.total_sek ?? null);
  const knownTcos = tcoVals.filter((t): t is number => t !== null);

  function norm(val: number, vals: number[], lowerIsBetter = false): number {
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (max === min) return 0.5;
    return lowerIsBetter ? (max - val) / (max - min) : (val - min) / (max - min);
  }

  function normCarbon(val: number | null): number {
    if (val === null || knownCarbons.length < 2) return 0.5;
    return norm(val, knownCarbons, true);
  }

  function normTco(val: number | null): number {
    if (val === null || knownTcos.length < 2) return 0.5;
    return norm(val, knownTcos, true);
  }

  const totalWeight =
    weights.price + weights.range + weights.efficiency + weights.dcCharge + weights.cargo + weights.carbon + weights.tco;

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
        weights.cargo * norm(cargos[i], cargos) +
        weights.carbon * normCarbon(carbonVals[i]) +
        weights.tco * normTco(tcoVals[i])) /
      totalWeight;
    result.set(v.id, Math.round(score * 100));
  });

  return result;
}
