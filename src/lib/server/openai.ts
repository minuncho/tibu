import { readFile } from "node:fs/promises";
import path from "node:path";
import type { StickerStyle } from "../types";
import { OPENAI_API_KEY, OPENAI_IMAGE_MODEL } from "./env";
import { PublicError } from "./http";

// Wording tuned on gpt-image-2.5-sunburst (2026-10-09). That model adds fur detail and
// large shaded eyes unless told plainly not to, hence the many "no ..." clauses.

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
  // Drawn styles: as simple and gentle as possible. Detailed fur and large eyes read as creepy.
  "3d":
    "Turn this pet into a cute, very simple toy figure, as a clean 3D render. " +
    "It is made of smooth glossy vinyl, polished like glazed ceramic, with soft reflections and no texture at all: no fur, no hair strands, no fluff. " +
    "Simplify as far as possible: rounded balloon-like shapes, a big round head, a small body, short stubby legs and almost no detail. " +
    "Reduce the markings to a few large simple patches, with no fine stripes or speckles. " +
    "The face must look gentle and friendly: two round solid black bead eyes with one small white highlight each, set wide apart, a small rounded nose and a tiny mouth. " +
    "No pupils or irises, no whiskers, no eyelashes, no teeth. " +
    "Use the pet's own colors, clean and bright, with soft even studio lighting. " +
    COMMON,
  "2d":
    "Redraw this pet as a cute, extremely simple flat sticker illustration. " +
    "Soft rounded shapes with a big round head and almost no detail; a few soft rounded tufts may suggest fluff, but no thin strands or spikes. " +
    "At most three or four flat pastel colors, with the markings reduced to a few large simple patches and no fine stripes. " +
    "No outlines, no gradients, no shading, no highlights. " +
    "The face must look gentle and friendly: two small solid black dot eyes set wide apart, a tiny nose with a tiny mouth, and two soft pink cheek circles. " +
    "No large eyes, no pupils or irises, no whiskers. " +
    "Use pastel versions of the pet's own colors. " +
    COMMON,
};

// The drawn styles also get a picture of the look we are after (src/assets/style-*.png, chosen
// by the owner). It pins down the finish and the face far better than words alone.
const STYLE_LEAD =
  "The first image is the pet to draw. The second image is a style reference only: match its level of " +
  "simplification, its material and finish and the way its face is drawn, but do not copy its animal, " +
  "colors, markings or pose. ";

// Returns a transparent PNG of the pet in the given style.
export async function stylizePet(photo: Blob, style: StickerStyle): Promise<Buffer> {
  const reference = await styleReference(style);
  const form = new FormData();
  form.set("model", OPENAI_IMAGE_MODEL);
  if (reference) {
    form.append("image[]", photo, "pet.jpg");
    form.append("image[]", reference, "style.png");
    form.set("prompt", STYLE_LEAD + PROMPTS[style]);
  } else {
    form.set("image", photo, "pet.jpg");
    form.set("prompt", PROMPTS[style]);
  }
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

// Each path is spelled out so the bundler ships the file with the server code.
// A missing file only costs the reference: the style then relies on its wording.
async function styleReference(style: StickerStyle): Promise<Blob | null> {
  try {
    if (style === "3d") {
      return new Blob([await readFile(path.join(process.cwd(), "src/assets/style-3d.png"))], PNG);
    }
    if (style === "2d") {
      return new Blob([await readFile(path.join(process.cwd(), "src/assets/style-2d.png"))], PNG);
    }
  } catch (e) {
    console.error("style reference missing", e);
  }
  return null;
}

const PNG = { type: "image/png" };
