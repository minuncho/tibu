import { NextResponse } from "next/server";
import { localDate } from "@/lib/server/day";
import { fail, withUser } from "@/lib/server/http";
import { adDrawsLeft, adReason } from "@/lib/server/quota";
import { getStore } from "@/lib/server/store";

// One extra draw for a rewarded ad watched to the end. The Toss app calls this when the ad
// SDK reports the reward; the server cannot verify the viewing itself, so the daily cap is
// what bounds misuse.
export const POST = withUser(async (req, user) => {
  const date = localDate(req);
  const left = await adDrawsLeft(user.id, date);
  if (left <= 0) return fail(403, "No more ad draws today");
  await getStore().addCredit(user.id, 1, adReason(date));
  return NextResponse.json({ adDrawsLeft: left - 1 });
});
