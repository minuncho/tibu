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
export const OPENAI_IMAGE_MODEL = clean(process.env.OPENAI_IMAGE_MODEL) || "gpt-image-1";

// Without Supabase keys the app runs against a local JSON store with a fake user.
export const isLive = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);
export const aiEnabled = Boolean(OPENAI_API_KEY);
