"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Sticker } from "@/lib/types";
import { StickerCard } from "./Sticker";

const SWAP_MS = 2600;

// Small rotating peek at other people's stickers, to pass the time during conversion.
// Renders nothing when there are none to show.
export function WaitingStickers() {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    api<{ stickers: Sticker[] }>("/api/stickers/sample")
      .then((data) => setStickers(data.stickers))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (stickers.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % stickers.length), SWAP_MS);
    return () => clearInterval(timer);
  }, [stickers]);

  if (stickers.length === 0) return null;
  const sticker = stickers[index];
  return (
    <div className="waiting">
      <p className="note">Meanwhile, meet other pets</p>
      <div key={sticker.id} className="waiting-card">
        <StickerCard sticker={sticker} />
      </div>
    </div>
  );
}
