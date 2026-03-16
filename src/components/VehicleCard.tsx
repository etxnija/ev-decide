import { useState } from "react";
import type { Vehicle } from "../types/vehicle";
import { ScoreBar } from "./ScoreBar";
import { formatPrice, type Currency } from "../lib/formatPrice";

interface VehicleCardProps {
  vehicle: Vehicle;
  selected: boolean;
  onToggle: (id: string) => void;
  canAdd: boolean;
  score?: number;
  currency: Currency;
  exchangeRate: number;
  note: string;
  onNoteChange: (id: string, note: string) => void;
  onEdit: (v: Vehicle) => void;
  onDelete: (id: string) => void;
}

function scoreBadgeClass(score: number): string {
  if (score >= 70) return "bg-green-100 text-green-700";
  if (score >= 40) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-600";
}

export function VehicleCard({
  vehicle,
  selected,
  onToggle,
  canAdd,
  score,
  currency,
  exchangeRate,
  note,
  onNoteChange,
  onEdit,
  onDelete,
}: VehicleCardProps) {
  const disabled = !selected && !canAdd;
  const [showNote, setShowNote] = useState(!!note);
  const [localNote, setLocalNote] = useState(note);

  function handleNoteBlur() {
    onNoteChange(vehicle.id, localNote);
  }

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
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {vehicle.make}
          </p>
          <h3 className="font-semibold text-gray-900 leading-tight">
            {vehicle.model}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {vehicle.variant} · {vehicle.year}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {score !== undefined && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBadgeClass(score)}`}
            >
              {score}
            </span>
          )}
          <button
            onClick={() => onToggle(vehicle.id)}
            disabled={disabled}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
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
      </div>

      {/* Price */}
      <div className="text-xl font-bold text-gray-900">
        {formatPrice(vehicle.price_sek, currency, exchangeRate)}
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
          <p className="font-medium text-gray-800">
            {vehicle.efficiency_kwh_per_100km} kWh/100km
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">0→80% time</p>
          <p className="font-medium text-gray-800">{vehicle.charge_0_80_min} min</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 border-t border-gray-100 pt-2">
        <span>{vehicle.battery_kwh} kWh</span>
        <span>·</span>
        <span>{vehicle.cargo_l} L cargo</span>
        <span>·</span>
        <span>{vehicle.seats} seats</span>
        {vehicle.length_mm && (
          <>
            <span>·</span>
            <span>{Math.round(vehicle.length_mm / 10)} cm long</span>
          </>
        )}
        {vehicle.width_mm && (
          <>
            <span>·</span>
            <span>{Math.round(vehicle.width_mm / 10)} cm wide</span>
          </>
        )}
        {vehicle.weight_kg && (
          <>
            <span>·</span>
            <span>{vehicle.weight_kg.toLocaleString("sv-SE")} kg</span>
          </>
        )}
      </div>

      {/* Notes */}
      {showNote ? (
        <textarea
          rows={2}
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={handleNoteBlur}
          placeholder="Your notes…"
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700"
        />
      ) : (
        <button
          onClick={() => setShowNote(true)}
          className="text-xs text-gray-400 hover:text-gray-600 text-left"
        >
          + Add note
        </button>
      )}

      {/* Edit / Delete */}
      <div className="flex gap-2 border-t border-gray-100 pt-2">
        <button
          onClick={() => onEdit(vehicle)}
          className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete ${vehicle.make} ${vehicle.model}?`)) {
              onDelete(vehicle.id);
            }
          }}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
