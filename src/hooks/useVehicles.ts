import { useState, useEffect } from "react";
import type { Vehicle } from "../types/vehicle";
import seedData from "../data/vehicles.json";

const LS_KEY = "ev-decide-vehicles";

function load(): Vehicle[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Vehicle[];
  } catch {}
  const seed = seedData as Vehicle[];
  localStorage.setItem(LS_KEY, JSON.stringify(seed));
  return seed;
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(load);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(vehicles));
  }, [vehicles]);

  function addVehicle(v: Vehicle) {
    setVehicles((prev) => [...prev, v]);
  }

  function updateVehicle(updated: Vehicle) {
    setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  }

  function deleteVehicle(id: string) {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }

  return { vehicles, addVehicle, updateVehicle, deleteVehicle };
}
