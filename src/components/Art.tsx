"use client";

import { useEffect, useState } from "react";

// Illustrations are 3D-look images in public/art, generated with the same image model
// that draws the stickers ("smooth glossy soft-plastic toy, pastel sky blue and white").

function Art({ name }: { name: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="art" src={`/art/${name}.png`} alt="" draggable={false} />;
}

const BREADS = 12;
const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

// Stickers come out of a bagged snack bread (donuts, waffles, melon bread...), the way real
// ones come in a pack of bread. A different one each time; picked after mount so server and
// browser agree.
export function BreadArt() {
  const [n, setN] = useState(0);
  useEffect(() => setN(1 + Math.floor(Math.random() * BREADS)), []);
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="art" src={n ? `/art/bread-${n}.png` : BLANK} alt="" draggable={false} />;
}
export const CameraArt = () => <Art name="camera" />;
export const AlbumArt = () => <Art name="album" />;
// Empty slot shown while the album is empty.
export const EmptyStickerArt = () => <Art name="empty" />;

export function Pips(props: { count: number; max: number; className?: string }) {
  const { count, max, className = "" } = props;
  const total = Math.max(count, max);
  return (
    <span className={`pips ${className}`} aria-label={`${count} left`}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} data-on={i < count} />
      ))}
    </span>
  );
}
