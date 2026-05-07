import { logoutAndRedirect } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// Garante que múltiplos requests 401 simultâneos compartilhem o mesmo refresh
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("refreshToken")
          : null;
      if (!refreshToken) return null;

      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        credentials: "include",
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (!data?.accessToken) return null;

      const isProd = process.env.NODE_ENV === "production";
      const secure = isProd ? "; Secure" : "";

      document.cookie = `accessToken=${data.accessToken}; Path=/; Max-Age=${15 * 60}; SameSite=Lax${secure}`;
      localStorage.setItem("accessToken", data.accessToken);

      if (data.refreshToken) {
        document.cookie = `refreshToken=${data.refreshToken}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function buildHeaders(init: RequestInit, token: string): Headers {
  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  // Não sobrescreve Content-Type para FormData (uploads)
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const token =
    typeof window !== "undefined"
      ? (localStorage.getItem("accessToken") ?? "")
      : "";

  const res = await fetch(input, {
    ...init,
    headers: buildHeaders(init, token),
    credentials: "include",
  });

  if (res.status === 401) {
    const newToken = await tryRefreshToken();
    if (!newToken) {
      logoutAndRedirect();
      throw new Error("Sessão expirada");
    }

    const retry = await fetch(input, {
      ...init,
      headers: buildHeaders(init, newToken),
      credentials: "include",
    });

    if (retry.status === 401 || retry.status === 403) {
      logoutAndRedirect();
      throw new Error("Não autorizado");
    }

    return retry;
  }

  if (res.status === 403) {
    logoutAndRedirect();
    throw new Error("Acesso negado");
  }

  return res;
}
