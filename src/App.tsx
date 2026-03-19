import { useState, useMemo, useEffect } from "react";
import type { Vehicle } from "./types/vehicle";
import { useVehicles } from "./hooks/useVehicles";
import { useNotes } from "./hooks/useNotes";
import { useCarbonIntensity, type CarbonEntry } from "./hooks/useCarbonIntensity";
import { VehicleCard } from "./components/VehicleCard";
import { FilterBar, type Filters } from "./components/FilterBar";
import { CompareTable } from "./components/CompareTable";
import { ScoreWeightsPanel } from "./components/ScoreWeightsPanel";
import { AddEditVehicleModal } from "./components/AddEditVehicleModal";
import { CarbonAdminModal } from "./components/CarbonAdminModal";
import { TcoSettingsModal } from "./components/TcoSettingsModal";
import { TcoBrandModal } from "./components/TcoBrandModal";
import { useBrandTcoParams } from "./hooks/useBrandTcoParams";
import {
  computeScores,
  loadWeights,
  saveWeights,
  type ScoreWeights,
} from "./lib/scoring";
import type { Currency } from "./lib/formatPrice";
import { useGistSync } from "./hooks/useGistSync";
import { calcTco, DEFAULT_TCO_SETTINGS, type TcoSettings } from "./lib/tco";

const MAX_COMPARE = 4;
const LS_KEY_SELECTION = "ev-decide-selection";
const LS_KEY_SETTINGS = "ev-decide-settings";

interface Settings {
  apiKey: string;
  exchangeRate: number;
  usdToSekRate: number;
  gistId: string;
  gistToken: string;
  tco: TcoSettings;
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
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return {
        apiKey: "",
        exchangeRate: 11.5,
        usdToSekRate: 10.5,
        gistId: "",
        gistToken: "",
        ...parsed,
        tco: { ...DEFAULT_TCO_SETTINGS, ...(parsed.tco ?? {}) },
      };
    }
  } catch {}
  return { apiKey: "", exchangeRate: 11.5, usdToSekRate: 10.5, gistId: "", gistToken: "", tco: { ...DEFAULT_TCO_SETTINGS } };
}

const DEFAULT_FILTERS: Filters = { maxPrice: 1_500_000, minRange: 0, makes: [] };

