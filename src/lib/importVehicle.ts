import Anthropic from "@anthropic-ai/sdk";
import type { Vehicle } from "../types/vehicle";

export type PartialVehicle = Partial<Omit<Vehicle, "id" | "image_url">>;

const JSON_SCHEMA = `{
  "make": string or null,
  "model": string or null,
  "variant": string or null,
  "year": number or null,
  "price_sek": number or null,
  "range_km": number or null,
  "efficiency_kwh_per_100km": number or null,
  "battery_kwh": number or null,
  "charge_dc_kw": number or null,
  "charge_ac_kw": number or null,
  "charge_0_80_min": number or null,
  "cargo_l": number or null,
  "seats": number or null,
  "length_mm": number or null,
  "width_mm": number or null,
  "weight_kg": number or null
}`;

const EXTRACTION_PROMPT = `Extract electric vehicle specifications from the text below and return ONLY a JSON object with these exact fields (use null for unknown values):
${JSON_SCHEMA}

If a price is given in EUR or another currency, convert to SEK using rate 11.5. Return ONLY valid JSON, no explanation.

Text:
`;

const URL_PROMPT = `A user wants to import electric vehicle specifications from this URL:
{URL}

Using your training knowledge about this vehicle model, extract its specifications and return ONLY a JSON object with these exact fields (use null for values you are not confident about):
${JSON_SCHEMA}

If the URL points to a specific variant, use that variant's specs. Convert prices to SEK if given in another currency (1 EUR ≈ 11.5 SEK). Return ONLY valid JSON, no explanation.`;

export async function importVehicle(
  url: string,
  apiKey: string
): Promise<{ data: PartialVehicle; corsError: boolean }> {
  let text: string;

  try {
    const res = await fetch(url);
    const html = await res.text();
    text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
    text = text.replace(/<[^>]*>/g, " ");
    text = text.replace(/\s+/g, " ").trim().slice(0, 15000);
    const data = await extractFromText(text, apiKey);
    return { data, corsError: false };
  } catch {
    // CORS or network failure — ask Claude to use its training knowledge
    const data = await extractFromUrl(url, apiKey);
    return { data, corsError: false };
  }
}

export async function extractFromText(
  text: string,
  apiKey: string
): Promise<PartialVehicle> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: EXTRACTION_PROMPT + text }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]) as PartialVehicle;
}

export async function extractFromUrl(
  url: string,
  apiKey: string
): Promise<PartialVehicle> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      { role: "user", content: URL_PROMPT.replace("{URL}", url) },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]) as PartialVehicle;
}
