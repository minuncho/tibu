// Home-screen button illustrations, no text.
// Lineless flat style: no outlines, only pastel faces, upright and symmetric.

const SKY = "#bfe3ff";
const SKY_DEEP = "#9fd2f7";
const SKY_DARK = "#7fb6e0";
const SKY_PALE = "#e3f3ff";
const YELLOW = "#ffe9a8";
const PINK = "#ffc9d6";

export function GachaArt() {
  // [x, y, top color]: two-tone capsules, white lower half
  const capsules: [number, number, string][] = [
    [100, 50, PINK],
    [80, 72, SKY_DEEP],
    [120, 72, YELLOW],
    [60, 94, YELLOW],
    [100, 94, PINK],
    [140, 94, SKY_DEEP],
  ];
  return (
    <svg viewBox="0 0 200 200" className="art" aria-hidden>
      <defs>
        <clipPath id="gacha-globe">
          <circle cx="100" cy="76" r="62" />
        </clipPath>
      </defs>
      <circle cx="100" cy="76" r="62" fill={SKY_PALE} />
      <g clipPath="url(#gacha-globe)">
        {capsules.map(([x, y, color], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="16" fill="#fff" />
            <path d={`M${x - 16} ${y} a16 16 0 0 1 32 0 z`} fill={color} />
          </g>
        ))}
      </g>
      <rect x="34" y="118" width="132" height="70" rx="26" fill={SKY} />
      <rect x="34" y="166" width="132" height="22" rx="11" fill={SKY_DEEP} />
      <circle cx="74" cy="146" r="16" fill="#fff" />
      <rect x="60" y="141" width="28" height="10" rx="5" fill={YELLOW} />
      <rect x="106" y="132" width="40" height="28" rx="14" fill={SKY_DARK} />
      <circle cx="126" cy="146" r="9" fill="#fff" />
      <path d="M117 146 a9 9 0 0 1 18 0 z" fill={PINK} />
    </svg>
  );
}

export function CameraArt() {
  return (
    <svg viewBox="0 0 200 200" className="art" aria-hidden>
      <rect x="72" y="42" width="56" height="34" rx="14" fill={SKY_DEEP} />
      <rect x="36" y="50" width="26" height="20" rx="8" fill={YELLOW} />
      <rect x="20" y="60" width="160" height="112" rx="30" fill={SKY} />
      <path d="M20 132 h160 v10 a30 30 0 0 1 -30 30 h-100 a30 30 0 0 1 -30 -30 z" fill={SKY_DEEP} />
      <circle cx="100" cy="116" r="40" fill="#fff" />
      <circle cx="100" cy="116" r="29" fill={SKY_DARK} />
      <circle cx="100" cy="116" r="14" fill="#5f93bd" />
      <circle cx="90" cy="105" r="7" fill="#fff" />
      <circle cx="156" cy="82" r="7" fill={PINK} />
    </svg>
  );
}

export function AlbumArt() {
  return (
    <svg viewBox="0 0 200 200" className="art" aria-hidden>
      <rect x="44" y="32" width="124" height="148" rx="20" fill={SKY_PALE} />
      <rect x="32" y="22" width="128" height="150" rx="20" fill={SKY} />
      <path d="M52 22 h8 v150 h-8 a20 20 0 0 1 -20 -20 v-110 a20 20 0 0 1 20 -20 z" fill={SKY_DEEP} />
      {/* round label with a puppy */}
      <circle cx="110" cy="86" r="36" fill="#fff" />
      <path d="M92 68 C74 68 70 92 76 104 C82 112 94 104 96 88 C98 78 98 70 92 68 Z" fill="#d6a47c" />
      <path d="M128 68 C146 68 150 92 144 104 C138 112 126 104 124 88 C122 78 122 70 128 68 Z" fill="#d6a47c" />
      <path d="M110 62 C126 62 132 76 132 88 C132 102 124 108 110 108 C96 108 88 102 88 88 C88 76 94 62 110 62 Z" fill="#fff0d9" />
      <ellipse cx="101" cy="84" rx="2.8" ry="3.2" fill="#6b5348" />
      <ellipse cx="119" cy="84" rx="2.8" ry="3.2" fill="#6b5348" />
      <ellipse cx="110" cy="92" rx="3.6" ry="2.6" fill="#6b5348" />
      <ellipse cx="95" cy="93" rx="4.5" ry="2.8" fill="#ffb3c0" opacity="0.7" />
      <ellipse cx="125" cy="93" rx="4.5" ry="2.8" fill="#ffb3c0" opacity="0.7" />
      <rect x="80" y="136" width="60" height="8" rx="4" fill="#fff" />
      <rect x="92" y="152" width="36" height="8" rx="4" fill="#fff" />
    </svg>
  );
}

// Empty slot shown while the album is empty.
export function EmptyStickerArt() {
  return (
    <svg viewBox="0 0 200 200" className="art" aria-hidden>
      <rect x="38" y="26" width="124" height="148" rx="22" fill={SKY_PALE} />
      <path d="M84 84 a18 18 0 1 1 26 16 q-9 5 -9 16" fill="none" stroke={SKY} strokeWidth="9" strokeLinecap="round" />
      <circle cx="101" cy="136" r="6" fill={SKY} />
    </svg>
  );
}

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
