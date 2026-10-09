// One-off: makes the small WebP for every converted PNG already in storage that lacks one.
// New conversions get theirs in /api/generate. Safe to run again; it only adds files.
//   node --env-file=.env.local scripts/backfill-thumbs.mjs
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const clean = (v) => (v || "").replace(/\s+/g, "").replace(/^["']|["']$/g, "");
const db = createClient(
  clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  { auth: { persistSession: false } },
);
const bucket = db.storage.from("stickers");

async function list(prefix) {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await bucket.list(prefix, { limit: 1000, offset });
    if (error) throw new Error(error.message);
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

// Files sit at <user>/<generation>/<style>.png
let made = 0;
let skipped = 0;
for (const user of await list("")) {
  for (const generation of await list(user.name)) {
    const dir = `${user.name}/${generation.name}`;
    const files = (await list(dir)).map((f) => f.name);
    for (const name of files.filter((f) => f.endsWith(".png"))) {
      const thumb = name.replace(/\.png$/, ".webp");
      if (files.includes(thumb)) {
        skipped++;
        continue;
      }
      const { data, error } = await bucket.download(`${dir}/${name}`);
      if (error) throw new Error(error.message);
      const webp = await sharp(Buffer.from(await data.arrayBuffer()))
        .resize(512, 512, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      const up = await bucket.upload(`${dir}/${thumb}`, webp, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "31536000",
      });
      if (up.error) throw new Error(up.error.message);
      made++;
    }
  }
}
console.log(`thumbnails made: ${made}, already there: ${skipped}`);
