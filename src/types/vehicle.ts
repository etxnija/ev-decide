export interface Vehicle {
  id: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  price_eur: number;
  range_km: number;
  efficiency_kwh_per_100km: number;
  battery_kwh: number;
  charge_dc_kw: number;
  charge_ac_kw: number;
  charge_0_80_min: number;
  cargo_l: number;
  seats: number;
  image_url: string;
}
