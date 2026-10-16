import { logoutAndRedirect } from "./auth";

export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const token =
    (typeof window !== "undefined" && localStorage.getItem("accessToken")) ||
    process.env.NEXT_PUBLIC_ACCESS_TOKEN ||
    "";

  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401 || res.status === 403) {
    logoutAndRedirect();
    throw new Error("Não autorizado");
  }

  return res;
}

export async function extractApiError(res: Response, fallback?: string): Promise<string> {
  const base = fallback ?? `Erro ${res.status}`;
  const text = await res.text().catch(() => "");
  if (!text) return base;
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json?.issues) && json.issues.length) {
      return json.issues.map((issue: { path: string; message: string }) => `${issue.path}: ${issue.message}`).join(" | ");
    }
    return json?.error || json?.message || base;
  } catch {
    return text;
  }
}
