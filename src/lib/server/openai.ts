import type { StickerStyle } from "../types";
import { OPENAI_API_KEY, OPENAI_IMAGE_MODEL } from "./env";
import { PublicError } from "./http";

// Shared by all three styles.
const COMMON =
  "Keep the same animal with its exact fur colors, markings and face so the owner recognizes their pet. " +
  "Show the whole pet, centered, with a little margin. " +
  "Fully transparent background. No text, no border, no frame, no ground shadow, no props.";

const PROMPTS: Record<StickerStyle, string> = {
  // Realistic means the owner's actual photo with the background taken away, nothing else.
  // It does not share COMMON: "show the whole pet, centered" invites redrawing and reframing.
  real:
    "Remove the background from this photo and change nothing else. Do not redraw, restyle, retouch, " +
    "smooth, sharpen, recolor or relight the pet. Keep the pet exactly as photographed: the same fur and " +
    "markings, the same eyes and expression, the same pose, size, position and framing, including any part " +
    "cut off by the edge of the photo. Do not add or complete anything. " +
    "Output only the unchanged pet on a fully transparent background, with clean edges and no outline, " +
    "shadow, text or border.",
  "3d":
    "Redraw this pet as a clean 3D video-game creature model render: smooth glossy surfaces with no fur " +
    "texture, simple rounded shapes, bright solid colors, soft even shading, simple round eyes, " +
    "three-quarter view. " +
    COMMON,
  "2d":
    "Redraw this pet as a minimal flat vector sticker: no outlines at all, only soft pastel color shapes, " +
    "very simple rounded forms, front-facing and symmetric, standing upright with a big round head and a " +
    "small round body, two small dark oval eyes, a tiny nose, pink cheek ovals, no mouth detail, " +
    "no shading, no gradients, no texture. Use pastel versions of the pet's own colors. " +
    COMMON,
};

// Returns a transparent PNG of the pet in the given style.
export async function stylizePet(photo: Blob, style: StickerStyle): Promise<Buffer> {
  // For Realistic, ask the model to stay as close to the photo as it can. Not every model
  // has this setting, so a refusal of it is retried without.
  if (style === "real") {
    try {
      return await requestImage(photo, style, { input_fidelity: "high" });
    } catch (e) {
      if (!(e instanceof PublicError && /input_fidelity/.test(e.message))) throw e;
    }
  }
  return requestImage(photo, style, {});
}

async function requestImage(photo: Blob, style: StickerStyle, extra: Record<string, string>) {
  const form = new FormData();
  form.set("model", OPENAI_IMAGE_MODEL);
  form.set("image", photo, "pet.jpg");
  form.set("prompt", PROMPTS[style]);
  form.set("background", "transparent");
  form.set("output_format", "png");
  form.set("size", "1024x1024");
  form.set("quality", "medium");
  for (const [name, value] of Object.entries(extra)) form.set(name, value);

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });
  const data = await res.json().catch(() => null);
  const b64 = data?.data?.[0]?.b64_json;
  if (!res.ok || !b64) {
    // OpenAI's own message (policy refusal, unverified organization, no credit) is safe to show.
    throw new PublicError(data?.error?.message || `Image conversion failed (${res.status})`);
  }
  return Buffer.from(b64, "base64");
}
