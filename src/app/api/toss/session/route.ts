import { NextResponse } from "next/server";
import { fail, PublicError } from "@/lib/server/http";
import { getStore } from "@/lib/server/store";
import { createTossSession, exchangeAnonCode, tossEnabled, tossUserId } from "@/lib/server/toss";

// Sign-in for the Toss mini app: one-time SDK code in, our session token out.
export async function POST(req: Request) {
  if (!tossEnabled) return fail(404, "Not available");
  const body = await req.json().catch(() => ({}));
  if (typeof body.code !== "string" || !body.code) return fail(400, "Missing code");

  try {
    const anonKey = await exchangeAnonCode(body.code);
    const userId = tossUserId(anonKey);
    await getStore().ensureUser(userId);
    return NextResponse.json({ token: createTossSession(userId) });
  } catch (e) {
    console.error(e);
    return fail(e instanceof PublicError ? 401 : 500, e instanceof PublicError ? e.message : "잠시 후 다시 시도해 주세요.");
  }
}
