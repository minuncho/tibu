import type { StickerStyle } from "../types";
import { OPENAI_API_KEY, OPENAI_IMAGE_MODEL } from "./env";
import { PublicError } from "./http";

// Wording tuned on gpt-image-2.5-sunburst. That model adds fur detail and elaborate eyes
// unless told plainly not to, hence the many "no ..." clauses.

// Shared by the two drawn styles.
const COMMON_REST =
  "Keep the pose from the photo: a sitting pet stays sitting, a lying pet stays lying, facing the same way. " +
  "Show the whole pet, centered, with a little margin. " +
  "Fully transparent background. " +
  "No text, no border, no frame, no ground shadow, no props.";

const COMMON =
  "Keep the same animal so the owner recognizes their pet: the same main colors, with its markings in the same places. " +
  COMMON_REST;

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
  // 3D: a solid molded toy figure, tuned against five renders the owner picked as the look
  // they want. It does not use DESIGN. What matters to them: very few large smooth forms (a
  // fluffy coat must not turn into stacked lobes), the animal's real body shape (not a
  // balloon), bold saturated colors, and gloss only on top of the head.
  "3d":
    "Turn this pet into a solid molded vinyl toy figure, shown as a clean 3D render. " +
    "It is a firm, solid sculpted figure, not inflated and not a balloon: keep the animal's real body shape and its distinctive features (a long body stays long, a thin tail stays thin, a flat body stays flat, a crest or spikes stay as crisp simple shapes), just simplified and a little chubbier. " +
    "Proportions are those of a cute chibi toy, not the real animal: the head is very large, about as big as the whole body (roughly two heads tall in total), with a small compact body and very short, thick legs. " +
    "Build it from very few large simple forms with clean smooth surfaces and soft smooth transitions. " +
    "Never break a form into smaller lumps: no stacked lobes, no ridges, no creases, no folds, no rolls, no cloud-like bumps, no scalloped edges. " +
    "Fur is never shown or hinted at: no hairs, no tufts, no fluff. " +
    "A fluffy coat or a ruff simply makes the head and body one size bigger and rounder, still perfectly plain and smooth, like a polished pebble. " +
    "Long hairy ears become plain smooth flaps with no grooves, and a bushy tail becomes one plain smooth shape. " +
    "All four legs stay clearly visible as short thick stubs. " +
    "The surface is seamless with no texture. " +
    "Finish: smooth semi-gloss hard plastic, like a new toy, not clay, not rubber, not wax. " +
    "The render is sharp with crisp clean silhouettes, not soft-focus, hazy or glowing. " +
    "Light colors get one clear, well-defined highlight on the top of the head and a gentle sheen on the upper back; the legs, belly, ears, tail and cheeks have no highlights. " +
    "Dark colors stay nearly matte with only a faint sheen. " +
    "No shiny streaks, no wet or glassy look. " +
    "Soft even studio lighting with gentle shadows underneath that show the volume. " +
    "Colors: pick the pet's two or three characteristic colors and make them bold, rich and saturated, as solid opaque toy paint: white stays a clean bright white, cream becomes a warm golden yellow, tan becomes a strong caramel orange, brown a deep chocolate, gray a strong medium-dark slate gray, black a true black. " +
    "Never pale, pastel, washed out, milky or translucent. " +
    "Markings become a few large clean patches with crisp edges and strong contrast, and a striped coat keeps only three or four wide stripes on the back and none on the legs or face. " +
    "Face: two small round glossy black bead eyes set wide apart, each with one tiny white highlight; a small dark rounded nose; a small friendly smiling mouth, never a frown. " +
    "No eyelids, no eyebrows, no whiskers, no colored iris. " +
    "Keep the same animal so the owner recognizes their pet: its breed shape, main colors, and markings in the same places. " +
    COMMON_REST,
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
