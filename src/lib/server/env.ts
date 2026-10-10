// Keys pasted into a dashboard often pick up a line break, a space or quotes.
// None of these values may contain whitespace, and a stray one makes every request fail
// with an "invalid header value" error, so strip them here.
function clean(value: string | undefined) {
  return (value || "").replace(/\s+/g, "").replace(/^["']|["']$/g, "");
}

export const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "");
export const SUPABASE_ANON_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const SUPABASE_SERVICE_ROLE_KEY = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
export const OPENAI_API_KEY = clean(process.env.OPENAI_API_KEY);
// Google accounts allowed into /staff: the owner, plus any comma-separated
// emails in the STAFF_EMAILS environment variable.
export const STAFF_EMAILS = ["minunsyc@gmail.com"].concat(
  (process.env.STAFF_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);
// Most that image conversion may cost in a calendar month, and what one conversion (three
// pictures) is assumed to cost. Together they decide how many stickers can be made each day;
// see budget.ts. Change them in the hosting dashboard, no code change needed.
export const MONTHLY_BUDGET_USD = Number(process.env.MONTHLY_BUDGET_USD) || 50;
export const CONVERSION_COST_USD = Number(process.env.CONVERSION_COST_USD) || 0.08;
export const OPENAI_IMAGE_MODEL = clean(process.env.OPENAI_IMAGE_MODEL) || "gpt-image-2.5-sunburst";

// Toss in-app version (tibu-toss). The certificate and key are PEM text from the Apps in Toss
// console; hosting dashboards often store line breaks as a literal "\n", so both forms work.
const pem = (value: string | undefined) => (value || "").replace(/\\n/g, "\n").trim();
export const TOSS_MTLS_CERT = pem(process.env.TOSS_MTLS_CERT);
export const TOSS_MTLS_KEY = pem(process.env.TOSS_MTLS_KEY);
// Any long random string; signs the session tokens handed to the mini app.
export const TOSS_SESSION_SECRET = clean(process.env.TOSS_SESSION_SECRET);
// Local development only: accept the mock SDK's code without calling Toss.
export const TOSS_DEV_ANON =
  process.env.NODE_ENV !== "production" && process.env.TOSS_DEV_ANON === "1";

// Without Supabase keys the app runs against a local JSON store with a fake user.
export const isLive = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);
export const aiEnabled = Boolean(OPENAI_API_KEY);
