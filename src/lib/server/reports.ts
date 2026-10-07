import { PENALTY_DAYS, REPORT_REWARD } from "../types";
import { getStore } from "./store";

// Takes a sticker down: it leaves the draw pool and every album, and everyone with an open
// report on it is rewarded. With penalize, its maker is also blocked from making stickers
// for a while. Either way the maker is told on their home screen (see AppState.removed).
export async function removeSticker(stickerId: string, penalize: boolean) {
  const store = getStore();
  const open = await store.pendingReportsForSticker(stickerId);
  await store.setStickerHidden(stickerId, true);
  if (open.length > 0) {
    await store.setReportStatus(
      open.map((r) => r.id),
      "upheld",
    );
    for (const r of open) await store.addCredit(r.reporterId, REPORT_REWARD, "report_upheld");
  }

  if (!penalize) return;
  // No one to penalize if the maker already deleted their account.
  const sticker = await store.getSticker(stickerId);
  if (sticker?.ownerId) {
    const until = new Date(Date.now() + PENALTY_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await store.addPenalty(sticker.ownerId, until);
  }
}

// Staff decision on a report. Returns false if it was already decided.
export async function resolveReport(reportId: string, upheld: boolean) {
  const store = getStore();
  const report = await store.getReport(reportId);
  if (!report || report.status !== "pending") return false;

  if (upheld) {
    await removeSticker(report.stickerId, true);
  } else {
    // The reporter gets nothing back; the draw they spent stays spent.
    await store.setReportStatus([report.id], "rejected");
  }
  return true;
}
