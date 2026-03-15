export interface Filters {
  maxPrice: number;
  minRange: number;
  makes: string[];
}

interface FilterBarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  allMakes: string[];
}

const MAX_PRICE = 100000;
const MAX_RANGE = 800;

export function FilterBar({ filters, onChange, allMakes }: FilterBarProps) {
  function toggleMake(make: string) {
    const next = filters.makes.includes(make)
      ? filters.makes.filter((m) => m !== make)
      : [...filters.makes, make];
    onChange({ ...filters, makes: next });
  }

  function reset() {
    onChange({ maxPrice: MAX_PRICE, minRange: 0, makes: [] });
  }

  const isFiltered =
    filters.maxPrice < MAX_PRICE ||
    filters.minRange > 0 ||
    filters.makes.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-6 items-end">
      {/* Price */}
      <div className="flex flex-col gap-1 min-w-48">
        <label className="text-xs font-medium text-gray-500">
          Max price: <span className="text-gray-900">€{filters.maxPrice.toLocaleString("de-DE")}</span>
        </label>
        <input
          type="range"
          min={20000}
          max={MAX_PRICE}
          step={1000}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="accent-blue-500"
        />
      </div>

      {/* Range */}
      <div className="flex flex-col gap-1 min-w-48">
        <label className="text-xs font-medium text-gray-500">
          Min range: <span className="text-gray-900">{filters.minRange} km</span>
        </label>
        <input
          type="range"
          min={0}
          max={MAX_RANGE}
          step={25}
          value={filters.minRange}
          onChange={(e) => onChange({ ...filters, minRange: Number(e.target.value) })}
          className="accent-blue-500"
        />
      </div>

      {/* Makes */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-gray-500">Make</p>
        <div className="flex flex-wrap gap-1.5">
          {allMakes.map((make) => (
            <button
              key={make}
              onClick={() => toggleMake(make)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filters.makes.includes(make)
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
              }`}
            >
              {make}
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      {isFiltered && (
        <button
          onClick={reset}
          className="text-xs text-gray-400 hover:text-gray-700 underline ml-auto"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
