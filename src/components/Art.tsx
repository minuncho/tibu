// Illustrations are 3D-look images in public/art, generated with the same image model
// that draws the stickers ("smooth glossy soft-plastic toy, pastel sky blue and white").

function Art({ name }: { name: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="art" src={`/art/${name}.png`} alt="" draggable={false} />;
}

export const GachaArt = () => <Art name="gacha" />;
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
