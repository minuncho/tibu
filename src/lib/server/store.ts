import type { ReportReason, Sticker, StickerStyle } from "../types";
import { isLive } from "./env";
import { thumbPath } from "./thumb";
import { demoStore } from "./store-demo";
import { supabaseStore } from "./store-supabase";

export type StickerRow = {
  id: string;
  serialNo: number;
  // null once the maker has deleted their account
  ownerId: string | null;
  name: string;
  bubble: string;
  style: StickerStyle;
  imagePath: string;
  country: string | null;
  createdAt: string;
};

export type GenerationRow = {
  id: string;
  userId: string;
  candidates: Record<StickerStyle, string>;
  used: boolean;
};

export type DrawnRow = { drawId: string; drawnAt: string; sticker: StickerRow };

export type ReportStatus = "pending" | "upheld" | "rejected";
// A maker's reply about a removed sticker is stored in the same table as reports,
// with the text after this prefix in place of a reason. Staff see both in one queue.
export const REPLY_PREFIX = "reply:";

export type ReportRow = {
  id: string;
  reporterId: string;
  stickerId: string;
  reason: ReportReason | `reply:${string}`;
  status: ReportStatus;
  createdAt: string;
};

// Stickers hidden by an upheld report never come back from any list or draw.
export interface Store {
  countGenerations(userId: string, date: string): Promise<number>;
  createGeneration(g: {
    id: string;
    userId: string;
    date: string;
    candidates: Record<StickerStyle, string>;
  }): Promise<void>;
  getGeneration(id: string): Promise<GenerationRow | null>;
  // Returns false when the generation was already turned into a sticker.
  claimGeneration(id: string): Promise<boolean>;

  createSticker(s: {
    ownerId: string;
    name: string;
    bubble: string;
    style: StickerStyle;
    imagePath: string;
    country: string;
    date: string;
  }): Promise<StickerRow>;
  getSticker(id: string): Promise<StickerRow | null>;
  setStickerHidden(id: string, hidden: boolean): Promise<void>;
  // Every sticker, newest number first, including hidden ones. For staff only.
  listAllStickers(
    offset: number,
    limit: number,
  ): Promise<{ total: number; rows: (StickerRow & { hidden: boolean })[] }>;
  countStickersMade(userId: string, date: string): Promise<number>;
  listMade(userId: string): Promise<StickerRow[]>;
  // The user's own stickers that were taken down.
  listRemovedMade(userId: string): Promise<StickerRow[]>;

  // A handful of other people's visible stickers in random order, for the waiting screen.
  sampleStickers(excludeOwnerId: string, limit: number): Promise<StickerRow[]>;

  // Uniformly random over every sticker not owned by the user.
  randomSticker(excludeOwnerId: string): Promise<StickerRow | null>;
  createDraw(d: {
    userId: string;
    stickerId: string;
    date: string;
    usedCredit: boolean;
  }): Promise<void>;
  // Draws paid for by the daily allowance (credit draws are not counted).
  countDailyDraws(userId: string, date: string): Promise<number>;
  hasDrawn(userId: string, stickerId: string): Promise<boolean>;
  listDrawn(userId: string): Promise<DrawnRow[]>;
  // Newest sticker the user made or drew, whichever happened last.
  latestInAlbum(userId: string): Promise<StickerRow | null>;

  // Draw credits do not expire. Negative amounts spend them.
  creditBalance(userId: string): Promise<number>;
  addCredit(userId: string, amount: number, reason: string): Promise<void>;

  // Returns false when this user already reported this sticker.
  createReport(r: {
    reporterId: string;
    stickerId: string;
    reason: ReportRow["reason"];
  }): Promise<boolean>;
  getReport(id: string): Promise<ReportRow | null>;
  listPendingReports(): Promise<(ReportRow & { sticker: StickerRow })[]>;
  pendingReportsForSticker(stickerId: string): Promise<ReportRow[]>;
  setReportStatus(ids: string[], status: ReportStatus): Promise<void>;

  // Makes sure an account row exists for a user who signs in without Google (the Toss version).
  ensureUser(userId: string): Promise<void>;

  // Erases the user and everything tied to them except the stickers they made:
  // those stay in the pool and in other people's albums, no longer linked to anyone.
  deleteAccount(userId: string): Promise<void>;

  putFile(path: string, bytes: Buffer, contentType: string): Promise<void>;
  fileUrl(path: string): string;
}

export function getStore(): Store {
  return isLive ? supabaseStore : demoStore;
}

// Address of the small on-screen version of a stored image. Only AI-converted PNGs in
// live storage have one; demo files and seed art are shown as they are.
export function thumbUrl(imagePath: string) {
  // Served through /img so it is cached at the edge (see src/app/img).
  return isLive && imagePath.endsWith(".png")
    ? `/img/${thumbPath(imagePath)}`
    : getStore().fileUrl(imagePath);
}

export function toSticker(row: StickerRow): Sticker {
  return {
    id: row.id,
    serialNo: row.serialNo,
    name: row.name,
    bubble: row.bubble,
    style: row.style,
    imageUrl: getStore().fileUrl(row.imagePath),
    thumbUrl: thumbUrl(row.imagePath),
    country: row.country,
  };
}
