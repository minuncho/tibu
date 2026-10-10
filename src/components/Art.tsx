// Illustrations are 3D-look images in public/art, generated with the same image model
// that draws the stickers ("smooth glossy soft-plastic toy, pastel sky blue and white").

function Art({ name }: { name: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="art" src={`/art/${name}.png`} alt="" draggable={false} />;
}

// The bread that stands for the app wherever a single one is shown (login, link preview):
// the melon bread. The home row shows all twelve kinds at random.
const DEFAULT_BREAD = 10;

export function BreadArt() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="art" src={`/art/bread-${DEFAULT_BREAD}.webp`} alt="" draggable={false} />;
}
// The breads and the camera are WebP (about 50 KB instead of 350 KB as PNG).
// eslint-disable-next-line @next/next/no-img-element
export const CameraArt = () => <img className="art" src="/art/camera.webp" alt="" draggable={false} />;
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
