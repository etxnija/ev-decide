import type { Vehicle } from "../types/vehicle";
import { ScoreBar } from "./ScoreBar";

interface VehicleCardProps {
  vehicle: Vehicle;
  selected: boolean;
  onToggle: (id: string) => void;
  canAdd: boolean;
}

export function VehicleCard({ vehicle, selected, onToggle, canAdd }: VehicleCardProps) {
  const disabled = !selected && !canAdd;

  return (
    <div
      className={`bg-white rounded-xl border-2 p-4 flex flex-col gap-3 transition-all ${
        selected
          ? "border-blue-500 shadow-md shadow-blue-100"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {vehicle.make}
          </p>
          <h3 className="font-semibold text-gray-900 leading-tight">
            {vehicle.model}
          </h3>
          <p className="text-sm text-gray-500">{vehicle.variant} · {vehicle.year}</p>
        </div>
        <button
          onClick={() => onToggle(vehicle.id)}
          disabled={disabled}
          className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            selected
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : disabled
              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
              : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
          }`}
        >
          {selected ? "✓ Added" : "Compare"}
        </button>
      </div>

      {/* Price */}
      <div className="text-xl font-bold text-gray-900">
        €{vehicle.price_eur.toLocaleString("de-DE")}
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <p className="text-gray-400 text-xs">Range</p>
          <p className="font-medium text-gray-800">{vehicle.range_km} km</p>
          <ScoreBar value={vehicle.range_km} max={750} color="bg-green-500" />
        </div>
        <div>
          <p className="text-gray-400 text-xs">DC Charge</p>
          <p className="font-medium text-gray-800">{vehicle.charge_dc_kw} kW</p>
          <ScoreBar value={vehicle.charge_dc_kw} max={350} color="bg-amber-500" />
        </div>
        <div>
          <p className="text-gray-400 text-xs">Efficiency</p>
          <p className="font-medium text-gray-800">{vehicle.efficiency_kwh_per_100km} kWh/100km</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">0→80% time</p>
          <p className="font-medium text-gray-800">{vehicle.charge_0_80_min} min</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 text-xs text-gray-500 border-t border-gray-100 pt-2 mt-auto">
        <span>{vehicle.battery_kwh} kWh</span>
        <span>·</span>
        <span>{vehicle.cargo_l} L cargo</span>
        <span>·</span>
        <span>{vehicle.seats} seats</span>
      </div>
    </div>
  );
}
