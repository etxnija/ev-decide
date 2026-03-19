import type { TcoSettings } from "../lib/tco";
import { DEFAULT_TCO_SETTINGS } from "../lib/tco";

interface Props {
  settings: TcoSettings;
  onChange: (s: TcoSettings) => void;
  onClose: () => void;
}

const FIELDS: {
  key: keyof TcoSettings;
  label: string;
  unit: string;
  step: number;
  min: number;
}[] = [
  { key: "years", label: "Ownership period", unit: "years", step: 1, min: 1 },
  { key: "annualKm", label: "Annual distance", unit: "km/year", step: 1000, min: 1000 },
  { key: "electricityPriceSek", label: "Electricity price", unit: "SEK/kWh", step: 0.1, min: 0.1 },
  { key: "annualMaintenanceSek", label: "Maintenance (post-warranty)", unit: "SEK/year", step: 500, min: 0 },
  { key: "warrantyYears", label: "Warranty period", unit: "years", step: 1, min: 0 },
  { key: "warrantyMaintenanceSek", label: "Maintenance (during warranty)", unit: "SEK/year", step: 100, min: 0 },
  { key: "residualValuePercent", label: "Residual value", unit: "% of price", step: 1, min: 0 },
];

export function TcoSettingsModal({ settings, onChange, onClose }: Props) {
  function set(key: keyof TcoSettings, val: number) {
    onChange({ ...settings, [key]: val });
  }

  function reset() {
    onChange({ ...DEFAULT_TCO_SETTINGS });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">🌮 TCO defaults</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Used when calculating total cost of ownership
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {FIELDS.map(({ key, label, unit, step, min }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <p className="text-xs text-gray-400">{unit}</p>
              </div>
              <input
                type="number"
                value={settings[key]}
                onChange={(e) => set(key, Number(e.target.value))}
                step={step}
                min={min}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-right w-28 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={reset}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Reset to defaults
          </button>
          <button
            onClick={onClose}
            className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
