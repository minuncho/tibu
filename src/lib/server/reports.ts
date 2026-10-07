import { PENALTY_DAYS, REPORT_REWARD } from "../types";
import { getStore } from "./store";

// Staff decision on a report. Returns false if it was already decided.
export async function resolveReport(reportId: string, upheld: boolean) {
  const store = getStore();
  const report = await store.getReport(reportId);
  if (!report || report.status !== "pending") return false;

  if (!upheld) {
    // The reporter gets nothing back; the draw they spent stays spent.
    await store.setReportStatus([report.id], "rejected");
    return true;
  }

  // Upholding settles every open report on the sticker and rewards each reporter.
  const open = await store.pendingReportsForSticker(report.stickerId);
  await store.hideSticker(report.stickerId);
  await store.setReportStatus(
    open.map((r) => r.id),
    "upheld",
  );
  for (const r of open) await store.addCredit(r.reporterId, REPORT_REWARD, "report_upheld");

  const sticker = await store.getSticker(report.stickerId);
  if (sticker?.ownerId) {
    const until = new Date(Date.now() + PENALTY_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await store.addPenalty(sticker.ownerId, until);
  }
  return true;
}
