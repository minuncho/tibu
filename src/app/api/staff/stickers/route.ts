import { NextResponse } from "next/server";
import type { StaffSticker } from "@/lib/types";
import { isStaff } from "@/lib/server/auth";
import { fail, withUser } from "@/lib/server/http";
import { removeSticker } from "@/lib/server/reports";
import { getStore, toSticker } from "@/lib/server/store";

const PAGE = 60;

export const GET = withUser(async (req, user) => {
  if (!isStaff(user)) return fail(403, "Staff only");
  const offset = Math.max(0, Number(new URL(req.url).searchParams.get("offset")) || 0);
  const { total, rows } = await getStore().listAllStickers(offset, PAGE);
  const stickers: StaffSticker[] = rows.map((row) => ({ ...toSticker(row), hidden: row.hidden }));
  return NextResponse.json({ total, stickers });
});

// Staff take a sticker down without waiting for a report, or put one back.
// Putting a sticker back only makes it visible again; rewards already given stay.
export const POST = withUser(async (req, user) => {
  if (!isStaff(user)) return fail(403, "Staff only");
  const body = await req.json().catch(() => ({}));
  if (typeof body.hidden !== "boolean") return fail(400, "Missing decision");
  const store = getStore();
  const sticker = await store.getSticker(String(body.stickerId));
  if (!sticker) return fail(404, "Sticker not found");

  if (body.hidden) await removeSticker(sticker.id);
  else await store.setStickerHidden(sticker.id, false);
  return NextResponse.json({ ok: true });
});
