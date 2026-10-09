"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DonutArt } from "@/components/Art";
import { api } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { AppState } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AppState["mode"] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (new URLSearchParams(location.search).has("error")) {
      setError("Sign-in failed. Please try again.");
    }
    api<AppState>("/api/state")
      .then((state) => (state.user ? router.replace("/") : setMode(state.mode)))
      .catch(() => setError("Could not reach the server."));
  }, [router]);

  async function signIn() {
    setError("");
    if (mode === "demo") {
      await api("/api/auth/demo", { method: "POST" });
      router.replace("/");
      return;
    }
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="login">
      <h1>tibu</h1>
      <DonutArt />
      <div className="stack" style={{ width: "100%" }}>
        <button className="btn btn-google" disabled={!mode} onClick={signIn}>
          {mode === "demo" ? (
            "Continue in demo mode"
          ) : (
            <>
              <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden>
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.500-4.800 7.200l7.700 6c4.500-4.200 6.900-10.300 6.900-17.700z" />
                <path fill="#FBBC05" d="M10.500 28.600c-.5-1.400-.8-3-.8-4.600s.3-3.200.8-4.600l-7.900-6.200C1 16.500 0 20.100 0 24s1 7.500 2.600 10.800l7.900-6.200z" />
                <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.700-6c-2.200 1.500-4.900 2.300-8.200 2.300-6.300 0-11.600-4.100-13.500-9.900l-7.900 6.200C6.500 42.600 14.600 48 24 48z" />
              </svg>
              Continue with Google
            </>
          )}
        </button>
        <p className="note">
          By continuing you agree to our <Link href="/terms">Terms</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        {mode === "demo" && <p className="note">No Supabase keys set, so data stays on this computer.</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </main>
  );
}
