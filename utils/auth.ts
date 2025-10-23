export function logoutAndRedirect() {
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
  } catch {}
  if (typeof window !== "undefined") window.location.href = "/login";
}
