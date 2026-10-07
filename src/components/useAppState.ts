"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AppState } from "@/lib/types";

// Loads quotas and the signed-in user; sends signed-out visitors to /login.
export function useAppState() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);

  const refresh = useCallback(async () => {
    const next = await api<AppState>("/api/state");
    if (!next.user) {
      router.replace("/login");
      return null;
    }
    setState(next);
    return next;
  }, [router]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return { state, refresh };
}
