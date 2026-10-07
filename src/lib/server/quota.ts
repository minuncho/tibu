import { BASE_DRAWS_PER_DAY, CREATES_PER_DAY } from "../types";
import { getStore } from "./store";

// Zero while a report penalty is in force.
export async function createsLeft(userId: string, date: string) {
  const store = getStore();
  const [banned, used] = await Promise.all([
    store.penaltyUntil(userId),
    store.countGenerations(userId, date),
  ]);
  return banned ? 0 : Math.max(0, CREATES_PER_DAY - used);
}

// One free draw a day, plus one per sticker made that day. Unused ones expire at midnight.
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
