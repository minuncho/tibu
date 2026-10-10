import { CONVERSION_COST_USD, MONTHLY_BUDGET_USD } from "./env";
import { getStore } from "./store";

export { CLOSED_CODE, CLOSED_MESSAGE } from "./closed";

// The month's budget is shared out over its remaining days: each day may spend
// (what is left of the budget) / (days left, today included). A busy day therefore
// shrinks the following days instead of emptying the month, and a quiet one adds to them.
// Days are counted in Korean time, where nearly all users are.
export async function makingOpen(): Promise<boolean> {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const [year, month, day] = today.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const store = getStore();
  const [sinceMonthStart, sinceToday] = await Promise.all([
    store.countGenerationsFrom(`${today.slice(0, 8)}01`),
    store.countGenerationsFrom(today),
  ]);
  const spentBeforeToday = (sinceMonthStart - sinceToday) * CONVERSION_COST_USD;
  const todaysShare = Math.max(0, MONTHLY_BUDGET_USD - spentBeforeToday) / (daysInMonth - day + 1);
  return (sinceToday + 1) * CONVERSION_COST_USD <= todaysShare;
}
