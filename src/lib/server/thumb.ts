import sharp from "sharp";

// Converted images are 1024px PNGs of a megabyte or more, far too heavy for cards in a list.
// Every stored PNG gets a small WebP next to it, at the same path with a .webp ending.
export const THUMB_SIZE = 512;

export function thumbPath(imagePath: string) {
  return imagePath.replace(/\.png$/, ".webp");
}

export function makeThumb(png: Buffer): Promise<Buffer> {
  return sharp(png)
    .resize(THUMB_SIZE, THUMB_SIZE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}
