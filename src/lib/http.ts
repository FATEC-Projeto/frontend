import { ENV } from "@/config/env";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { parseJson?: boolean }
): Promise<T | Response> {
  const url = `${ENV.NEXT_PUBLIC_API_BASE_URL}${path}`;
  const res = await fetch(url, {
    credentials: "include", 
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (init?.parseJson === false) return res;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}
