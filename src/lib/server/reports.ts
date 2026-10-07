import { REPORT_REWARD } from "../types";
import { getStore, REPLY_PREFIX } from "./store";

// Takes a sticker down: it leaves the draw pool and every album, and everyone with an open
// report on it is rewarded. The maker is not penalized, only told on their home screen
// (see AppState.removed).
export async function removeSticker(stickerId: string) {
  const store = getStore();
  // Replies from the maker wait in the same queue but are not reports, so they earn nothing.
  const open = (await store.pendingReportsForSticker(stickerId)).filter(
    (r) => !r.reason.startsWith(REPLY_PREFIX),
  );
  await store.setStickerHidden(stickerId, true);
  if (open.length > 0) {
    await store.setReportStatus(
      open.map((r) => r.id),
      "upheld",
    );
    for (const r of open) await store.addCredit(r.reporterId, REPORT_REWARD, "report_upheld");
  }
}

// Staff decision on a report or a maker's reply. Returns false if it was already decided.
export async function resolveReport(reportId: string, upheld: boolean) {
  const store = getStore();
  const report = await store.getReport(reportId);
  if (!report || report.status !== "pending") return false;

  if (report.reason.startsWith(REPLY_PREFIX)) {
    // A maker's reply: agreeing with it puts the sticker back.
    if (upheld) await store.setStickerHidden(report.stickerId, false);
    await store.setReportStatus([report.id], upheld ? "upheld" : "rejected");
    return true;
  }

  if (upheld) {
    await removeSticker(report.stickerId);
  } else {
    // The reporter gets nothing back; the draw they spent stays spent.
    await store.setReportStatus([report.id], "rejected");
  }
  return true;
}
