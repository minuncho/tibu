import { NextResponse } from "next/server";
import type { AlbumEntry } from "@/lib/types";
import { withUser } from "@/lib/server/http";
import { getStore, toSticker } from "@/lib/server/store";

export const GET = withUser(async (req, user) => {
  const params = new URL(req.url).searchParams;
  const store = getStore();

  let entries: AlbumEntry[];
  if (params.get("filter") === "drawn") {
    entries = (await store.listDrawn(user.id)).map((d) => ({
      entryId: d.drawId,
      kind: "drawn",
      at: d.drawnAt,
      sticker: toSticker(d.sticker),
    }));
  } else {
    entries = (await store.listMade(user.id)).map((s) => ({
      entryId: s.id,
      kind: "made",
      at: s.createdAt,
      sticker: toSticker(s),
    }));
  }

  // Oldest first is the tiebreaker for duplicates of the same number.
  entries.sort((a, b) => a.at.localeCompare(b.at));
  if (params.get("sort") !== "date") {
    entries.sort((a, b) => a.sticker.serialNo - b.sticker.serialNo);
  }
  return NextResponse.json({ entries });
});
