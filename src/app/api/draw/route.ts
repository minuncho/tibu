import { NextResponse } from "next/server";
import { hasNoLimits } from "@/lib/server/auth";
import { localDate } from "@/lib/server/day";
import { fail, withUser } from "@/lib/server/http";
import { dailyDrawsLeft } from "@/lib/server/quota";
import { getStore, toSticker } from "@/lib/server/store";

export const POST = withUser(async (req, user) => {
  const date = localDate(req);
  const store = getStore();
  // The sticker is picked while the allowance is checked, to save a round trip.
  const [daily, credits, row] = await Promise.all([
    dailyDrawsLeft(user.id, date),
    store.creditBalance(user.id),
    store.randomSticker(user.id),
  ]);
  // Staff can always draw; their extra draws never touch saved credits.
  const staff = hasNoLimits(user);
  const usedCredit = !staff && daily <= 0;
  if (usedCredit && credits <= 0) return fail(403, "No draws left today");

  // Nothing to draw yet: the chance is not spent.
  if (!row) return NextResponse.json({ sticker: null });

  await Promise.all([
    store.createDraw({ userId: user.id, stickerId: row.id, date, usedCredit }),
    usedCredit ? store.addCredit(user.id, -1, "draw") : null,
  ]);
  return NextResponse.json({ sticker: toSticker(row) });
});
