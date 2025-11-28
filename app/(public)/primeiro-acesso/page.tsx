import { Suspense } from "react";
import PrimeiroAcessoContent from "./PrimeiroAcessoContent";

export const dynamic = "force-dynamic";

export default function FirstAccessPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center">Carregando…</div>}>
      <PrimeiroAcessoContent />
    </Suspense>
  );
}
