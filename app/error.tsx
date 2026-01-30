"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aqui pode integrar com serviço de monitoramento (Sentry, etc.)
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-bold font-grotesk text-destructive">
        Erro
      </h1>
      <p className="mt-2 text-muted-foreground">
        Algo deu errado. Tente novamente.
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
      >
        Tentar novamente
      </button>
    </div>
  );
}
