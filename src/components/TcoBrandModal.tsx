import { useState } from "react";
import type { BrandTcoEntry } from "../lib/tco";
import { fetchBrandTcoParams } from "../lib/fetchBrandTco";

interface Props {
  entries: BrandTcoEntry[];
  allMakes: string[];
  apiKey: string;
  onAdd: (e: BrandTcoEntry) => void;
  onUpdate: (make: string, updates: Omit<BrandTcoEntry, "make">) => void;
  onDelete: (make: string) => void;
  onReplace: (entries: BrandTcoEntry[]) => void;
  onClose: () => void;
}

type EditState = Omit<BrandTcoEntry, "make">;

export function TcoBrandModal({
  entries,
  allMakes,
  apiKey,
  onAdd,
  onUpdate,
  onDelete,
  onReplace,
  onClose,
}: Props) {
  const [editingMake, setEditingMake] = useState<string | null>(null);
  const [editVals, setEditVals] = useState<EditState>({
    warrantyYears: 3,
    residualValuePercent: 45,
    annualMaintenanceSek: 5000,
    warrantyMaintenanceSek: 1000,
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newMake, setNewMake] = useState("");
  const [newVals, setNewVals] = useState<EditState>({
    warrantyYears: 3,
    residualValuePercent: 45,
    annualMaintenanceSek: 5000,
    warrantyMaintenanceSek: 1000,
  });
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  function startEdit(e: BrandTcoEntry) {
    setEditingMake(e.make);
    setEditVals({
      warrantyYears: e.warrantyYears,
      residualValuePercent: e.residualValuePercent,
      annualMaintenanceSek: e.annualMaintenanceSek,
      warrantyMaintenanceSek: e.warrantyMaintenanceSek,
    });
    setConfirmDelete(null);
  }

  function saveEdit(make: string) {
    onUpdate(make, editVals);
    setEditingMake(null);
  }

  function handleAdd() {
    if (!newMake.trim()) return;
    onAdd({ make: newMake.trim(), ...newVals });
    setNewMake("");
    setNewVals({ warrantyYears: 3, residualValuePercent: 45, annualMaintenanceSek: 5000, warrantyMaintenanceSek: 1000 });
  }

  async function handleFetch() {
    if (!apiKey) {
      setFetchError("No API key set — add it in Settings.");
      return;
    }
    if (allMakes.length === 0) {
      setFetchError("No vehicles in catalog to fetch brands for.");
      return;
    }
    setFetching(true);
    setFetchError(null);
    try {
      const result = await fetchBrandTcoParams(allMakes, apiKey);
      onReplace(result);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setFetching(false);
    }
  }

  const cols = ["Make", "Warranty (yrs)", "Resale (%)", "Maint./yr (SEK)", "Warranty maint. (SEK)", "Actions"];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Brand TCO data</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Per-brand warranty, depreciation and maintenance estimates
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleFetch}
              disabled={fetching}
              className="text-xs font-medium bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {fetching ? "Fetching…" : "Fetch from AI"}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {fetchError && (
            <p className="text-xs text-red-500 mb-4">{fetchError}</p>
          )}

          {entries.length === 0 && !fetching && (
            <p className="text-sm text-gray-400 mb-4 text-center py-4">
              No brand data yet — click <strong>Fetch from AI</strong> to populate.
            </p>
          )}

          {(entries.length > 0 || fetching) && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    {cols.map((c) => (
                      <th key={c} className={`pb-2 ${c === "Make" ? "text-left" : "text-right"} ${c === "Actions" ? "w-28" : ""}`}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.make} className="border-b border-gray-50">
                      {editingMake === entry.make ? (
                        <>
                          <td className="py-2 font-medium text-gray-900">{entry.make}</td>
                          {(["warrantyYears", "residualValuePercent", "annualMaintenanceSek", "warrantyMaintenanceSek"] as (keyof EditState)[]).map((k) => (
                            <td key={k} className="py-2 text-right pl-2">
                              <input
                                type="number"
                                value={editVals[k]}
                                onChange={(e) => setEditVals((prev) => ({ ...prev, [k]: Number(e.target.value) }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(entry.make);
                                  if (e.key === "Escape") setEditingMake(null);
                                }}
                                className="border border-blue-400 rounded px-2 py-1 text-sm text-right w-24 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                min={0}
                              />
                            </td>
                          ))}
                          <td className="py-2 text-right">
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => saveEdit(entry.make)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Save</button>
                              <button onClick={() => setEditingMake(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 font-medium text-gray-900">{entry.make}</td>
                          <td className="py-2 text-right text-gray-700">{entry.warrantyYears}</td>
                          <td className="py-2 text-right text-gray-700">{entry.residualValuePercent}%</td>
                          <td className="py-2 text-right text-gray-700">{entry.annualMaintenanceSek.toLocaleString("sv-SE")}</td>
                          <td className="py-2 text-right text-gray-700">{entry.warrantyMaintenanceSek.toLocaleString("sv-SE")}</td>
                          <td className="py-2 text-right">
                            {confirmDelete === entry.make ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => { onDelete(entry.make); setConfirmDelete(null); }} className="text-xs text-red-600 hover:text-red-800 font-medium">Confirm</button>
                                <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => startEdit(entry)} className="text-xs text-gray-500 hover:text-gray-900">Edit</button>
                                <button onClick={() => setConfirmDelete(entry.make)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                              </div>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}

                  {/* Add row */}
                  <tr className="border-t border-gray-200">
                    <td className="pt-3">
                      <input
                        type="text"
                        value={newMake}
                        onChange={(e) => setNewMake(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        placeholder="Brand name"
                        className="border border-gray-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    {(["warrantyYears", "residualValuePercent", "annualMaintenanceSek", "warrantyMaintenanceSek"] as (keyof EditState)[]).map((k) => (
                      <td key={k} className="pt-3 pl-2">
                        <input
                          type="number"
                          value={newVals[k]}
                          onChange={(e) => setNewVals((prev) => ({ ...prev, [k]: Number(e.target.value) }))}
                          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                          className="border border-gray-200 rounded px-2 py-1 text-sm text-right w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                          min={0}
                        />
                      </td>
                    ))}
                    <td className="pt-3 pl-2 text-right">
                      <button
                        onClick={handleAdd}
                        disabled={!newMake.trim()}
                        className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
