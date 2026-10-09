"use client";

import { useEffect, useState } from "react";

const SIZE = 60;
const VISIBLE_MS = 7000;

const random = (min: number, max: number) => min + Math.random() * (max - min);

// A free spot on the home screen: anywhere in the empty bands above and below the four items.
function pickSpot() {
  const app = document.querySelector(".app")?.getBoundingClientRect();
  const head = document.querySelector(".home-head")?.getBoundingClientRect();
  const tiles = [...document.querySelectorAll(".tile")].map((t) => t.getBoundingClientRect());
  if (!app || !head || tiles.length === 0) return null;

  const tilesTop = Math.min(...tiles.map((t) => t.top));
  const tilesBottom = Math.max(...tiles.map((t) => t.bottom));
  const bands = [
    { from: head.bottom + 8, to: tilesTop - SIZE - 8 },
    { from: tilesBottom + 8, to: window.innerHeight - SIZE - 24 },
  ].filter((band) => band.to > band.from);
  if (bands.length === 0) return null;

  // Taller bands are picked more often, so the cup is spread evenly over the free area.
  const total = bands.reduce((sum, band) => sum + (band.to - band.from), 0);
  let at = Math.random() * total;
  const band = bands.find((b) => (at -= b.to - b.from) <= 0) ?? bands[0];
  return {
    left: random(app.left + 16, app.right - 16 - SIZE),
    top: random(band.from, band.to),
  };
}

// A little coffee cup that turns up now and then, somewhere clear of the four home items.
// Tapping it opens the support page.
export function Coffee({ url }: { url: string }) {
  const [spot, setSpot] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      setSpot(pickSpot());
      timer = setTimeout(hide, VISIBLE_MS);
    };
    const hide = () => {
      setSpot(null);
      timer = setTimeout(show, random(20_000, 45_000));
    };
    timer = setTimeout(show, random(3_000, 12_000));
    return () => clearTimeout(timer);
  }, []);

  if (!spot) return null;
  return (
    <a
      className="coffee"
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label="Buy me a coffee"
      style={{ left: spot.left, top: spot.top, width: SIZE, height: SIZE }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/art/coffee.png" alt="" draggable={false} />
    </a>
  );
}
