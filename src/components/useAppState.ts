"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AppState } from "@/lib/types";

// Last known state, shared across pages so a screen can render at once
// while the fresh copy loads in the background.
let cached: AppState | null = null;

// Call when the account changes (sign out, delete) so the next user never sees old data.
export function clearAppState() {
  cached = null;
}

// Loads quotas and the signed-in user; sends signed-out visitors to /login.
export function useAppState() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(cached);

  const refresh = useCallback(async () => {
    const next = await api<AppState>("/api/state");
    if (!next.user) {
      cached = null;
      router.replace("/login");
      return null;
    }
    cached = next;
    setState(next);
    return next;
  }, [router]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return { state, refresh };
}
