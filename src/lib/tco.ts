import type { Vehicle } from "../types/vehicle";

export interface BrandTcoEntry {
  make: string;
  warrantyYears: number;
  residualValuePercent: number;
  annualMaintenanceSek: number;
  warrantyMaintenanceSek: number;
}

export interface TcoSettings {
  years: number;
  annualKm: number;
  electricityPriceSek: number;
  annualMaintenanceSek: number;
  warrantyYears: number;
  warrantyMaintenanceSek: number;
  residualValuePercent: number;
}

export interface TcoResult {
  total_sek: number;
  electricity_sek: number;
  maintenance_sek: number;
  residual_sek: number;
  years: number;
}

export const DEFAULT_TCO_SETTINGS: TcoSettings = {
  years: 5,
  annualKm: 15000,
  electricityPriceSek: 2.0,
  annualMaintenanceSek: 5000,
  warrantyYears: 3,
  warrantyMaintenanceSek: 1000,
  residualValuePercent: 45,
};

export function calcTco(
  vehicle: Vehicle,
  s: TcoSettings,
  brandParams?: BrandTcoEntry
): TcoResult {
  const warrantyYears = brandParams?.warrantyYears ?? s.warrantyYears;
  const residualValuePercent = brandParams?.residualValuePercent ?? s.residualValuePercent;
  const annualMaintenanceSek = brandParams?.annualMaintenanceSek ?? s.annualMaintenanceSek;
  const warrantyMaintenanceSek = brandParams?.warrantyMaintenanceSek ?? s.warrantyMaintenanceSek;

  const electricity_sek =
    (vehicle.efficiency_kwh_per_100km / 100) * s.annualKm * s.electricityPriceSek * s.years;

  const warrantyYearsEff = Math.min(warrantyYears, s.years);
  const maintenance_sek =
    warrantyYearsEff * warrantyMaintenanceSek +
    Math.max(0, s.years - warrantyYears) * annualMaintenanceSek;

  const residual_sek = vehicle.price_sek * (residualValuePercent / 100);

  const total_sek = vehicle.price_sek - residual_sek + electricity_sek + maintenance_sek;

  return {
    total_sek: Math.round(total_sek),
    electricity_sek: Math.round(electricity_sek),
    maintenance_sek: Math.round(maintenance_sek),
    residual_sek: Math.round(residual_sek),
    years: s.years,
  };
}
