"use client";

import { useEffect, useState } from "react";
import { formatSerial, type AppState } from "@/lib/types";

// Ids of removal notices this browser has already confirmed.
const SEEN_KEY = "seenRemovals";

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}

// Tells a maker, once, that staff took down one of their stickers.
// After OK it is not shown again on this device.
export function RemovalNotice({ removed }: { removed: AppState["removed"] }) {
  const [seen, setSeen] = useState<string[] | null>(null);

  useEffect(() => setSeen(readSeen()), []);

  if (!seen) return null;
  const pending = removed.filter((sticker) => !seen.includes(sticker.id));
  if (pending.length === 0) return null;

  function confirm() {
    const next = [...new Set([...readSeen(), ...pending.map((sticker) => sticker.id)])];
    localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    setSeen(next);
  }

  const names = pending.map((s) => `${formatSerial(s.serialNo)} ${s.name}`).join(", ");
  return (
    <div className="notice" role="status">
      <p>
        {pending.length === 1 ? "Your sticker" : "Your stickers"} <strong>{names}</strong>{" "}
        {pending.length === 1 ? "was" : "were"} removed by our staff. Stickers must be photos of
        pets and follow the rules.
      </p>
      <button onClick={confirm}>OK</button>
    </div>
  );
}
