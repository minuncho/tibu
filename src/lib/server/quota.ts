import { AD_DRAWS_PER_DAY, BASE_DRAWS_PER_DAY, CREATES_PER_DAY } from "../types";
import { getStore } from "./store";

export async function createsLeft(userId: string, date: string) {
  const used = await getStore().countGenerations(userId, date);
  return Math.max(0, CREATES_PER_DAY - used);
}

// A few free draws a day, plus one per sticker made that day. Unused ones expire at midnight.
export async function dailyDrawsLeft(userId: string, date: string) {
  const store = getStore();
  const [made, drawn] = await Promise.all([
    store.countStickersMade(userId, date),
    store.countDailyDraws(userId, date),
  ]);
  return Math.max(0, BASE_DRAWS_PER_DAY + made - drawn);
}

// Daily draws plus saved credits (credits never expire and are spent last).
export async function drawsLeft(userId: string, date: string) {
  const [daily, credits] = await Promise.all([
    dailyDrawsLeft(userId, date),
    getStore().creditBalance(userId),
  ]);
  return daily + Math.max(0, credits);
}

// Draws earned by watching a rewarded ad are saved as credits with this reason, one entry
// each, which is also how the day's count is kept.
export const adReason = (date: string) => `ad:${date}`;

export async function adDrawsLeft(userId: string, date: string) {
  const earned = await getStore().countCredits(userId, adReason(date));
  return Math.max(0, AD_DRAWS_PER_DAY - earned);
}
