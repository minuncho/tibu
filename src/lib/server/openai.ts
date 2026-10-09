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

// What the owner cares about most in the drawn styles: the pet is redesigned as a simple
// mascot with no fur at all. Even "rounded fluffy volumes" read as fur to them; the edge
// has to be one plain line, as if the fluff were shaved off.
const DESIGN =
  "Most important: redesign the pet as a simple cartoon creature with smooth bare skin instead of fur, the way a character designer reduces an animal to a mascot. " +
  "There is no fur, no fluff and no hair at all, and nothing that hints at it: no tufts, no bumps, no waves, no scallops, no cloud-like or lumpy edges. " +
  "Every edge of the body is one plain, clean, continuous line, as if the fluff had been shaved off and the shape traced with a single stroke. " +
  "Build the body from a few plain geometric forms: a simple round head, a simple pear-shaped body, short stubby limbs without toes, and ears and tail as simple flat shapes with one smooth edge. " +
  "A fluffy pet just becomes a slightly chubbier plain shape. " +
  "Use only two or three flat colors. " +
  "Reduce the coat pattern to at most three bold simple patches with clean edges; drop small stripes, spots and speckles, and turn many thin stripes into two or three wide ones. " +
  "Eyes are small solid black circles with one white dot, no colored iris; a tiny nose; a small smiling mouth. " +
  "No whiskers, no eyelashes. ";

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
  // 3D: a smooth in-game character model with soft shading.
  "3d":
    "Turn this pet into a 3D character model from a classic monster-collecting video game, shown as a clean official render. " +
    DESIGN +
    "The surface is perfectly smooth and untextured, like molded plastic, in plain solid colors, with soft simple shading: a gentle highlight and a clear soft shadow on each rounded form to show its volume. " +
    COMMON,
  // 2D: outlined cel art like the stickers that come in snack bread. A flat, lineless
  // version did not read as "2D" to the owner.
  "2d":
    "Redraw this pet as 2D anime character art, in the style of official cel artwork for a classic monster-collecting video game as printed on collectible bread stickers. " +
    DESIGN +
    "Thin, even, dark outlines drawn as long smooth single strokes, with almost no lines inside the shapes. " +
    "Completely flat solid color fills: no gradients, no shading, no highlights, no 3D look. " +
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
