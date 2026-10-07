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
      <svg viewBox="0 0 100 100" aria-hidden>
        <path d="M38 12 q-8 8 0 16 q8 8 0 16" fill="none" stroke="#bfe3ff" strokeWidth="6" strokeLinecap="round" />
        <path d="M56 12 q-8 8 0 16 q8 8 0 16" fill="none" stroke="#bfe3ff" strokeWidth="6" strokeLinecap="round" />
        <path d="M70 56 h8 a12 12 0 0 1 0 24 h-10" fill="none" stroke="#86c3f2" strokeWidth="8" strokeLinecap="round" />
        <path d="M18 50 h58 v20 a22 22 0 0 1 -22 22 h-14 a22 22 0 0 1 -22 -22 z" fill="#9fd2f7" />
        <ellipse cx="47" cy="50" rx="29" ry="7" fill="#86c3f2" />
        <ellipse cx="47" cy="50" rx="23" ry="4.5" fill="#b98a64" />
        <path d="M28 64 q0 14 10 20" fill="none" stroke="#cfe9ff" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </a>
  );
}
