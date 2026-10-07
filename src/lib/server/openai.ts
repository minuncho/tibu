import type { StickerStyle } from "../types";
import { OPENAI_API_KEY, OPENAI_IMAGE_MODEL } from "./env";

// Target look for each style: see references/ at the project root.
const COMMON =
  "Keep the same animal with its exact fur colors, markings and face so the owner recognizes their pet. " +
  "Show the whole pet, centered, with a little margin. " +
  "Fully transparent background. No text, no border, no frame, no ground shadow, no props.";

const PROMPTS: Record<StickerStyle, string> = {
  real:
    "Cut this pet out of the photo as a photorealistic sticker. It must still look like the real photograph: " +
    "real fur texture, real colors, real proportions. No stylization, no drawn outline, crisp cut-out edges. " +
    COMMON,
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

// Returns a transparent PNG of the pet redrawn in the given style.
export async function stylizePet(photo: Blob, style: StickerStyle): Promise<Buffer> {
  const form = new FormData();
  form.set("model", OPENAI_IMAGE_MODEL);
  form.set("image", photo, "pet.jpg");
  form.set("prompt", PROMPTS[style]);
  form.set("background", "transparent");
  form.set("output_format", "png");
  form.set("size", "1024x1024");
  form.set("quality", "medium");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });
  const data = await res.json().catch(() => null);
  const b64 = data?.data?.[0]?.b64_json;
  if (!res.ok || !b64) {
    throw new Error(data?.error?.message || `Image conversion failed (${res.status})`);
  }
  return Buffer.from(b64, "base64");
}
