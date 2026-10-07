import { NextResponse } from "next/server";
import type { AppState } from "@/lib/types";
import { getUser, isStaff } from "@/lib/server/auth";
import { localDate, requestCountry } from "@/lib/server/day";
import { aiEnabled, isLive } from "@/lib/server/env";
import { createsLeft, drawsLeft } from "@/lib/server/quota";
import { getStore, toSticker } from "@/lib/server/store";

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
    bannedUntil: null,
    latest: null,
  };
  if (user) {
    const store = getStore();
    const [creates, draws, banned, latest] = await Promise.all([
      createsLeft(user.id, date),
      drawsLeft(user.id, date),
      store.penaltyUntil(user.id),
      store.latestInAlbum(user.id),
    ]);
    state.createsLeft = creates;
    state.drawsLeft = draws;
    state.bannedUntil = banned;
    state.latest = latest ? toSticker(latest) : null;
  }
  return NextResponse.json(state);
}
