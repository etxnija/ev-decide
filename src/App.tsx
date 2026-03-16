import { useState, useMemo, useEffect } from "react";
import type { Vehicle } from "./types/vehicle";
import { useVehicles } from "./hooks/useVehicles";
import { useNotes } from "./hooks/useNotes";
import { VehicleCard } from "./components/VehicleCard";
import { FilterBar, type Filters } from "./components/FilterBar";
import { CompareTable } from "./components/CompareTable";
import { ScoreWeightsPanel } from "./components/ScoreWeightsPanel";
import { AddEditVehicleModal } from "./components/AddEditVehicleModal";
import {
  computeScores,
  loadWeights,
  saveWeights,
  type ScoreWeights,
} from "./lib/scoring";
import type { Currency } from "./lib/formatPrice";

const MAX_COMPARE = 4;
const LS_KEY_SELECTION = "ev-decide-selection";
const LS_KEY_SETTINGS = "ev-decide-settings";

interface Settings {
  apiKey: string;
  exchangeRate: number;
}

function loadSelection(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY_SELECTION);
    if (raw) return JSON.parse(raw) as string[];
  } catch {}
  return [];
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(LS_KEY_SETTINGS);
    if (raw) return JSON.parse(raw) as Settings;
  } catch {}
  return { apiKey: "", exchangeRate: 11.5 };
}

const DEFAULT_FILTERS: Filters = { maxPrice: 1_500_000, minRange: 0, makes: [] };

export default function App() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const { notes, setNote } = useNotes();

  const [selected, setSelected] = useState<string[]>(loadSelection);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showCompare, setShowCompare] = useState(true);
  const [currency, setCurrency] = useState<Currency>("SEK");
  const [weights, setWeights] = useState<ScoreWeights>(loadWeights);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [addEditTarget, setAddEditTarget] = useState<
    { mode: "add" } | { mode: "edit"; vehicle: Vehicle } | null
  >(null);

  useEffect(() => {
    localStorage.setItem(LS_KEY_SELECTION, JSON.stringify(selected));
  }, [selected]);

  useEffect(() => {
    localStorage.setItem(LS_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    saveWeights(weights);
  }, [weights]);

  const allMakes = useMemo(
    () => [...new Set(vehicles.map((v) => v.make))].sort(),
    [vehicles]
  );

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (v.price_sek > filters.maxPrice) return false;
      if (v.range_km < filters.minRange) return false;
      if (filters.makes.length > 0 && !filters.makes.includes(v.make))
        return false;
      return true;
    });
  }, [filters, vehicles]);

  const selectedVehicles = useMemo(
    () =>
      selected
        .map((id) => vehicles.find((v) => v.id === id)!)
        .filter(Boolean),
    [selected, vehicles]
  );

  const scores = useMemo(
    () => computeScores(vehicles, weights),
    [vehicles, weights]
  );

  function toggleVehicle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < MAX_COMPARE
        ? [...prev, id]
        : prev
    );
  }

  function handleDelete(id: string) {
    setSelected((prev) => prev.filter((s) => s !== id));
    deleteVehicle(id);
  }

  function handleSaveVehicle(v: Vehicle) {
    if (addEditTarget?.mode === "edit") {
      updateVehicle(v);
    } else {
      addVehicle(v);
    }
  }

  const existingIds = useMemo(() => vehicles.map((v) => v.id), [vehicles]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">EV Decide</h1>
            <p className="text-xs text-gray-400">Electric vehicle comparison</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Currency toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-xs font-medium">
              {(["SEK", "EUR"] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1.5 transition-colors ${
                    currency === c
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Add vehicle */}
            <button
              onClick={() => setAddEditTarget({ mode: "add" })}
              className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              + Add vehicle
            </button>

            {/* Compare toggle */}
            {selected.length > 0 && (
              <button
                onClick={() => setShowCompare((s) => !s)}
                className="text-sm font-medium bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {showCompare ? "Hide" : "Show"} comparison ({selected.length})
              </button>
            )}

            {/* Settings gear */}
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="text-gray-400 hover:text-gray-700 text-lg px-1 transition-colors"
              title="Settings"
            >
              ⚙
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="border-t border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-6 items-end">
              <div className="flex flex-col gap-1 min-w-64">
                <label className="text-xs font-medium text-gray-500">
                  Anthropic API key
                </label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, apiKey: e.target.value }))
                  }
                  placeholder="sk-ant-…"
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <p className="text-xs text-gray-400">
                  Used only in your browser for URL import.
                </p>
              </div>
              <div className="flex flex-col gap-1 min-w-32">
                <label className="text-xs font-medium text-gray-500">
                  EUR exchange rate (1 EUR = ? SEK)
                </label>
                <input
                  type="number"
                  value={settings.exchangeRate}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      exchangeRate: Number(e.target.value) || 11.5,
                    }))
                  }
                  step={0.1}
                  min={1}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Compare table */}
        {selected.length > 0 && showCompare && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Comparing {selected.length} vehicle{selected.length > 1 ? "s" : ""}
            </h2>
            <CompareTable
              vehicles={selectedVehicles}
              onRemove={toggleVehicle}
              currency={currency}
              exchangeRate={settings.exchangeRate}
              scores={scores}
              notes={notes}
            />
          </section>
        )}

        {/* Filters */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          allMakes={allMakes}
          currency={currency}
          exchangeRate={settings.exchangeRate}
        />

        {/* Score weights */}
        <ScoreWeightsPanel weights={weights} onChange={setWeights} />

        {/* Catalog */}
        <section>
          <p className="text-xs text-gray-400 mb-3">
            {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""}
            {selected.length > 0 &&
              ` · ${selected.length}/${MAX_COMPARE} selected for comparison`}
          </p>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              No vehicles match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  selected={selected.includes(v.id)}
                  onToggle={toggleVehicle}
                  canAdd={selected.length < MAX_COMPARE}
                  score={scores.get(v.id)}
                  currency={currency}
                  exchangeRate={settings.exchangeRate}
                  note={notes[v.id] ?? ""}
                  onNoteChange={setNote}
                  onEdit={(vehicle) =>
                    setAddEditTarget({ mode: "edit", vehicle })
                  }
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Add/Edit modal */}
      {addEditTarget && (
        <AddEditVehicleModal
          vehicle={
            addEditTarget.mode === "edit" ? addEditTarget.vehicle : undefined
          }
          onSave={handleSaveVehicle}
          onClose={() => setAddEditTarget(null)}
          apiKey={settings.apiKey}
          existingIds={existingIds}
        />
      )}
    </div>
  );
}
