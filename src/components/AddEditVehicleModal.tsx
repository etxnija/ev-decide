import { useState } from "react";
import type { Vehicle } from "../types/vehicle";
import { importVehicle } from "../lib/importVehicle";
import type { PartialVehicle } from "../lib/importVehicle";

interface Props {
  vehicle?: Vehicle;
  onSave: (v: Vehicle) => void;
  onClose: () => void;
  apiKey: string;
  existingIds: string[];
}

type Tab = "import" | "manual";

type FormData = Omit<Vehicle, "id" | "image_url">;

const EMPTY_FORM: FormData = {
  make: "",
  model: "",
  variant: "",
  year: new Date().getFullYear(),
  price_sek: 0,
  range_km: 0,
  efficiency_kwh_per_100km: 0,
  battery_kwh: 0,
  charge_dc_kw: 0,
  charge_ac_kw: 0,
  charge_0_80_min: 0,
  cargo_l: 0,
  seats: 5,
  length_mm: null,
  width_mm: null,
  weight_kg: null,
};

function generateId(form: FormData, existingIds: string[]): string {
  const base = `${form.make}-${form.model}-${form.variant}-${form.year}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!existingIds.includes(base)) return base;
  let i = 2;
  while (existingIds.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function applyExtracted(extracted: PartialVehicle): {
  form: FormData;
  fields: Set<string>;
} {
  const form: FormData = { ...EMPTY_FORM };
  const fields = new Set<string>();
  const keys = Object.keys(extracted) as (keyof PartialVehicle)[];
  for (const key of keys) {
    const val = extracted[key];
    if (val !== null && val !== undefined) {
      (form as Record<string, unknown>)[key] = val;
      fields.add(key);
    }
  }
  return { form, fields };
}

export function AddEditVehicleModal({
  vehicle,
  onSave,
  onClose,
  apiKey,
  existingIds,
}: Props) {
  const isEdit = !!vehicle;
  const [tab, setTab] = useState<Tab>(isEdit ? "manual" : "import");
  const [form, setForm] = useState<FormData>(
    isEdit ? { ...vehicle } : { ...EMPTY_FORM }
  );
  const [extractedFields, setExtractedFields] = useState<Set<string>>(new Set());

  // Import state
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  function setField<K extends keyof FormData>(key: K, raw: string) {
    const numericKeys: (keyof FormData)[] = [
      "year",
      "price_sek",
      "range_km",
      "efficiency_kwh_per_100km",
      "battery_kwh",
      "charge_dc_kw",
      "charge_ac_kw",
      "charge_0_80_min",
      "cargo_l",
      "seats",
      "length_mm",
      "width_mm",
      "weight_kg",
    ];
    if (numericKeys.includes(key)) {
      const parsed = raw === "" ? null : Number(raw);
      setForm((prev) => ({ ...prev, [key]: parsed }));
    } else {
      setForm((prev) => ({ ...prev, [key]: raw }));
    }
  }

  async function handleFetchUrl() {
    if (!url.trim()) return;
    if (!apiKey) {
      setImportError("Set your Anthropic API key in settings first.");
      return;
    }
    setImporting(true);
    setImportError("");
    try {
      const { data } = await importVehicle(url.trim(), apiKey);
      const { form: newForm, fields } = applyExtracted(data);
      setForm(newForm);
      setExtractedFields(fields);
      setTab("manual");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }


  function handleSave() {
    const id = isEdit
      ? vehicle!.id
      : generateId(form, existingIds);
    const saved: Vehicle = {
      id,
      image_url: isEdit ? vehicle!.image_url : "",
      ...form,
    };
    onSave(saved);
    onClose();
  }

  const isFormValid =
    form.make.trim() &&
    form.model.trim() &&
    form.price_sek > 0;

  function inputClass(key: string) {
    const base =
      "border rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400";
    return extractedFields.has(key)
      ? `${base} border-blue-400 bg-blue-50`
      : `${base} border-gray-200`;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {isEdit ? "Edit Vehicle" : "Add Vehicle"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        {!isEdit && (
          <div className="flex border-b border-gray-100">
            {(["import", "manual"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? "text-blue-600 border-b-2 border-blue-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "import" ? "Import from URL" : "Manual"}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 flex flex-col gap-4">
          {/* Import tab */}
          {tab === "import" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500">
                Paste a URL to a vehicle page — Claude will extract specs automatically.
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/vehicle-page"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={importing || !url.trim()}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? "Fetching…" : "Fetch"}
                </button>
              </div>

              {importError && (
                <p className="text-sm text-red-500">{importError}</p>
              )}


              <p className="text-xs text-gray-400">
                Or{" "}
                <button
                  onClick={() => setTab("manual")}
                  className="underline hover:text-gray-600"
                >
                  enter specs manually
                </button>
              </p>
            </div>
          )}

          {/* Manual tab */}
          {tab === "manual" && (
            <>
              {extractedFields.size > 0 && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                  Fields highlighted in blue were extracted by Claude — review and correct as needed.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Make */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Make *</label>
                  <input
                    type="text"
                    value={form.make}
                    onChange={(e) => setField("make", e.target.value)}
                    className={inputClass("make")}
                    placeholder="Tesla"
                  />
                </div>

                {/* Model */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Model *</label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setField("model", e.target.value)}
                    className={inputClass("model")}
                    placeholder="Model 3"
                  />
                </div>

                {/* Variant */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Variant</label>
                  <input
                    type="text"
                    value={form.variant}
                    onChange={(e) => setField("variant", e.target.value)}
                    className={inputClass("variant")}
                    placeholder="Long Range AWD"
                  />
                </div>

                {/* Year */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Year</label>
                  <input
                    type="number"
                    value={form.year ?? ""}
                    onChange={(e) => setField("year", e.target.value)}
                    className={inputClass("year")}
                    min={2010}
                    max={2030}
                  />
                </div>

                {/* Price */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-medium text-gray-500">Price (SEK) *</label>
                  <input
                    type="number"
                    value={form.price_sek || ""}
                    onChange={(e) => setField("price_sek", e.target.value)}
                    className={inputClass("price_sek")}
                    placeholder="499000"
                    min={0}
                  />
                </div>

                {/* Range */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Range (km)</label>
                  <input
                    type="number"
                    value={form.range_km || ""}
                    onChange={(e) => setField("range_km", e.target.value)}
                    className={inputClass("range_km")}
                    min={0}
                  />
                </div>

                {/* Efficiency */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Efficiency (kWh/100km)</label>
                  <input
                    type="number"
                    value={form.efficiency_kwh_per_100km || ""}
                    onChange={(e) => setField("efficiency_kwh_per_100km", e.target.value)}
                    className={inputClass("efficiency_kwh_per_100km")}
                    step={0.1}
                    min={0}
                  />
                </div>

                {/* Battery */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Battery (kWh)</label>
                  <input
                    type="number"
                    value={form.battery_kwh || ""}
                    onChange={(e) => setField("battery_kwh", e.target.value)}
                    className={inputClass("battery_kwh")}
                    step={0.1}
                    min={0}
                  />
                </div>

                {/* DC Charge */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">DC Charge (kW)</label>
                  <input
                    type="number"
                    value={form.charge_dc_kw || ""}
                    onChange={(e) => setField("charge_dc_kw", e.target.value)}
                    className={inputClass("charge_dc_kw")}
                    min={0}
                  />
                </div>

                {/* AC Charge */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">AC Charge (kW)</label>
                  <input
                    type="number"
                    value={form.charge_ac_kw || ""}
                    onChange={(e) => setField("charge_ac_kw", e.target.value)}
                    className={inputClass("charge_ac_kw")}
                    min={0}
                  />
                </div>

                {/* 0-80 time */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">0→80% time (min)</label>
                  <input
                    type="number"
                    value={form.charge_0_80_min || ""}
                    onChange={(e) => setField("charge_0_80_min", e.target.value)}
                    className={inputClass("charge_0_80_min")}
                    min={0}
                  />
                </div>

                {/* Cargo */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Cargo (L)</label>
                  <input
                    type="number"
                    value={form.cargo_l || ""}
                    onChange={(e) => setField("cargo_l", e.target.value)}
                    className={inputClass("cargo_l")}
                    min={0}
                  />
                </div>

                {/* Seats */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Seats</label>
                  <input
                    type="number"
                    value={form.seats || ""}
                    onChange={(e) => setField("seats", e.target.value)}
                    className={inputClass("seats")}
                    min={1}
                    max={9}
                  />
                </div>

                {/* Length */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Length (mm)</label>
                  <input
                    type="number"
                    value={form.length_mm ?? ""}
                    onChange={(e) => setField("length_mm", e.target.value)}
                    className={inputClass("length_mm")}
                    min={0}
                    placeholder="optional"
                  />
                </div>

                {/* Width */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Width (mm)</label>
                  <input
                    type="number"
                    value={form.width_mm ?? ""}
                    onChange={(e) => setField("width_mm", e.target.value)}
                    className={inputClass("width_mm")}
                    min={0}
                    placeholder="optional"
                  />
                </div>

                {/* Weight */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Weight (kg)</label>
                  <input
                    type="number"
                    value={form.weight_kg ?? ""}
                    onChange={(e) => setField("weight_kg", e.target.value)}
                    className={inputClass("weight_kg")}
                    min={0}
                    placeholder="optional"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2 justify-end border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isFormValid}
                  className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isEdit ? "Save changes" : "Add vehicle"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
