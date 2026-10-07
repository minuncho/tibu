export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
// Comma-separated Google account emails allowed to review reports at /staff.
export const STAFF_EMAILS = (process.env.STAFF_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
export const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

// Without Supabase keys the app runs against a local JSON store with a fake user.
export const isLive = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);
export const aiEnabled = Boolean(OPENAI_API_KEY);
