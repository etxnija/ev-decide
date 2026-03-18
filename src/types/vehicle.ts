export interface Vehicle {
  id: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  price_sek: number;
  range_km: number;
  efficiency_kwh_per_100km: number;
  battery_kwh: number;
  charge_dc_kw: number;
  charge_ac_kw: number;
  charge_0_80_min: number;
  cargo_l: number;
  seats: number;
  image_url: string;
  length_mm: number | null;
  width_mm: number | null;
  weight_kg: number | null;
  carbon_kg_co2e: number | null;
}
