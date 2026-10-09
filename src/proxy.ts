import { NextResponse, type NextRequest } from "next/server";

// The Toss mini app (tibu-toss) is served from Toss's own domains and calls this API across
// origins. Everyone else uses the API from this site and needs no CORS headers.
const TOSS_ORIGINS = [
  "https://tibu.apps.tossmini.com",
  "https://tibu.private-apps.tossmini.com",
];
const DEV_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/;

function allowed(origin: string | null) {
  if (!origin) return false;
  if (TOSS_ORIGINS.includes(origin)) return true;
  return process.env.NODE_ENV !== "production" && DEV_ORIGIN.test(origin);
}

export function proxy(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!allowed(origin)) return NextResponse.next();

  const headers = {
    "access-control-allow-origin": origin!,
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, x-timezone, x-region",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
  if (req.method === "OPTIONS") return new NextResponse(null, { status: 204, headers });

  const res = NextResponse.next();
  for (const [name, value] of Object.entries(headers)) res.headers.set(name, value);
  return res;
}

export const config = { matcher: "/api/:path*" };
