import Anthropic from "@anthropic-ai/sdk";
import type { BrandTcoEntry } from "./tco";

const PROMPT = (makes: string[]) => `You are a knowledgeable assistant about electric vehicles sold in Sweden.

For each of these car brands, estimate typical ownership parameters:
${makes.join(", ")}

Return ONLY a JSON array with this exact schema (no markdown, no explanation):
[
  {
    "make": "BrandName",
    "warrantyYears": 3,
    "residualValuePercent": 45,
    "annualMaintenanceSek": 5000,
    "warrantyMaintenanceSek": 1000
  }
]

Guidelines (Swedish market context):
- warrantyYears: years of manufacturer warranty (typically 3–8)
- residualValuePercent: estimated % of purchase price retained after 5 years (typically 30–60)
- annualMaintenanceSek: estimated annual maintenance cost in SEK after warranty expires (typically 3 000–12 000)
- warrantyMaintenanceSek: estimated annual maintenance cost in SEK during warranty period (typically 500–2 500)

Base estimates on publicly known warranty terms, historical reliability surveys (JD Power, Consumer Reports), and Swedish market depreciation data. Include an entry for every brand listed.`;

export async function fetchBrandTcoParams(
  makes: string[],
  apiKey: string
): Promise<BrandTcoEntry[]> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: PROMPT(makes) }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON array found in response");

  const parsed = JSON.parse(jsonMatch[0]) as BrandTcoEntry[];
  return parsed.filter(
    (e) =>
      typeof e.make === "string" &&
      typeof e.warrantyYears === "number" &&
      typeof e.residualValuePercent === "number" &&
      typeof e.annualMaintenanceSek === "number" &&
      typeof e.warrantyMaintenanceSek === "number"
  );
}
