"use client";

export function timeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// Region part of the device language, e.g. "ko-KR" -> "KR". Fallback for the server's IP lookup.
function region() {
  try {
    return new Intl.Locale(navigator.language).maximize().region || "";
  } catch {
    return "";
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("x-timezone", timeZone());
  headers.set("x-region", region());
  const res = await fetch(path, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || "Something went wrong");
  return data as T;
}

export function postJson<T>(path: string, body: unknown) {
  return api<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
