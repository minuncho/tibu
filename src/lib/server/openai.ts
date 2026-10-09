import type { StickerStyle } from "../types";
import { OPENAI_API_KEY, OPENAI_IMAGE_MODEL } from "./env";
import { PublicError } from "./http";

// Wording tuned on gpt-image-2.5-sunburst (2026-10-09). That model adds fur detail and
// large shaded eyes unless told plainly not to, hence the many "no ..." clauses.

// Shared by the two drawn styles.
const COMMON =
  "Keep the same animal so the owner recognizes their pet: the same colors and the same markings in the same places. " +
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
    "Turn this pet into a collectible vinyl toy figure, as a clean 3D render. " +
    "Simplify it heavily: a smooth, inflated, balloon-like body with a big round head and short chunky legs. " +
    "No fur strands, no hair texture and no fluff anywhere: every surface is smooth molded vinyl with a soft gloss. " +
    "Use only the pet's two or three main colors, as large clean patches where its markings are. " +
    "Plain solid black bead eyes, a small rounded nose, no whiskers, no eyelashes, no teeth. " +
    "Three-quarter view, soft even studio lighting. " +
    COMMON,
  "2d":
    "Redraw this pet as a very simple flat mascot icon. " +
    "One smooth rounded silhouette with no fur tufts, spikes or stray hairs. " +
    "Three or four flat pastel colors as large simple shapes, with no outlines, no gradients, no shading and no highlights. " +
    "Front-facing and symmetric, standing upright, with a big round head, a small round body and short stubby legs. " +
    "Face: two small solid dark oval eyes, a tiny nose and two pink cheek ovals, nothing else. " +
    "Use pastel versions of the pet's own colors. " +
    COMMON,
};

// Returns a transparent PNG of the pet in the given style.
export async function stylizePet(photo: Blob, style: StickerStyle): Promise<Buffer> {
  // The first-generation models can be told to stay close to the input; later ones reject the setting.
  const faithful = style === "real" && /^gpt-image-1/.test(OPENAI_IMAGE_MODEL);
  return requestImage(photo, style, faithful ? { input_fidelity: "high" } : {});
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
