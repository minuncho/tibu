import { NextResponse } from "next/server";
import { localDate } from "@/lib/server/day";
import { fail, withUser } from "@/lib/server/http";
import { dailyDrawsLeft } from "@/lib/server/quota";
import { getStore, toSticker } from "@/lib/server/store";

export const POST = withUser(async (req, user) => {
  const date = localDate(req);
  const store = getStore();
  const daily = await dailyDrawsLeft(user.id, date);
  const usedCredit = daily <= 0;
  if (usedCredit && (await store.creditBalance(user.id)) <= 0) {
    return fail(403, "No draws left today");
  }

  const row = await store.randomSticker(user.id);
  // Nothing to draw yet: the chance is not spent.
  if (!row) return NextResponse.json({ sticker: null });

  await store.createDraw({ userId: user.id, stickerId: row.id, date, usedCredit });
  if (usedCredit) await store.addCredit(user.id, -1, "draw");
  return NextResponse.json({ sticker: toSticker(row) });
});
