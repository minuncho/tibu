"use client";

import { useEffect, useState } from "react";
import { postJson } from "@/lib/api";
import { formatSerial, REPLY_MAX, type AppState } from "@/lib/types";

// Ids of removal notices this browser has already confirmed.
const SEEN_KEY = "seenRemovals";

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}

// Tells a maker, once, that staff took down one of their stickers. They can confirm it or
// write back; either way it is not shown again on this device. One sticker at a time.
export function RemovalNotice({ removed }: { removed: AppState["removed"] }) {
  const [seen, setSeen] = useState<string[] | null>(null);
  const [replying, setReplying] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setSeen(readSeen()), []);

  if (!seen) return null;
  const sticker = removed.find((s) => !seen.includes(s.id));
  if (!sticker) return null;

  function dismiss(id: string) {
    const next = [...new Set([...readSeen(), id])];
    localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    setSeen(next);
    setReplying(false);
    setMessage("");
    setError("");
  }

  async function send(id: string) {
    setBusy(true);
    setError("");
    try {
      await postJson("/api/appeals", { stickerId: id, message });
      dismiss(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setBusy(false);
  }

  return (
    <div className="notice" role="status">
      <p>
        Sorry! We had to remove your sticker{" "}
        <strong>
          {formatSerial(sticker.serialNo)} {sticker.name}
        </strong>
        . Stickers need to be photos of pets.
      </p>
      {replying ? (
        <>
          <textarea
            rows={2}
            maxLength={REPLY_MAX}
            value={message}
            placeholder="Did we get it wrong? Tell our staff."
            onChange={(e) => setMessage(e.target.value)}
          />
          {error && <p className="error">{error}</p>}
          <div className="notice-actions">
            <button className="quiet" disabled={busy} onClick={() => setReplying(false)}>
              Cancel
            </button>
            <button disabled={busy || !message.trim()} onClick={() => send(sticker.id)}>
              {busy ? "Sending..." : "Send"}
            </button>
          </div>
        </>
      ) : (
        <div className="notice-actions">
          <button className="quiet" onClick={() => setReplying(true)}>
            Reply
          </button>
          <button onClick={() => dismiss(sticker.id)}>OK</button>
        </div>
      )}
    </div>
  );
}
