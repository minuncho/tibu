import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { AlbumArt, CameraArt, GachaArt } from "@/components/Art";

export const alt = "Tibu: turn your pet into a sticker and collect pets from around the world";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ITEM = 230;

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

// Picture shown when the link is shared: the name on the left, the four home items on the right.
export default async function OpenGraphImage() {
  const [sticker, font] = await Promise.all([
    readFile(path.join(process.cwd(), "src/assets/og-sticker.png")),
    loadFont(),
  ]);
  const stickerSrc = `data:image/png;base64,${sticker.toString("base64")}`;
  const cell = {
    width: ITEM,
    height: ITEM,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as const;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 90px",
          background: "#ffffff",
          fontFamily: "Rounded",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 190, color: "#24384a", lineHeight: 1 }}>Tibu</div>
          <div style={{ marginTop: 28, fontSize: 34, color: "#7ea6c6", lineHeight: 1.35 }}>
            Turn your pet into a sticker.
          </div>
          <div style={{ fontSize: 34, color: "#7ea6c6", lineHeight: 1.35 }}>
            Collect pets from around the world.
          </div>
        </div>

        <div style={{ width: ITEM * 2 + 20, display: "flex", flexWrap: "wrap", gap: 20 }}>
          <div style={cell}>
            <GachaArt size={200} />
          </div>
          <div style={cell}>
            <CameraArt size={200} />
          </div>
          <div style={cell}>
            <AlbumArt size={200} />
          </div>
          <div style={cell}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stickerSrc} width={178} height={210} alt="" />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "Rounded", data: font, weight: 800, style: "normal" }] : undefined,
    },
  );
}
