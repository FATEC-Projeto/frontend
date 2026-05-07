import { Suspense } from "react";
import LoginContent from "./LoginContent";

/** Aceita apenas caminhos internos para evitar open redirect */
function safeRedirect(redirect: string | null, fallback: string): string {
  if (!redirect) return fallback;
  // Deve começar com '/' mas não com '//' (URL relativa a protocolo)
  if (redirect.startsWith("/") && !redirect.startsWith("//")) return redirect;
  return fallback;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
