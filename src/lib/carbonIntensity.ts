export function calcCarbon(
  make: string,
  price_sek: number,
  intensityMap: Record<string, number>
): number | null {
  const i = intensityMap[make];
  return i ? Math.round(price_sek * i) : null;
}
