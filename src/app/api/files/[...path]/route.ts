import fs from "node:fs";
import path from "node:path";
import { isLive } from "@/lib/server/env";
import { DEMO_FILES_DIR } from "@/lib/server/store-demo";

const TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg" };

// Serves demo-mode uploads. In live mode images come straight from Supabase Storage.
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (isLive) return new Response("Not found", { status: 404 });
  const { path: parts } = await ctx.params;
  const full = path.resolve(DEMO_FILES_DIR, ...parts);
  if (!full.startsWith(DEMO_FILES_DIR + path.sep) || !fs.existsSync(full)) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(fs.readFileSync(full)), {
    headers: { "content-type": TYPES[path.extname(full)] || "application/octet-stream" },
  });
}
