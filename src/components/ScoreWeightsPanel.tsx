import { useState } from "react";
import type { ScoreWeights } from "../lib/scoring";

interface Props {
  weights: ScoreWeights;
  onChange: (w: ScoreWeights) => void;
}

const WEIGHT_LABELS: { key: keyof ScoreWeights; label: string }[] = [
  { key: "price", label: "Price (lower is better)" },
  { key: "range", label: "Range" },
  { key: "efficiency", label: "Efficiency" },
  { key: "dcCharge", label: "DC Charge Speed" },
  { key: "cargo", label: "Cargo Volume" },
  { key: "carbon", label: "Carbon footprint" },
  { key: "tco", label: "🌮 Total Cost of Ownership" },
];

export function ScoreWeightsPanel({ weights, onChange }: Props) {
  const [open, setOpen] = useState(false);

  function setWeight(key: keyof ScoreWeights, val: number) {
    onChange({ ...weights, [key]: val });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <span>Score weights</span>
        <span className="text-gray-400 text-xs">{open ? "▲ collapse" : "▼ expand"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 border-t border-gray-100 pt-4">
          {WEIGHT_LABELS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                {label}:{" "}
                <span className="text-gray-900 font-semibold">{weights[key]}</span>
              </label>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={weights[key]}
                onChange={(e) => setWeight(key, Number(e.target.value))}
                className="accent-blue-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
