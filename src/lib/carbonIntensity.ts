const INTENSITY: Record<string, number> = {
  Tesla:    30865 / 500000,
  BMW:      46081 / 500000,
  Mercedes: 46359 / 500000,
  Kia:      73924 / 500000,
  Polestar: 76312 / 500000,
};

export function calcCarbon(make: string, price_sek: number): number | null {
  const i = INTENSITY[make];
  return i ? Math.round(price_sek * i) : null;
}
