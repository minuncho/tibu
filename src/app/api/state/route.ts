import { NextResponse } from "next/server";
import { CREATES_PER_DAY, type AppState } from "@/lib/types";
import { getUser, hasNoLimits, isStaff } from "@/lib/server/auth";
import { localDate, requestCountry } from "@/lib/server/day";
import { aiEnabled, isLive } from "@/lib/server/env";
import { drawsLeft } from "@/lib/server/quota";
import { getStore, toSticker } from "@/lib/server/store";

// What staff see as their remaining chances.
const UNLIMITED = 999;

export async function GET(req: Request) {
  const date = localDate(req);
  const user = await getUser();
  const state: AppState = {
    mode: isLive ? "live" : "demo",
    aiEnabled,
    user: user && {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isStaff: isStaff(user),
    },
    date,
    country: requestCountry(req),
    createsLeft: 0,
    drawsLeft: 0,
    unlimited: false,
    removed: [],
    latest: null,
  };
  if (user) {
    // One parallel wave of queries: every extra sequential step is a full round trip to the database.
    const store = getStore();
    const [generations, draws, latest, removed] = await Promise.all([
      store.countGenerations(user.id, date),
      drawsLeft(user.id, date),
      store.latestInAlbum(user.id),
      store.listRemovedMade(user.id),
    ]);
    state.removed = removed.map((s) => ({ id: s.id, serialNo: s.serialNo, name: s.name }));
    if (hasNoLimits(user)) {
      state.unlimited = true;
      state.createsLeft = UNLIMITED;
      state.drawsLeft = UNLIMITED;
    } else {
      state.createsLeft = Math.max(0, CREATES_PER_DAY - generations);
      state.drawsLeft = draws;
    }
    state.latest = latest ? toSticker(latest) : null;
  }
  return NextResponse.json(state);
}
