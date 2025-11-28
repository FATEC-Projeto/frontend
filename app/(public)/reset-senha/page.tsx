import { Suspense } from "react";
import ResetPasswordContent from "./ResetPasswordContent";

export const dynamic = "force-dynamic";

export default function ResetSenhaPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center">Carregando…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
