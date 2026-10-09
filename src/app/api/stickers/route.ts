import { NextResponse } from "next/server";
import {
  BUBBLE_MAX,
  COUNTRY_CODES,
  NAME_MAX,
  STICKER_BG_IDS,
  STYLES,
  TEST_SERIAL,
  type Sticker,
  type StickerBg,
  type StickerStyle,
} from "@/lib/types";
import { isStaff } from "@/lib/server/auth";
import { localDate } from "@/lib/server/day";
import { fail, withUser } from "@/lib/server/http";
import { getStore, thumbUrl, toSticker } from "@/lib/server/store";

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  const length = [...text].length;
  return length >= 1 && length <= max ? text : null;
}

export const POST = withUser(async (req, user) => {
  const body = await req.json().catch(() => ({}));
  const name = clean(body.name, NAME_MAX);
  const bubble = clean(body.bubble, BUBBLE_MAX);
  const style = body.style as StickerStyle;
  if (!name) return fail(400, `Name must be 1-${NAME_MAX} characters`);
  if (!bubble) return fail(400, `Speech bubble must be 1-${BUBBLE_MAX} characters`);
  if (!STYLES.includes(style)) return fail(400, "Pick a style");
  const country = String(body.country);
  if (!COUNTRY_CODES.includes(country)) return fail(400, "Pick a country");
  // Older clients send no background: those stickers stay white.
  const bg: StickerBg = STICKER_BG_IDS.includes(body.bg) ? body.bg : "white";

  const store = getStore();
  const generation = await store.getGeneration(String(body.generationId));
  if (!generation || generation.userId !== user.id) return fail(404, "Photo not found");
  if (!(await store.claimGeneration(generation.id))) {
    return fail(409, "This photo was already made into a sticker");
  }

  // Staff test run: build the sticker for the result screen without saving it. It takes no
  // serial number and never enters the album, the draw pool or the day's bonus draw.
  if (body.test === true && isStaff(user)) {
    const sticker: Sticker = {
      id: `test-${generation.id}`,
      serialNo: TEST_SERIAL,
      name,
      bubble,
      style,
      imageUrl: store.fileUrl(generation.candidates[style]),
      thumbUrl: thumbUrl(generation.candidates[style]),
      country,
      bg,
    };
    return NextResponse.json({ sticker });
  }

  const row = await store.createSticker({
    ownerId: user.id,
    name,
    bubble,
    style,
    imagePath: generation.candidates[style],
    country,
    bg,
    date: localDate(req),
  });
  return NextResponse.json({ sticker: toSticker(row) });
});
