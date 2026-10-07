export const STYLES = ["real", "3d", "2d"] as const;
export type StickerStyle = (typeof STYLES)[number];

export const STYLE_LABEL: Record<StickerStyle, string> = {
  real: "Realistic",
  "3d": "3D",
  "2d": "2D",
};

export const NAME_MAX = 20;
export const BUBBLE_MAX = 50;
export const CREATES_PER_DAY = 3;
export const BASE_DRAWS_PER_DAY = 1;
// Upheld report: every reporter of that sticker gets this many draw credits,
// and its maker cannot make stickers for this many days.
export const REPORT_REWARD = 1;
export const PENALTY_DAYS = 7;

export const REPORT_REASONS = {
  not_pet: "Not a pet",
  image: "Inappropriate image",
  text: "Offensive name or message",
  other: "Something else",
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;

export type Sticker = {
  id: string;
  serialNo: number;
  name: string;
  bubble: string;
  style: StickerStyle;
  imageUrl: string;
  // ISO 3166-1 alpha-2 code chosen by the owner
  country: string | null;
};

export type AlbumEntry = {
  // unique per album slot: a sticker drawn twice appears twice
  entryId: string;
  kind: "made" | "drawn";
  at: string;
  sticker: Sticker;
};

export type AppState = {
  mode: "demo" | "live";
  aiEnabled: boolean;
  user: { id: string; name: string; avatarUrl: string | null; isStaff: boolean } | null;
  date: string;
  country: string | null;
  createsLeft: number;
  // daily draws plus saved credits
  drawsLeft: number;
  // set while a report penalty blocks making stickers
  bannedUntil: string | null;
  // newest sticker in the album, whether made or drawn
  latest: Sticker | null;
};

export type StaffReport = {
  id: string;
  reason: ReportReason;
  createdAt: string;
  sticker: Sticker;
};

export type Candidate = { style: StickerStyle; url: string };

// ISO 3166-1 alpha-2 codes the owner can pick for the sticker flag.
export const COUNTRY_CODES = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL " +
  "BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV " +
  "CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD " +
  "GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM " +
  "IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK " +
  "LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW " +
  "MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR " +
  "PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS " +
  "ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY " +
  "UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW"
).split(" ");

// "KR" -> the KR flag emoji (a pair of regional indicator symbols).
export function flagEmoji(country: string | null) {
  if (!country || !/^[A-Z]{2}$/.test(country)) return "";
  return String.fromCodePoint(...[...country].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

// Flag artwork (4:3 SVG) for a country code, from public/flags.
export function flagUrl(country: string | null) {
  return country && /^[A-Z]{2}$/.test(country) ? `/flags/${country.toLowerCase()}.svg` : null;
}

export function formatSerial(n: number) {
  return String(n).padStart(4, "0");
}
