import { NextResponse } from "next/server";
import { REPLY_MAX } from "@/lib/types";
import { fail, withUser } from "@/lib/server/http";
import { getStore, REPLY_PREFIX } from "@/lib/server/store";

// A maker's reply to "your sticker was removed". It joins the staff queue next to reports.
export const POST = withUser(async (req, user) => {
  const body = await req.json().catch(() => ({}));
  const message =
    typeof body.message === "string" ? body.message.replace(/\s+/g, " ").trim() : "";
  const length = [...message].length;
  if (length < 1 || length > REPLY_MAX) return fail(400, `Write 1-${REPLY_MAX} characters`);

  const store = getStore();
  const removed = await store.listRemovedMade(user.id);
  const sticker = removed.find((s) => s.id === String(body.stickerId));
  if (!sticker) return fail(404, "Sticker not found");

  const created = await store.createReport({
    reporterId: user.id,
    stickerId: sticker.id,
    reason: `${REPLY_PREFIX}${message}`,
  });
  if (!created) return fail(409, "You already replied about this sticker");
  return NextResponse.json({ ok: true });
});
