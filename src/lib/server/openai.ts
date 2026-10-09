import type { StickerStyle } from "../types";
import { OPENAI_API_KEY, OPENAI_IMAGE_MODEL } from "./env";
import { PublicError } from "./http";

// Wording tuned on gpt-image-2.5-sunburst. That model adds fur detail and elaborate eyes
// unless told plainly not to, hence the many "no ..." clauses.

// Shared by the two drawn styles.
const COMMON =
  "Keep the same animal so the owner recognizes their pet: the same main colors, with its markings in the same places. " +
  "Keep the pose from the photo: a sitting pet stays sitting, a lying pet stays lying, facing the same way. " +
  "Show the whole pet, centered, with a little margin. " +
  "Fully transparent background. " +
  "No text, no border, no frame, no ground shadow, no props.";

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
  // 3D: a smooth toy-store figure. Sculpted fur and glossy balloon toys were both rejected.
  "3d":
    "Turn this pet into a soft vinyl toy figure, shown as a studio product photo of the real toy. " +
    "A cartoon mascot version of this pet with very simple, rounded, chunky shapes, a large head and short limbs. " +
    "The whole surface is perfectly smooth molded plastic: fur is not sculpted at all, so there are no tufts, clumps, ridges, grooves or hair lines anywhere, and the ears, head, body and tail are plain smooth rounded forms. " +
    "Smooth matte vinyl in flat solid colors with gentle soft shading only, no gloss. " +
    "Simplify the coat pattern drastically: replace stripes, spots and speckles with at most three or four large plain patches of color with clean edges. " +
    "Painted cartoon eyes: dark ovals with one small white highlight; a small nose; a small happy mouth. " +
    "No whiskers, no eyelashes. " +
    "Clean bright colors taken from the pet. " +
    COMMON,
  // 2D: outlined anime art like the stickers that come in snack bread. A flat, lineless
  // version did not read as "2D" to the owner.
  "2d":
    "Redraw this pet as 2D anime character art, in the style of official artwork for a classic monster-collecting video game as printed on collectible bread stickers. " +
    "Clean, even, thin dark outlines around every shape. " +
    "The outline is a smooth, simple contour drawn with very few lines: no fur tufts, zigzags, spikes or individual hairs, either on the outline or inside it. " +
    "Flat solid colors with no gradients; at most one slightly darker flat tone for shadow. " +
    "A very simplified cartoon design made of simple rounded shapes, with the coat pattern reduced to at most three or four flat patches instead of stripes or speckles. " +
    "Simple cartoon eyes: solid dark ovals with one white highlight; a tiny nose; a small happy mouth. " +
    "No whiskers, no eyelashes, no realistic detail, no 3D shading. " +
    COMMON,
};

// Returns a transparent PNG of the pet in the given style.
export async function stylizePet(photo: Blob, style: StickerStyle): Promise<Buffer> {
  const form = new FormData();
  form.set("model", OPENAI_IMAGE_MODEL);
  form.set("image", photo, "pet.jpg");
  form.set("prompt", PROMPTS[style]);
  form.set("background", "transparent");
  form.set("output_format", "png");
  form.set("size", "1024x1024");
  form.set("quality", "medium");
  // The first-generation models can be told to stay close to the input; later ones reject the setting.
  if (style === "real" && /^gpt-image-1/.test(OPENAI_IMAGE_MODEL)) form.set("input_fidelity", "high");

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