export default function App() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle, replaceVehicles } = useVehicles();
  const { notes, setNote, replaceNotes } = useNotes();

  const [selected, setSelected] = useState<string[]>(loadSelection);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showCompare, setShowCompare] = useState(true);
  const [currency, setCurrency] = useState<Currency>("SEK");
  const [weights, setWeights] = useState<ScoreWeights>(loadWeights);
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const { entries: carbonEntries, intensityMap, addEntry, updateEntry, deleteEntry, replaceEntries } =
    useCarbonIntensity(settings.usdToSekRate);
  const [showSettings, setShowSettings] = useState(false);
  const [showCarbonAdmin, setShowCarbonAdmin] = useState(false);
  const [showTcoSettings, setShowTcoSettings] = useState(false);
  const [showTcoBrandAdmin, setShowTcoBrandAdmin] = useState(false);
  const { entries: brandTcoEntries, brandParamsMap, addEntry: addBrandEntry, updateEntry: updateBrandEntry, deleteEntry: deleteBrandEntry, replaceEntries: replaceBrandEntries } = useBrandTcoParams();
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

  const syncPayload = useMemo(
    () => ({
      vehicles,
      notes,
      carbonIntensity: carbonEntries,
      weights,
      selection: selected,
    }),
    [vehicles, notes, carbonEntries, weights, selected]
  );

  const { status: syncStatus } = useGistSync(
    settings.gistId,
    settings.gistToken,
    syncPayload,
    {
      replaceVehicles,
      replaceNotes,
      replaceEntries,
      setWeights,
      setSelected,
    }
  );

  const allMakes = useMemo(
    () => [...new Set(vehicles.map((v) => v.make))].sort(),
    [vehicles]
  );

  const scores = useMemo(
    () => computeScores(vehicles, weights),
    [vehicles, weights]
  );

  const filtered = useMemo(() => {
    return vehicles
      .filter((v) => {
        if (v.price_sek > filters.maxPrice) return false;
        if (v.range_km < filters.minRange) return false;
        if (filters.makes.length > 0 && !filters.makes.includes(v.make))
          return false;
        return true;
      })
      .sort((a, b) => (scores.get(b.id) ?? -1) - (scores.get(a.id) ?? -1));
  }, [filters, vehicles, scores]);

  const selectedVehicles = useMemo(
    () =>
      selected
        .map((id) => vehicles.find((v) => v.id === id)!)
        .filter(Boolean),
    [selected, vehicles]
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

  function recalcVehiclesForMake(
    make: string,
    oldKg: number | null,
    newKg: number | null
  ) {
    const rate = settings.usdToSekRate;
    const oldI = oldKg !== null ? oldKg / (1000 * rate) : null;
    const newI = newKg !== null ? newKg / (1000 * rate) : null;
    vehicles.forEach((v) => {
      if (v.make !== make) return;
      const wasAuto =
        oldI === null
          ? v.carbon_kg_co2e === null
          : v.carbon_kg_co2e === Math.round(v.price_sek * oldI);
      if (!wasAuto) return;
      updateVehicle({
        ...v,
        carbon_kg_co2e: newI !== null ? Math.round(v.price_sek * newI) : null,
      });
    });
  }

  function handleCarbonUpdate(make: string, newVal: number) {
    const existing = carbonEntries.find((e) => e.make === make);
    const oldVal = existing ? existing.t_co2e_per_musd : null;
    updateEntry(make, newVal);
    recalcVehiclesForMake(make, oldVal, newVal);
  }

  function handleCarbonDelete(make: string) {
    const existing = carbonEntries.find((e) => e.make === make);
    const oldVal = existing ? existing.t_co2e_per_musd : null;
    deleteEntry(make);
    recalcVehiclesForMake(make, oldVal, null);
  }

  function handleCarbonAdd(entry: CarbonEntry) {
    addEntry(entry);
    recalcVehiclesForMake(entry.make, null, entry.t_co2e_per_musd);
  }

  function handleCalculateTco(vehicleId: string) {
    const v = vehicles.find((v) => v.id === vehicleId);
    if (!v) return;
    updateVehicle({ ...v, tco: calcTco(v, settings.tco, brandParamsMap[v.make]) });
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

            {/* Sync status badge */}
            {settings.gistId && (
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  syncStatus === "synced"
                    ? "bg-green-100 text-green-700"
                    : syncStatus === "syncing"
                    ? "bg-yellow-100 text-yellow-700"
                    : syncStatus === "offline"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {syncStatus === "synced"
                  ? "Synced"
                  : syncStatus === "syncing"
                  ? "Syncing..."
                  : syncStatus === "offline"
                  ? "Offline"
                  : "Idle"}
              </span>
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
              <div className="flex flex-col gap-1 min-w-32">
                <label className="text-xs font-medium text-gray-500">
                  USD/SEK rate (for carbon calculation)
                </label>
                <input
                  type="number"
                  value={settings.usdToSekRate}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      usdToSekRate: Number(e.target.value) || 10.5,
                    }))
                  }
                  step={0.1}
                  min={1}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="flex flex-col gap-1 min-w-64">
                <label className="text-xs font-medium text-gray-500">
                  GitHub Gist ID
                </label>
                <input
                  type="text"
                  value={settings.gistId}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, gistId: e.target.value.trim() }))
                  }
                  placeholder="e.g. a1b2c3d4e5f6…"
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <p className="text-xs text-gray-400">
                  Shared Gist ID for syncing between devices.
                </p>
              </div>
              <div className="flex flex-col gap-1 min-w-64">
                <label className="text-xs font-medium text-gray-500">
                  GitHub PAT (gist scope)
                </label>
                <input
                  type="password"
                  value={settings.gistToken}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, gistToken: e.target.value.trim() }))
                  }
                  placeholder="ghp_…"
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <p className="text-xs text-gray-400">
                  Stored in your browser only, never sent to anyone else.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  Carbon data
                </label>
                <button
                  onClick={() => setShowCarbonAdmin(true)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  Manage brands ({carbonEntries.length})
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  TCO
                </label>
                <button
                  onClick={() => setShowTcoSettings(true)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  TCO defaults
                </button>
                <button
                  onClick={() => setShowTcoBrandAdmin(true)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  Brand data ({brandTcoEntries.length})
                </button>
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
                  onCalculateTco={handleCalculateTco}
                  tcoYears={settings.tco.years}
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
          intensityMap={intensityMap}
        />
      )}

      {/* Carbon admin modal */}
      {showCarbonAdmin && (
        <CarbonAdminModal
          entries={carbonEntries}
          usdToSekRate={settings.usdToSekRate}
          onAdd={handleCarbonAdd}
          onUpdate={handleCarbonUpdate}
          onDelete={handleCarbonDelete}
          onClose={() => setShowCarbonAdmin(false)}
        />
      )}

      {/* TCO settings modal */}
      {showTcoSettings && (
        <TcoSettingsModal
          settings={settings.tco}
          onChange={(tco) => setSettings((s) => ({ ...s, tco }))}
          onClose={() => setShowTcoSettings(false)}
        />
      )}

      {/* TCO brand data modal */}
      {showTcoBrandAdmin && (
        <TcoBrandModal
          entries={brandTcoEntries}
          allMakes={allMakes}
          apiKey={settings.apiKey}
          onAdd={addBrandEntry}
          onUpdate={updateBrandEntry}
          onDelete={deleteBrandEntry}
          onReplace={replaceBrandEntries}
          onClose={() => setShowTcoBrandAdmin(false)}
        />
      )}
    </div>
  );
}
