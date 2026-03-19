import { useState, useEffect, useMemo } from "react";
import type { BrandTcoEntry } from "../lib/tco";

const LS_KEY = "ev-decide-brand-tco";

function load(): BrandTcoEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as BrandTcoEntry[];
  } catch {}
  return [];
}

export function useBrandTcoParams() {
  const [entries, setEntries] = useState<BrandTcoEntry[]>(load);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  }, [entries]);

  const brandParamsMap: Record<string, BrandTcoEntry> = useMemo(
    () => Object.fromEntries(entries.map((e) => [e.make, e])),
    [entries]
  );

  function addEntry(e: BrandTcoEntry) {
    setEntries((prev) => [...prev, e]);
  }

  function updateEntry(make: string, updates: Omit<BrandTcoEntry, "make">) {
    setEntries((prev) =>
      prev.map((e) => (e.make === make ? { ...e, ...updates } : e))
    );
  }

  function deleteEntry(make: string) {
    setEntries((prev) => prev.filter((e) => e.make !== make));
  }

  function replaceEntries(next: BrandTcoEntry[]) {
    setEntries(next);
  }

  return { entries, brandParamsMap, addEntry, updateEntry, deleteEntry, replaceEntries };
}
