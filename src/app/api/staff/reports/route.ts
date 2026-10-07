import { NextResponse } from "next/server";
import type { StaffReport } from "@/lib/types";
import { isStaff } from "@/lib/server/auth";
import { fail, withUser } from "@/lib/server/http";
import { resolveReport } from "@/lib/server/reports";
import { getStore, toSticker } from "@/lib/server/store";

export const GET = withUser(async (_req, user) => {
  if (!isStaff(user)) return fail(403, "Staff only");
  const reports: StaffReport[] = (await getStore().listPendingReports()).map((r) => ({
    id: r.id,
    reason: r.reason,
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
