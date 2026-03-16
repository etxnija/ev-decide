export type Currency = "SEK" | "EUR";

export function formatPrice(
  price_sek: number,
  currency: Currency,
  rate: number
): string {
  if (currency === "SEK") {
    return `${Math.round(price_sek).toLocaleString("sv-SE")} kr`;
  }
  const eur = price_sek / rate;
  return `€${Math.round(eur).toLocaleString("de-DE")}`;
}
