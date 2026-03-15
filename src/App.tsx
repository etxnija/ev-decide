import { useState, useMemo, useEffect } from "react";
import type { Vehicle } from "./types/vehicle";
import vehiclesData from "./data/vehicles.json";
import { VehicleCard } from "./components/VehicleCard";
import { FilterBar, type Filters } from "./components/FilterBar";
import { CompareTable } from "./components/CompareTable";

const vehicles = vehiclesData as Vehicle[];
const MAX_COMPARE = 4;
const LS_KEY = "ev-decide-selection";

const DEFAULT_FILTERS: Filters = { maxPrice: 100000, minRange: 0, makes: [] };

function loadSelection(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {}
  return [];
}

export default function App() {
  const [selected, setSelected] = useState<string[]>(loadSelection);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showCompare, setShowCompare] = useState(true);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(selected));
  }, [selected]);

  const allMakes = useMemo(
    () => [...new Set(vehicles.map((v) => v.make))].sort(),
    []
  );

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (v.price_eur > filters.maxPrice) return false;
      if (v.range_km < filters.minRange) return false;
      if (filters.makes.length > 0 && !filters.makes.includes(v.make)) return false;
      return true;
    });
  }, [filters]);

  const selectedVehicles = useMemo(
    () => selected.map((id) => vehicles.find((v) => v.id === id)!).filter(Boolean),
    [selected]
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">EV Decide</h1>
            <p className="text-xs text-gray-400">Electric vehicle comparison tool</p>
          </div>
          {selected.length > 0 && (
            <button
              onClick={() => setShowCompare((s) => !s)}
              className="text-sm font-medium bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {showCompare ? "Hide" : "Show"} comparison ({selected.length})
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Compare table */}
        {selected.length > 0 && showCompare && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Comparing {selected.length} vehicle{selected.length > 1 ? "s" : ""}
            </h2>
            <CompareTable vehicles={selectedVehicles} onRemove={toggleVehicle} />
          </section>
        )}

        {/* Filters */}
        <FilterBar filters={filters} onChange={setFilters} allMakes={allMakes} />

        {/* Catalog */}
        <section>
          <p className="text-xs text-gray-400 mb-3">
            {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""}
            {selected.length > 0 && ` · ${selected.length}/${MAX_COMPARE} selected for comparison`}
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
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
