import { useState, useEffect, useMemo } from "react";
import seedData from "../data/carbonIntensity.json";

export interface CarbonEntry {
  make: string;
  kg_co2e_500k: number;
}

const LS_KEY = "ev-decide-carbon-intensity";

function load(): CarbonEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as CarbonEntry[];
  } catch {}
  const seed = seedData as CarbonEntry[];
  localStorage.setItem(LS_KEY, JSON.stringify(seed));
  return seed;
}

export function useCarbonIntensity() {
  const [entries, setEntries] = useState<CarbonEntry[]>(load);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  }, [entries]);

  const intensityMap: Record<string, number> = useMemo(
    () =>
      Object.fromEntries(entries.map((e) => [e.make, e.kg_co2e_500k / 500000])),
    [entries]
  );

  function addEntry(e: CarbonEntry) {
    setEntries((prev) => [...prev, e]);
  }

  function updateEntry(make: string, newKg: number) {
    setEntries((prev) =>
      prev.map((e) => (e.make === make ? { ...e, kg_co2e_500k: newKg } : e))
    );
  }

  function deleteEntry(make: string) {
    setEntries((prev) => prev.filter((e) => e.make !== make));
  }

  return { entries, intensityMap, addEntry, updateEntry, deleteEntry };
}
