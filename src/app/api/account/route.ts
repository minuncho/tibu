import { NextResponse } from "next/server";
import { DEMO_COOKIE, supabaseServer } from "@/lib/server/auth";
import { isLive } from "@/lib/server/env";
import { withUser } from "@/lib/server/http";
import { getStore } from "@/lib/server/store";

// Deletes the signed-in account. Stickers the user made are kept (see Store.deleteAccount).
export const DELETE = withUser(async (_req, user) => {
  await getStore().deleteAccount(user.id);

  const res = NextResponse.json({ ok: true });
  if (isLive) {
    // The user no longer exists, so only the local session cookies need clearing.
    const supabase = await supabaseServer();
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  } else {
    res.cookies.delete(DEMO_COOKIE);
  }
  return res;
});
