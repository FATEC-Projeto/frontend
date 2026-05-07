import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function clearLocalSession() {
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });
  } catch {
    // best-effort
  }
}

/**
 * Revoga a sessão no backend e limpa o estado local.
 * Não lança exceção — o logout local sempre ocorre mesmo se a API falhar.
 */
export async function logout(): Promise<void> {
  try {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

    if (refreshToken) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        credentials: "include",
      }).catch(() => {});
    }
  } finally {
    clearLocalSession();
  }
}

export function logoutAndRedirect(): void {
  logout().finally(() => {
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  });
}
