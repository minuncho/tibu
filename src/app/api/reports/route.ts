import { NextResponse } from "next/server";
import { REPORT_REASONS, type ReportReason } from "@/lib/types";
import { fail, withUser } from "@/lib/server/http";
import { getStore } from "@/lib/server/store";

export const POST = withUser(async (req, user) => {
  const body = await req.json().catch(() => ({}));
  const stickerId = String(body.stickerId);
  const reason = body.reason as ReportReason;
  if (!(reason in REPORT_REASONS)) return fail(400, "Pick a reason");

  const store = getStore();
  // Only stickers you actually drew can be reported.
  if (!(await store.hasDrawn(user.id, stickerId))) return fail(403, "You have not drawn this sticker");
  if (!(await store.createReport({ reporterId: user.id, stickerId, reason }))) {
    return fail(409, "You already reported this sticker");
  }
  return NextResponse.json({ ok: true });
});
