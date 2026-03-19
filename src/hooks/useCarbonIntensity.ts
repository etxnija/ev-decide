import { useState, useEffect, useMemo } from "react";
import seedData from "../data/carbonIntensity.json";

export interface CarbonEntry {
  make: string;
  t_co2e_per_musd: number;
}

const LS_KEY = "ev-decide-carbon-intensity";

function load(): CarbonEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
      // Migration: if entries use old kg_co2e_500k field, discard and reload from seed
      if (parsed.length > 0 && "kg_co2e_500k" in parsed[0] && !("t_co2e_per_musd" in parsed[0])) {
        const seed = seedData as CarbonEntry[];
        localStorage.setItem(LS_KEY, JSON.stringify(seed));
        return seed;
      }
      return parsed as unknown as CarbonEntry[];
    }
  } catch {}
  const seed = seedData as CarbonEntry[];
  localStorage.setItem(LS_KEY, JSON.stringify(seed));
  return seed;
}

export function useCarbonIntensity(usdToSekRate: number) {
  const [entries, setEntries] = useState<CarbonEntry[]>(load);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  }, [entries]);

  const intensityMap: Record<string, number> = useMemo(
    () =>
      Object.fromEntries(
        entries.map((e) => [e.make, e.t_co2e_per_musd / (1000 * usdToSekRate)])
      ),
    [entries, usdToSekRate]
  );

  function addEntry(e: CarbonEntry) {
    setEntries((prev) => [...prev, e]);
  }

  function updateEntry(make: string, newVal: number) {
    setEntries((prev) =>
      prev.map((e) => (e.make === make ? { ...e, t_co2e_per_musd: newVal } : e))
    );
  }

  function deleteEntry(make: string) {
    setEntries((prev) => prev.filter((e) => e.make !== make));
  }

  function replaceEntries(c: CarbonEntry[]) {
    setEntries(c);
  }

  return { entries, intensityMap, addEntry, updateEntry, deleteEntry, replaceEntries };
}
