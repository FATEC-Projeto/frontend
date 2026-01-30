import { logoutAndRedirect } from "./auth";

export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const token =
    (typeof window !== "undefined" && localStorage.getItem("accessToken")) ||
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
