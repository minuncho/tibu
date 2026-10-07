import { NextResponse } from "next/server";
import { DEMO_COOKIE, supabaseServer } from "@/lib/server/auth";
import { isLive } from "@/lib/server/env";

export async function POST() {
  if (isLive) {
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(DEMO_COOKIE);
  return res;
}
