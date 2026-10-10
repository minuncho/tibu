import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "tibu: turn your pet into a sticker and collect pets from around the world";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Rounded display font, fetched once at build time. Falls back to the default font if unreachable.
async function loadFont() {
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/m-plus-rounded-1c@latest/latin-800-normal.ttf",
    );
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

// Picture shown when the link is shared: a bagged melon bread, the name, and sticker 0000.
export default async function OpenGraphImage() {
  // Each path is spelled out so the bundler can see exactly which files are read.
  const png = (bytes: Buffer) => `data:image/png;base64,${bytes.toString("base64")}`;
  const [petPng, breadPng, flagSvg, font] = await Promise.all([
    readFile(path.join(process.cwd(), "src/assets/og-pet.png")),
    readFile(path.join(process.cwd(), "public/art/bread-10.png")),
    readFile(path.join(process.cwd(), "public/flags/kr.svg")),
    loadFont(),
  ]);
  const flag = `data:image/svg+xml;base64,${flagSvg.toString("base64")}`;
  // The sticker card, drawn like <StickerCard>: u is 1% of its width.
  const u = 2.7;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 80px",
          background: "#ffffff",
          fontFamily: "Rounded",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={png(breadPng)} width={270} height={282} alt="" />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 180, color: "#4b2f37", lineHeight: 1 }}>tibu</div>
          <div style={{ marginTop: 24, fontSize: 26, color: "#cf9ca4" }}>Turn your pet into a sticker.</div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            width: 100 * u,
            height: 118 * u,
            borderRadius: 6 * u,
            border: "2px solid #f6dcdb",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 6 * u,
              top: 6 * u,
              height: 9 * u,
              padding: `0 ${3 * u}px`,
              borderRadius: 4.5 * u,
              background: "#f7cac9",
              color: "#4b2f37",
              fontSize: 5.2 * u,
              display: "flex",
              alignItems: "center",
            }}
          >
            0000
          </div>
          <div
            style={{
              position: "absolute",
              left: 27 * u,
              top: 6 * u,
              height: 9 * u,
              color: "#4b2f37",
              fontSize: 7 * u,
              display: "flex",
              alignItems: "center",
            }}
          >
            Pasta
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flag}
            width={10 * u}
            height={7.5 * u}
            style={{ position: "absolute", left: 84 * u, top: 6.75 * u, borderRadius: u }}
            alt=""
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={png(petPng)}
            width={84 * u}
            height={84 * u}
            style={{ position: "absolute", left: 8 * u, top: 24 * u }}
            alt=""
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "Rounded", data: font, weight: 800, style: "normal" }] : undefined,
    },
  );
}
