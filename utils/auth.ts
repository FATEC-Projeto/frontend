import Cookies from 'js-cookie';
export function logoutAndRedirect() {
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");

    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");

  } catch (e) {
    console.error("Erro ao limpar sessão:", e);
  }
  if (typeof window !== "undefined") {
    window.location.replace("/login"); 
  }
}
