"use client";

import { useState } from "react";
import { downloadSticker } from "@/lib/render";
import type { Sticker } from "@/lib/types";
import { SpeechBubble, StickerCard } from "./Sticker";

export function StickerView({ sticker }: { sticker: Sticker }) {
  return (
    <div className="sticker-view">
      <SpeechBubble text={sticker.bubble} />
      <div className="sticker-view-card">
        <StickerCard sticker={sticker} />
      </div>
    </div>
  );
}

export function DownloadButton({ sticker }: { sticker: Sticker }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await downloadSticker(sticker);
        } catch {
          alert("Could not save the image. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Saving..." : "Save image"}
    </button>
  );
}

export function StickerDetail({ sticker, onClose }: { sticker: Sticker; onClose: () => void }) {
  return (
    // Anything that is not the sticker, its bubble or a button counts as "outside".
    <div
      className="modal"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest(".sticker-body, .bubble, .actions")) onClose();
      }}
    >
      <div className="modal-content">
        <StickerView sticker={sticker} />
        <div className="actions">
          <DownloadButton sticker={sticker} />
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
