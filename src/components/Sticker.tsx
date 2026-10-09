import { flagUrl, formatSerial, STICKER_BGS, type Sticker } from "@/lib/types";

type Props = {
  sticker: Pick<Sticker, "name" | "imageUrl" | "country"> & {
    bg?: Sticker["bg"];
    serialNo: number | null;
    thumbUrl?: string;
  };
};

// Sizes are in cqw so the card scales with whatever box it is placed in.
// Layout numbers mirror drawSticker() in lib/render.ts.
export function StickerCard({ sticker }: Props) {
  const length = [...sticker.name].length;
  const flag = flagUrl(sticker.country);
  const nameSize = length <= 7 ? 7 : length <= 12 ? 5.4 : 4;
  return (
    <div className="sticker">
      <div className="sticker-body">
        {/* Colored panel behind the pet; the name row above it stays white. */}
        {sticker.bg && sticker.bg !== "white" && (
          <span className="sticker-bg" style={{ background: STICKER_BGS[sticker.bg] }} />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="sticker-pet"
          src={sticker.thumbUrl || sticker.imageUrl}
          alt=""
          draggable={false}
          // An older sticker may have no small version: show the full image instead.
          onError={(e) => {
            if (e.currentTarget.src !== sticker.imageUrl) e.currentTarget.src = sticker.imageUrl;
          }}
        />
        <div className="sticker-head">
          <span className="sticker-no">
            {sticker.serialNo === null ? "????" : formatSerial(sticker.serialNo)}
          </span>
          <span className="sticker-name" style={{ fontSize: `${nameSize}cqw` }}>
            {sticker.name}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {flag && <img className="sticker-flag" src={flag} alt="" draggable={false} />}
        </div>
      </div>
    </div>
  );
}

// Sits outside the sticker: the pet on the sticker is the one talking.
export function SpeechBubble({ text }: { text: string }) {
  return <p className="bubble">{text}</p>;
}
