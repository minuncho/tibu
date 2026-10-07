import { NextResponse } from "next/server";
import { withUser } from "@/lib/server/http";
import { getStore, toSticker } from "@/lib/server/store";

// A few stickers from other owners, shown while a photo is being converted.
export const GET = withUser(async (_req, user) => {
  const rows = await getStore().sampleStickers(user.id, 8);
  return NextResponse.json({ stickers: rows.map(toSticker) });
});
