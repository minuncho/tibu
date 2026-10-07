import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isLive, STAFF_EMAILS, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

export type User = { id: string; name: string; email: string; avatarUrl: string | null };

export const DEMO_COOKIE = "demo_user";
export const DEMO_USER: User = { id: "demo-user", name: "Demo", email: "", avatarUrl: null };

// In demo mode the single fake user is also staff, so the review screen can be tried.
export function isStaff(user: User) {
  return isLive ? STAFF_EMAILS.includes(user.email.toLowerCase()) : true;
}

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) cookieStore.set(name, value, options);
      },
    },
  });
}

export async function getUser(): Promise<User | null> {
  if (!isLive) {
    const cookieStore = await cookies();
    return cookieStore.get(DEMO_COOKIE) ? DEMO_USER : null;
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const meta = data.user.user_metadata || {};
  return {
    id: data.user.id,
    name: meta.full_name || meta.name || data.user.email || "",
    email: data.user.email || "",
    avatarUrl: meta.avatar_url || meta.picture || null,
  };
}
