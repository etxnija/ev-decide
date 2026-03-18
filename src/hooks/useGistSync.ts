import { useEffect, useRef, useState } from "react";
import type { Vehicle } from "../types/vehicle";
import type { CarbonEntry } from "./useCarbonIntensity";
import type { ScoreWeights } from "../lib/scoring";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline";

export interface SyncPayload {
  vehicles: Vehicle[];
  notes: Record<string, string>;
  carbonIntensity: CarbonEntry[];
  weights: ScoreWeights;
  selection: string[];
}

export interface BulkSetters {
  replaceVehicles: (v: Vehicle[]) => void;
  replaceNotes: (n: Record<string, string>) => void;
  replaceEntries: (c: CarbonEntry[]) => void;
  setWeights: (w: ScoreWeights) => void;
  setSelected: (s: string[]) => void;
}

const GIST_FILENAME = "ev-decide-sync.json";
const DEBOUNCE_MS = 2000;
const POLL_INTERVAL_MS = 60_000;
const LS_SYNC_META = "ev-decide-sync-meta";

function loadLocalUpdatedAt(): string {
  try {
    const raw = localStorage.getItem(LS_SYNC_META);
    if (raw) return (JSON.parse(raw) as { updatedAt: string }).updatedAt;
  } catch {}
  return "";
}

function saveLocalUpdatedAt(updatedAt: string) {
  localStorage.setItem(LS_SYNC_META, JSON.stringify({ updatedAt }));
}

async function fetchGist(
  gistId: string,
  token: string
): Promise<{ content: string; updatedAt: string } | null> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const file = data.files?.[GIST_FILENAME];
  if (!file) return null;
  return { content: file.content as string, updatedAt: data.updated_at as string };
}

async function patchGist(
  gistId: string,
  token: string,
  payload: SyncPayload & { updatedAt: string }
): Promise<boolean> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: { content: JSON.stringify(payload, null, 2) },
      },
    }),
  });
  return res.ok;
}

function applyGistData(
  raw: string,
  setters: BulkSetters,
  localUpdatedAt: string
): string | null {
  try {
    const data = JSON.parse(raw) as Partial<
      SyncPayload & { updatedAt: string }
    >;
    if (!data.updatedAt) return null;
    if (localUpdatedAt && data.updatedAt <= localUpdatedAt) return null;
    if (Array.isArray(data.vehicles)) setters.replaceVehicles(data.vehicles);
    if (data.notes && typeof data.notes === "object")
      setters.replaceNotes(data.notes);
    if (Array.isArray(data.carbonIntensity))
      setters.replaceEntries(data.carbonIntensity);
    if (data.weights && typeof data.weights === "object")
      setters.setWeights(data.weights as ScoreWeights);
    if (Array.isArray(data.selection)) setters.setSelected(data.selection);
    return data.updatedAt;
  } catch {
    return null;
  }
}

export function useGistSync(
  gistId: string,
  gistToken: string,
  payload: SyncPayload,
  setters: BulkSetters
): { status: SyncStatus } {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const initialFetchDone = useRef(false);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  // Effect 1: mount fetch
  useEffect(() => {
    if (!gistId || !gistToken) {
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("syncing");
    fetchGist(gistId, gistToken)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          const localUpdatedAt = loadLocalUpdatedAt();
          const applied = applyGistData(result.content, setters, localUpdatedAt);
          if (applied) saveLocalUpdatedAt(applied);
          setStatus("synced");
        } else {
          setStatus("offline");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      })
      .finally(() => {
        if (!cancelled) initialFetchDone.current = true;
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gistId, gistToken]);

  // Effect 2: debounced PATCH on payload change
  useEffect(() => {
    if (!gistId || !gistToken || !initialFetchDone.current) return;
    setStatus("syncing");
    const timer = setTimeout(async () => {
      const now = new Date().toISOString();
      const ok = await patchGist(gistId, gistToken, {
        ...payloadRef.current,
        updatedAt: now,
      });
      if (ok) {
        saveLocalUpdatedAt(now);
        setStatus("synced");
      } else {
        setStatus("offline");
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [gistId, gistToken, payload]);

  // Effect 3: polling
  useEffect(() => {
    if (!gistId || !gistToken) return;
    const interval = setInterval(async () => {
      const result = await fetchGist(gistId, gistToken).catch(() => null);
      if (!result) {
        setStatus("offline");
        return;
      }
      const localUpdatedAt = loadLocalUpdatedAt();
      const applied = applyGistData(result.content, setters, localUpdatedAt);
      if (applied) {
        saveLocalUpdatedAt(applied);
        setStatus("synced");
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gistId, gistToken]);

  return { status };
}
