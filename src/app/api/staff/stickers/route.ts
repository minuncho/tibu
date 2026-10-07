import { NextResponse } from "next/server";
import type { StaffSticker } from "@/lib/types";
import { isStaff } from "@/lib/server/auth";
import { fail, withUser } from "@/lib/server/http";
import { getStore, toSticker } from "@/lib/server/store";

const PAGE = 60;

export const GET = withUser(async (req, user) => {
  if (!isStaff(user)) return fail(403, "Staff only");
  const offset = Math.max(0, Number(new URL(req.url).searchParams.get("offset")) || 0);
  const { total, rows } = await getStore().listAllStickers(offset, PAGE);
  const stickers: StaffSticker[] = rows.map((row) => ({ ...toSticker(row), hidden: row.hidden }));
  return NextResponse.json({ total, stickers });
});
