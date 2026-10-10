import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { STYLES, type Candidate, type StickerStyle } from "@/lib/types";
import { hasNoLimits } from "@/lib/server/auth";
import { CLOSED_CODE, CLOSED_MESSAGE, makingOpen } from "@/lib/server/budget";
import { localDate } from "@/lib/server/day";
import { aiEnabled } from "@/lib/server/env";
import { fail, withUser } from "@/lib/server/http";
import { stylizePet } from "@/lib/server/openai";
import { createsLeft } from "@/lib/server/quota";
import { getStore, thumbUrl } from "@/lib/server/store";
import { makeThumb, thumbPath } from "@/lib/server/thumb";

export const maxDuration = 300;

const MAX_BYTES = 8 * 1024 * 1024;

export const POST = withUser(async (req, user) => {
  const date = localDate(req);
  // Staff have no daily limit, so they can stock the draw pool.
  if (!hasNoLimits(user) && (await createsLeft(user.id, date)) <= 0) {
    return fail(403, "No sticker chances left today");
  }

  // The month's image budget, shared out by day. Staff are not held back by it.
  if (aiEnabled && !hasNoLimits(user) && !(await makingOpen())) {
    return fail(503, CLOSED_MESSAGE, CLOSED_CODE);
  }

  const photo = (await req.formData()).get("photo");
  if (!(photo instanceof Blob) || !photo.type.startsWith("image/")) {
    return fail(400, "Please upload a photo");
  }
  if (photo.size > MAX_BYTES) return fail(400, "Photo is too large");

  const store = getStore();
  const id = randomUUID();
  const candidates = {} as Record<StickerStyle, string>;

  if (aiEnabled) {
    const images = await Promise.all(STYLES.map((style) => stylizePet(photo, style)));
    await Promise.all(
      STYLES.map(async (style, i) => {
        candidates[style] = `${user.id}/${id}/${style}.png`;
        await Promise.all([
          store.putFile(candidates[style], images[i], "image/png"),
          store.putFile(thumbPath(candidates[style]), await makeThumb(images[i]), "image/webp"),
        ]);
      }),
    );
  } else {
    // No OpenAI key: pass the photo through unchanged so the flow stays testable.
    const ext = photo.type === "image/png" ? "png" : "jpg";
    const bytes = Buffer.from(await photo.arrayBuffer());
    const path = `${user.id}/${id}/original.${ext}`;
    await store.putFile(path, bytes, photo.type);
    for (const style of STYLES) candidates[style] = path;
  }

  // The chance is spent here, once conversion has succeeded.
  await store.createGeneration({ id, userId: user.id, date, candidates });

  const result: Candidate[] = STYLES.map((style) => ({
    style,
    url: store.fileUrl(candidates[style]),
    thumbUrl: thumbUrl(candidates[style]),
  }));
  return NextResponse.json({ generationId: id, candidates: result });
});
