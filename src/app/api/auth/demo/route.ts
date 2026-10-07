import { NextResponse } from "next/server";
import { DEMO_COOKIE } from "@/lib/server/auth";
import { isLive } from "@/lib/server/env";

// Fake sign-in, only available while Supabase is not configured.
export async function POST() {
  if (isLive) return NextResponse.json({ error: "Not available" }, { status: 404 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEMO_COOKIE, "1", { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
