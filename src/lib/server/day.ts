// Best guess at the user's country, used to preselect the flag picker:
// Vercel's IP lookup when deployed, otherwise the region of the device language.
export function requestCountry(req: Request): string | null {
  const code = (
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-region") ||
    ""
  ).toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

// "Today" is the user's local calendar day, taken from the x-timezone header.
export function localDate(req: Request): string {
  const tz = req.headers.get("x-timezone") || "UTC";
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(new Date());
  }
}
