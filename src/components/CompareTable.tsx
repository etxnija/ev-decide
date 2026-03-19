import type { Vehicle } from "../types/vehicle";
import { formatPrice, type Currency } from "../lib/formatPrice";

interface CompareTableProps {
  vehicles: Vehicle[];
  onRemove: (id: string) => void;
  currency: Currency;
  exchangeRate: number;
  scores: Map<string, number>;
  notes: Record<string, string>;
}

type RowDef = {
  label: string;
  getValue: (v: Vehicle) => number | null;
  format: (v: Vehicle, currency: Currency, rate: number) => string;
  best: "min" | "max" | null;
};

function makeRows(): RowDef[] {
  return [
    {
      label: "Price",
      getValue: (v) => v.price_sek,
      format: (v, currency, rate) => formatPrice(v.price_sek, currency, rate),
      best: "min",
    },
    {
      label: "Range",
      getValue: (v) => v.range_km,
      format: (v) => `${v.range_km} km`,
      best: "max",
    },
    {
      label: "Efficiency",
      getValue: (v) => v.efficiency_kwh_per_100km,
      format: (v) => `${v.efficiency_kwh_per_100km} kWh/100km`,
      best: "min",
    },
    {
      label: "Battery",
      getValue: (v) => v.battery_kwh,
      format: (v) => `${v.battery_kwh} kWh`,
      best: "max",
    },
    {
      label: "DC Charging",
      getValue: (v) => v.charge_dc_kw,
      format: (v) => `${v.charge_dc_kw} kW`,
      best: "max",
    },
    {
      label: "AC Charging",
      getValue: (v) => v.charge_ac_kw,
      format: (v) => `${v.charge_ac_kw} kW`,
      best: "max",
    },
    {
      label: "0→80% time",
      getValue: (v) => v.charge_0_80_min,
      format: (v) => `${v.charge_0_80_min} min`,
      best: "min",
    },
    {
      label: "Cargo",
      getValue: (v) => v.cargo_l,
      format: (v) => `${v.cargo_l} L`,
      best: "max",
    },
    {
      label: "Seats",
      getValue: (v) => v.seats,
      format: (v) => `${v.seats}`,
      best: "max",
    },
    {
      label: "Length",
      getValue: (v) => v.length_mm,
      format: (v) =>
        v.length_mm ? `${Math.round(v.length_mm / 10)} cm` : "—",
      best: null,
    },
    {
      label: "Width",
      getValue: (v) => v.width_mm,
      format: (v) =>
        v.width_mm ? `${Math.round(v.width_mm / 10)} cm` : "—",
      best: null,
    },
    {
      label: "Weight",
      getValue: (v) => v.weight_kg,
      format: (v) =>
        v.weight_kg ? `${v.weight_kg.toLocaleString("sv-SE")} kg` : "—",
      best: "min",
    },
    {
      label: "Carbon",
      getValue: (v) => v.carbon_kg_co2e,
      format: (v) =>
        v.carbon_kg_co2e !== null && v.carbon_kg_co2e !== undefined
          ? `${v.carbon_kg_co2e.toLocaleString("sv-SE")} kg CO₂e`
          : "—",
      best: "min",
    },
    {
      label: "Year",
      getValue: (v) => v.year,
      format: (v) => `${v.year}`,
      best: null,
    },
    {
      label: "🌮 TCO",
      getValue: (v) => v.tco?.total_sek ?? null,
      format: (v, currency, rate) =>
        v.tco
          ? `${formatPrice(v.tco.total_sek, currency, rate)} (${v.tco.years}yr)`
          : "—",
      best: "min",
    },
  ];
}

function getBestId(
  vehicles: Vehicle[],
  row: RowDef
): string | null {
  if (row.best === null || vehicles.length < 2) return null;
  const vals = vehicles
    .map((v) => ({ id: v.id, val: row.getValue(v) }))
    .filter((x): x is { id: string; val: number } => x.val !== null);
  if (vals.length < 2) return null;
  const best = vals.reduce((a, b) =>
    row.best === "max" ? (b.val > a.val ? b : a) : (b.val < a.val ? b : a)
  );
  const allSame = vals.every((v) => v.val === best.val);
  return allSame ? null : best.id;
}

export function CompareTable({
  vehicles,
  onRemove,
  currency,
  exchangeRate,
  scores,
  notes,
}: CompareTableProps) {
  if (vehicles.length === 0) return null;
  const rows = makeRows();

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left p-4 text-gray-500 font-medium w-36">Spec</th>
              {vehicles.map((v) => (
                <th key={v.id} className="p-4 text-center min-w-40">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">
                      {v.make}
                    </span>
                    <span className="font-semibold text-gray-900">{v.model}</span>
                    <span className="text-xs text-gray-500">{v.variant}</span>
                    <button
                      onClick={() => onRemove(v.id)}
                      className="text-xs text-gray-300 hover:text-red-400 transition-colors mt-1"
                    >
                      ✕ Remove
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Score row */}
            {scores.size > 0 && (
              <tr className="border-b border-gray-50 bg-gray-50">
                <td className="p-4 text-gray-500 font-medium">Score</td>
                {vehicles.map((v) => {
                  const score = scores.get(v.id);
                  const cls =
                    score !== undefined
                      ? score >= 70
                        ? "text-green-700 font-bold"
                        : score >= 40
                        ? "text-amber-700 font-bold"
                        : "text-red-600 font-bold"
                      : "text-gray-400";
                  return (
                    <td key={v.id} className={`p-4 text-center ${cls}`}>
                      {score !== undefined ? score : "—"}
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Spec rows */}
            {rows.map((row) => {
              const bestId = getBestId(vehicles, row);
              return (
                <tr
                  key={row.label}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="p-4 text-gray-500 font-medium">{row.label}</td>
                  {vehicles.map((v) => {
                    const isWinner = bestId === v.id;
                    return (
                      <td
                        key={v.id}
                        className={`p-4 text-center font-medium ${
                          isWinner ? "text-green-700 bg-green-50" : "text-gray-800"
                        }`}
                      >
                        {row.format(v, currency, exchangeRate)}
                        {isWinner && (
                          <span className="ml-1 text-green-500 text-xs">★</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Notes row */}
            <tr className="border-t border-gray-100">
              <td className="p-4 text-gray-500 font-medium">Notes</td>
              {vehicles.map((v) => (
                <td key={v.id} className="p-4 text-center text-xs text-gray-500">
                  {notes[v.id] || <span className="text-gray-300">—</span>}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
