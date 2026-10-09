import type { StickerStyle } from "../types";
import { OPENAI_API_KEY, OPENAI_IMAGE_MODEL } from "./env";
import { PublicError } from "./http";

// The two drawn styles are written as a short list of rules, one per line, worked out with
// the owner on gpt-image-2.5-sunburst against pictures they like. Each rule is there
// because the result went wrong without it; keep the wording when editing.

const PROMPTS: Record<StickerStyle, string> = {
  // Realistic means the owner's actual photo with the background taken away, nothing else.
  // It never asks to show the whole pet or to center it: that invites redrawing and reframing.
  real:
    "Remove the background from this photo and change nothing else. Do not redraw, restyle, retouch, " +
    "smooth, sharpen, recolor or relight the pet. Keep the pet exactly as photographed: the same fur and " +
    "markings, the same eyes and expression, the same pose, size, position and framing, including any part " +
    "cut off by the edge of the photo. Do not add or complete anything. " +
    "Output only the unchanged pet on a fully transparent background, with clean edges and no outline, " +
    "shadow, text or border.",
  // 3D: a smooth one-piece toy figure in plain basic colors.
  "3d": [
    "Turn this pet into a cute, simple 3D character, like a low-detail character model from a monster-collecting video game or a smooth plastic toy figure.",
    "- Shape: the whole animal is one single continuous lump, as if molded from one piece of soft material. Head, neck, chest, body, legs and tail flow into each other with no seams, no joints, no creases and no separate segments; legs are short bulges growing out of the body. Only the ears, eyes, nose and any clothing are separate pieces on top. Keep what makes its body type recognizable.",
    "- Fur: there is none. The whole surface is smooth and plain, with no hair, tufts, fluff or fur-like edges; a fluffy pet just gets a rounder, fuller shape, and long hairy ears or a bushy tail become plain smooth shapes without grooves.",
    "- Light: a smooth plastic finish with a little gloss (one soft highlight on the head) and a little soft shadow, neither of them strong.",
    "- Color: do not copy the photo's exact shades. Name the pet's two or three characteristic colors, then repaint each with the plain basic color of its family, as if you only had a small box of crayons: white, black, gray, brown, orange, yellow, red, pink, blue, purple, green. Examples: light lavender becomes purple, dusty blue becomes blue, pale tan, beige or sandy becomes a rich brown or orange, pale yellow or cream becomes yellow, grayish black becomes black, brownish gray becomes a clean solid gray. White stays pure white. Each area is one flat, fully saturated basic color with strong contrast between areas; nothing pale, pastel, dusty, muted or beige.",
    "- Proportions: adjusted to be cute, with a bigger head than the real animal and short legs.",
    "- Face: large, simple, glossy eyes that follow the pet's own eye shape (round, almond or slanted) rather than always being perfect circles. Dark eyes become glossy black beads, like polished black glass. If the pet's eyes have a distinct color, such as a cat's green, yellow or blue eyes, keep that color as a solid, vivid iris with a black pupil. No painted white dot: the only white on the eyes is the natural reflection of the light on the shiny surface. A small simple nose and mouth; no whiskers.",
    "- Pose: keep the pose from the photo as closely as possible: a sitting pet stays sitting, a lying pet stays lying, facing the same way. If the photo does not show the whole body, complete it so the whole body is shown.",
    "- Markings: simplify patches and stripes into a few large clean shapes; many thin stripes become three or four wide ones.",
    "Fully transparent background. No text, no border, no ground shadow, no props.",
  ].join("\n"),
  // 2D: lineless, like three or four sheets of pastel colored paper cut out and glued down.
  "2d": [
    "Redraw this pet as an extremely simple, cute, flat 2D picture, as if a child cut it out of three or four sheets of colored paper and glued the pieces down.",
    "- No outlines: there are no drawn lines or strokes anywhere. Every part is a flat shape of solid color, and shapes are told apart only by their color.",
    "- Paper cut-out: use only three or four sheets of colored paper, so three or four colors in total, each one a soft pastel version of the pet's own color. The pet is only a few big plain pieces: a head, a body with its legs, ears, a tail, and one or two patches of the second color. Do not go into detail: no small pieces, no layered pieces, no pieces inside pieces, no toes, no folds. No gradients, no shading, no highlights, no texture, no 3D look.",
    "- Fur: smooth by default. Every edge is a plain smooth curve, also for an ordinary fluffy pet. Only when the coat is truly distinctive, such as tight poodle curls, may the edge of the head have a few large round scallops. Never hairs, tufts, fringes or spikes.",
    "- Proportions: head and body are the same size, 1:1, so the pet is two heads tall, with very short stubby limbs.",
    "- Face: keep the character of the pet's eyes. A cat gets cat eyes: almond-shaped, in its own eye color (green, yellow or blue) with a dark pupil. A dog or other dark-eyed pet gets two small solid dark ovals. No highlights. A small dark nose, a tiny simple mouth, and a soft pink round blush on each cheek. No whiskers, no eyelashes, no eyebrows.",
    "- Pose: keep the pose from the photo as closely as possible: a sitting pet stays sitting, a lying pet stays lying, facing the same way. If the photo does not show the whole body, complete it so the whole body is shown.",
    "- Markings: at most two or three large plain patches; a striped coat gets only three or four wide stripes.",
    "Fully transparent background. No text, no border, no white sticker edge, no ground shadow, no props.",
  ].join("\n"),
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
