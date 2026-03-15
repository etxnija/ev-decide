import type { Vehicle } from "../types/vehicle";

interface CompareTableProps {
  vehicles: Vehicle[];
  onRemove: (id: string) => void;
}

type RowDef = {
  label: string;
  key: keyof Vehicle;
  format: (v: Vehicle) => string;
  best: "min" | "max" | null;
};

const rows: RowDef[] = [
  { label: "Price", key: "price_eur", format: (v) => `€${v.price_eur.toLocaleString("de-DE")}`, best: "min" },
  { label: "Range", key: "range_km", format: (v) => `${v.range_km} km`, best: "max" },
  { label: "Efficiency", key: "efficiency_kwh_per_100km", format: (v) => `${v.efficiency_kwh_per_100km} kWh/100km`, best: "min" },
  { label: "Battery", key: "battery_kwh", format: (v) => `${v.battery_kwh} kWh`, best: "max" },
  { label: "DC Charging", key: "charge_dc_kw", format: (v) => `${v.charge_dc_kw} kW`, best: "max" },
  { label: "AC Charging", key: "charge_ac_kw", format: (v) => `${v.charge_ac_kw} kW`, best: "max" },
  { label: "0→80% time", key: "charge_0_80_min", format: (v) => `${v.charge_0_80_min} min`, best: "min" },
  { label: "Cargo", key: "cargo_l", format: (v) => `${v.cargo_l} L`, best: "max" },
  { label: "Seats", key: "seats", format: (v) => `${v.seats}`, best: "max" },
  { label: "Year", key: "year", format: (v) => `${v.year}`, best: null },
];

function getBestId(vehicles: Vehicle[], row: RowDef): string | null {
  if (row.best === null || vehicles.length < 2) return null;
  const vals = vehicles.map((v) => ({ id: v.id, val: v[row.key] as number }));
  const best = vals.reduce((a, b) =>
    row.best === "max" ? (b.val > a.val ? b : a) : (b.val < a.val ? b : a)
  );
  // Only highlight if it's strictly better than all others
  const allSame = vals.every((v) => v.val === best.val);
  return allSame ? null : best.id;
}

export function CompareTable({ vehicles, onRemove }: CompareTableProps) {
  if (vehicles.length === 0) return null;

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
                    <span className="text-xs text-gray-400 uppercase tracking-wide">{v.make}</span>
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
            {rows.map((row) => {
              const bestId = getBestId(vehicles, row);
              return (
                <tr key={row.key} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
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
                        {row.format(v)}
                        {isWinner && <span className="ml-1 text-green-500 text-xs">★</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
