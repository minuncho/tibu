import { NextResponse } from "next/server";
import type { ReportReason, StaffReport } from "@/lib/types";
import { isStaff } from "@/lib/server/auth";
import { fail, withUser } from "@/lib/server/http";
import { resolveReport } from "@/lib/server/reports";
import { getStore, REPLY_PREFIX, toSticker } from "@/lib/server/store";

export const GET = withUser(async (_req, user) => {
  if (!isStaff(user)) return fail(403, "Staff only");
  const reports: StaffReport[] = (await getStore().listPendingReports()).map((r) => ({
    id: r.id,
    reason: r.reason.startsWith(REPLY_PREFIX) ? null : (r.reason as ReportReason),
    reply: r.reason.startsWith(REPLY_PREFIX) ? r.reason.slice(REPLY_PREFIX.length) : null,
    createdAt: r.createdAt,
    sticker: toSticker(r.sticker),
  }));
  return NextResponse.json({ reports });
});

export const POST = withUser(async (req, user) => {
  if (!isStaff(user)) return fail(403, "Staff only");
  const body = await req.json().catch(() => ({}));
  if (typeof body.upheld !== "boolean") return fail(400, "Missing decision");
  if (!(await resolveReport(String(body.reportId), body.upheld))) {
    return fail(409, "This report was already decided");
  }
  return NextResponse.json({ ok: true });
});
