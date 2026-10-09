"use client";

import { flagUrl, formatSerial, STICKER_BGS, type Sticker } from "./types";

const INK = "#3f729b";
const STICKER_RATIO = 1.18;

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = url;
  });
}

function fontFamily() {
  return getComputedStyle(document.body).fontFamily;
}

// Mirrors the CSS layout of <StickerCard>; u is 1% of the sticker width.
function drawSticker(
  ctx: CanvasRenderingContext2D,
  sticker: Sticker,
  pet: HTMLImageElement,
  flag: HTMLImageElement | null,
  x: number,
  y: number,
  width: number,
) {
  const u = width / 100;
  const height = width * STICKER_RATIO;
  const family = fontFamily();

  ctx.save();
  ctx.translate(x, y);

  // The border is inset by half its width so it is not clipped at the canvas edge.
  const border = 0.4 * u;
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#dbe9f4";
  ctx.lineWidth = border;
  ctx.beginPath();
  ctx.roundRect(border / 2, border / 2, width - border, height - border, 6 * u);
  ctx.fill();
  ctx.stroke();

  // Colored panel behind the pet (.sticker-bg).
  if (sticker.bg && sticker.bg !== "white") {
    ctx.fillStyle = STICKER_BGS[sticker.bg];
    ctx.beginPath();
    ctx.roundRect(4 * u, 19 * u, 92 * u, 95 * u, 4 * u);
    ctx.fill();
  }

  const box = { x: 8 * u, y: 21 * u, w: 84 * u, h: 90 * u };
  const scale = Math.min(box.w / pet.naturalWidth, box.h / pet.naturalHeight);
  const pw = pet.naturalWidth * scale;
  const ph = pet.naturalHeight * scale;
  ctx.drawImage(pet, box.x + (box.w - pw) / 2, box.y + (box.h - ph) / 2, pw, ph);

  // Header row: number pill, name, flag at the right edge.
  const midY = 10.7 * u;
  ctx.textBaseline = "middle";

  const serial = formatSerial(sticker.serialNo);
  ctx.font = `800 ${5.2 * u}px ${family}`;
  const pillWidth = ctx.measureText(serial).width + 6 * u;
  ctx.fillStyle = "#bfe3ff";
  ctx.beginPath();
  ctx.roundRect(6 * u, 6 * u, pillWidth, 9 * u, 4.5 * u);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.fillText(serial, 9 * u, midY);

  // The flag is drawn as artwork in a fixed box, so it lands in the same place on every device.
  const flagBox = { x: 84 * u, y: 6.75 * u, w: 10 * u, h: 7.5 * u };
  if (flag) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(flagBox.x, flagBox.y, flagBox.w, flagBox.h, u);
    ctx.clip();
    ctx.drawImage(flag, flagBox.x, flagBox.y, flagBox.w, flagBox.h);
    ctx.restore();
    ctx.strokeStyle = "#dbe9f4";
    ctx.lineWidth = 0.3 * u;
    ctx.beginPath();
    ctx.roundRect(flagBox.x, flagBox.y, flagBox.w, flagBox.h, u);
    ctx.stroke();
  }

  const nameX = 6 * u + pillWidth + 2.5 * u;
  const nameMax = flagBox.x - 2.5 * u - nameX;
  let size = 7 * u;
  ctx.font = `800 ${size}px ${family}`;
  while (size > 3.4 * u && ctx.measureText(sticker.name).width > nameMax) {
    size -= 0.4 * u;
    ctx.font = `800 ${size}px ${family}`;
  }
  ctx.fillStyle = "#24384a";
  ctx.textAlign = "left";
  ctx.fillText(sticker.name, nameX, midY, nameMax);

  ctx.restore();
}

// Just the sticker as a PNG, transparent outside its rounded corners.
// The speech bubble is not part of the sticker and is left out.
export async function renderSticker(sticker: Sticker): Promise<Blob> {
  await document.fonts.ready;
  const flagSrc = flagUrl(sticker.country);
  const [pet, flag] = await Promise.all([
    loadImage(sticker.imageUrl),
    flagSrc ? loadImage(flagSrc).catch(() => null) : null,
  ]);

  const width = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round(width * STICKER_RATIO);
  drawSticker(canvas.getContext("2d")!, sticker, pet, flag, 0, 0, width);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Render failed"))), "image/png");
  });
}

export async function downloadSticker(sticker: Sticker) {
  const blob = await renderSticker(sticker);
  const name = `sticker-${formatSerial(sticker.serialNo)}.png`;

  // On phones the share sheet is the way into the photo library ("Save Image");
  // a plain download lands in the Files app, or does nothing in some browsers.
  const file = new File([blob], name, { type: "image/png" });
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      // Closing the sheet is not a failure; anything else falls through to a download.
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
