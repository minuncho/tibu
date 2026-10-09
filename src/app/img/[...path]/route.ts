import { SUPABASE_URL } from "@/lib/server/env";

// Sticker images live in storage in Sydney. Serving them through this route lets Vercel's
// edge keep a copy near each visitor, so after the first request an image comes from a
// nearby cache instead of crossing the ocean. Paths are never reused, hence the long lifetime.
const ALLOWED = /^[\w-]+\/[\w-]+\/[\w-]+\.(webp|png)$/;

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const path = (await ctx.params).path.join("/");
  if (!SUPABASE_URL || !ALLOWED.test(path)) return new Response("Not found", { status: 404 });

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/public/stickers/${path}`);
  if (!res.ok || !res.body) return new Response("Not found", { status: 404 });

  return new Response(res.body, {
    headers: {
      "content-type": res.headers.get("content-type") || "image/webp",
      "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "access-control-allow-origin": "*",
    },
  });
}
