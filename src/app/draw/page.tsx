"use client";

import { useState } from "react";
import Link from "next/link";
import { DonutArt, Pips } from "@/components/Art";
import { ReportButton } from "@/components/Report";
import { DownloadButton, StickerView } from "@/components/StickerDetail";
import { TopBar } from "@/components/TopBar";
import { useAppState } from "@/components/useAppState";
import { api } from "@/lib/api";
import { BASE_DRAWS_PER_DAY, type Sticker } from "@/lib/types";

const SPIN_MS = 1000;

// Waits until the picture is in the browser's cache (or 3 seconds pass), so the sticker
// is revealed complete instead of as an empty card that fills in a moment later.
function preload(url: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = url;
    setTimeout(resolve, 3000);
  });
}

export default function DrawPage() {
  const { state, refresh } = useAppState();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Sticker | null>(null);
  const [message, setMessage] = useState("");

  const left = state?.drawsLeft ?? 0;

  async function draw() {
    setSpinning(true);
    setMessage("");
    try {
      const [{ sticker }] = await Promise.all([
        api<{ sticker: Sticker | null }>("/api/draw", { method: "POST" }),
        new Promise((resolve) => setTimeout(resolve, SPIN_MS)),
      ]);
      if (sticker) {
        await preload(sticker.thumbUrl || sticker.imageUrl);
        setResult(sticker);
      }
      else setMessage("No stickers from other owners yet. Your draw was not used.");
      // Not awaited: the sticker shows right away while the remaining count updates.
      refresh().catch(() => {});
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSpinning(false);
    }
  }

  if (result) {
    return (
      <main>
        <TopBar title="You got..." />
        <div className="card stack">
          <div className="reveal">
            <StickerView sticker={result} />
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            <DownloadButton sticker={result} />
            {left > 0 && (
              <button className="btn btn-ghost" onClick={() => setResult(null)}>
                Draw again
              </button>
            )}
            <Link className="btn btn-ghost" href="/">
              Home
            </Link>
          </div>
          <ReportButton key={result.id} sticker={result} />
        </div>
      </main>
    );
  }

  return (
    <main>
      <TopBar title="Draw a sticker" />
      <div className="card stack">
        <button
          className="machine"
          aria-label="Open the bag"
          data-spin={spinning}
          disabled={spinning || left === 0}
          onClick={draw}
        >
          <DonutArt />
        </button>
        {state && !state.unlimited && <Pips count={left} max={BASE_DRAWS_PER_DAY} />}
        <p className="note">
          {spinning
            ? "Rustle rustle..."
            : !state
              ? "Checking your draws..."
              : left > 0
                ? "Tap the bag to open it"
                : "No draws left today. Make a sticker to earn one!"}
        </p>
        {message && <p className="error">{message}</p>}
      </div>
    </main>
  );
}
