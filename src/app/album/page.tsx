"use client";

import { useEffect, useState } from "react";
import { Segment } from "@/components/Segment";
import { StickerCard } from "@/components/Sticker";
import { StickerDetail } from "@/components/StickerDetail";
import { TopBar } from "@/components/TopBar";
import { useAppState } from "@/components/useAppState";
import { api } from "@/lib/api";
import type { AlbumEntry, Sticker } from "@/lib/types";

type Filter = "made" | "drawn";
type Sort = "number" | "date";

export default function AlbumPage() {
  const { state } = useAppState();
  const [filter, setFilter] = useState<Filter>("drawn");
  const [sort, setSort] = useState<Sort>("number");
  const [entries, setEntries] = useState<AlbumEntry[] | null>(null);
  const [open, setOpen] = useState<Sticker | null>(null);

  useEffect(() => {
    if (!state) return;
    let stale = false;
    setEntries(null);
    api<{ entries: AlbumEntry[] }>(`/api/album?filter=${filter}&sort=${sort}`)
      .then((data) => !stale && setEntries(data.entries))
      .catch(() => !stale && setEntries([]));
    return () => {
      stale = true;
    };
  }, [state, filter, sort]);

  return (
    <main>
      <TopBar title="Album" />
      <div className="toggles">
        <Segment
          value={filter}
          onChange={setFilter}
          options={[
            ["drawn", "Drawn"],
            ["made", "Made"],
          ]}
        />
        <Segment
          value={sort}
          onChange={setSort}
          options={[
            ["number", "No."],
            ["date", "Date"],
          ]}
        />
      </div>

      {entries === null ? (
        <div className="stack empty">
          <div className="spinner" />
        </div>
      ) : entries.length === 0 ? (
        <p className="note empty">
          {filter === "drawn" ? "No drawn stickers yet." : "You have not made a sticker yet."}
        </p>
      ) : (
        <div className="album-grid">
          {entries.map((entry) => (
            <button key={entry.entryId} className="album-item" onClick={() => setOpen(entry.sticker)}>
              <StickerCard sticker={entry.sticker} />
            </button>
          ))}
        </div>
      )}

      {open && <StickerDetail sticker={open} onClose={() => setOpen(null)} />}
    </main>
  );
}
