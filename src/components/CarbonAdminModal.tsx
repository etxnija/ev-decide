import { useState } from "react";
import type { CarbonEntry } from "../hooks/useCarbonIntensity";

interface Props {
  entries: CarbonEntry[];
  onAdd: (entry: CarbonEntry) => void;
  onUpdate: (make: string, newKg: number) => void;
  onDelete: (make: string) => void;
  onClose: () => void;
}

export function CarbonAdminModal({
  entries,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: Props) {
  const [editingMake, setEditingMake] = useState<string | null>(null);
  const [editKg, setEditKg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newMake, setNewMake] = useState("");
  const [newKg, setNewKg] = useState("");

  function startEdit(entry: CarbonEntry) {
    setEditingMake(entry.make);
    setEditKg(String(entry.kg_co2e_500k));
    setConfirmDelete(null);
  }

  function saveEdit(make: string) {
    const kg = Number(editKg);
    if (kg > 0) {
      onUpdate(make, kg);
    }
    setEditingMake(null);
  }

  function handleDelete(make: string) {
    onDelete(make);
    setConfirmDelete(null);
  }

  function handleAdd() {
    const kg = Number(newKg);
    if (!newMake.trim() || !(kg > 0)) return;
    onAdd({ make: newMake.trim(), kg_co2e_500k: kg });
    setNewMake("");
    setNewKg("");
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Carbon intensity data</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Reference: kg CO₂e per vehicle manufactured at 500,000 SEK price point
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left pb-2">Make</th>
                <th className="text-right pb-2">kg CO₂e @ 500k SEK</th>
                <th className="text-right pb-2">Intensity (kg/SEK)</th>
                <th className="text-right pb-2 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.make} className="border-b border-gray-50">
                  {editingMake === entry.make ? (
                    <>
                      <td className="py-2 font-medium text-gray-900">
                        {entry.make}
                      </td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          value={editKg}
                          onChange={(e) => setEditKg(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(entry.make);
                            if (e.key === "Escape") setEditingMake(null);
                          }}
                          autoFocus
                          className="border border-blue-400 rounded px-2 py-1 text-sm text-right w-28 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          min={1}
                        />
                      </td>
                      <td className="py-2 text-right text-gray-400">
                        {Number(editKg) > 0
                          ? (Number(editKg) / 500000).toFixed(6)
                          : "—"}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => saveEdit(entry.make)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMake(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 font-medium text-gray-900">
                        {entry.make}
                      </td>
                      <td className="py-2 text-right text-gray-700">
                        {entry.kg_co2e_500k.toLocaleString()}
                      </td>
                      <td className="py-2 text-right text-gray-400">
                        {(entry.kg_co2e_500k / 500000).toFixed(6)}
                      </td>
                      <td className="py-2 text-right">
                        {confirmDelete === entry.make ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleDelete(entry.make)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => startEdit(entry)}
                              className="text-xs text-gray-500 hover:text-gray-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete(entry.make)}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              Delete
                            </button>
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
                    placeholder="Brand name"
                    className="border border-gray-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </td>
                <td className="pt-3 pl-2">
                  <input
                    type="number"
                    value={newKg}
                    onChange={(e) => setNewKg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="e.g. 50000"
                    className="border border-gray-200 rounded px-2 py-1 text-sm text-right w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    min={1}
                  />
                </td>
                <td className="pt-3 pl-2 text-right text-gray-400 text-xs">
                  {Number(newKg) > 0
                    ? (Number(newKg) / 500000).toFixed(6)
                    : "—"}
                </td>
                <td className="pt-3 pl-2 text-right">
                  <button
                    onClick={handleAdd}
                    disabled={!newMake.trim() || !(Number(newKg) > 0)}
                    className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
