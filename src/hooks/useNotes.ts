import { useState, useEffect } from "react";

const LS_KEY = "ev-decide-notes";

function load(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {}
  return {};
}

export function useNotes() {
  const [notes, setNotes] = useState<Record<string, string>>(load);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(notes));
  }, [notes]);

  function setNote(id: string, text: string) {
    setNotes((prev) => ({ ...prev, [id]: text }));
  }

  function getNote(id: string): string {
    return notes[id] ?? "";
  }

  return { notes, setNote, getNote };
}
