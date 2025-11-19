"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MailCheck, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3333";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/esqueci-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Erro ao solicitar redefinição de senha.");
      }

      toast.success(
        "Se existir uma conta com esse e-mail, enviaremos um link de redefinição."
      );
    } catch (err: any) {
      toast.error("Não foi possível enviar o link de redefinição.", {
        description: err?.message ?? "Tente novamente em instantes.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4">
      <div className="mb-6 grid place-items-center">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary grid place-items-center text-primary-foreground text-xs font-bold">
            WF
          </div>
          <span className="font-grotesk text-base font-semibold tracking-tight">
            Workflow Fatec
          </span>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Esqueci minha senha
        </p>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-card shadow-sm ring-1 ring-border p-5 sm:p-6 space-y-4">
        <p className="text-xs text-muted-foreground">
          Informe o e-mail cadastrado. Caso exista uma conta associada, enviaremos um link
          para você criar uma nova senha.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="email">
              E-mail
            </label>
            <div className="relative mt-1">
              <input
                id="email"
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                className="w-full h-11 rounded-lg bg-input ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring px-3 pr-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <MailCheck className="size-4" />
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!email || loading}
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-primary text-primary-foreground text-sm hover:brightness-95 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Enviando…
              </>
            ) : (
              <>Enviar link de redefinição</>
            )}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
        >
          <ArrowLeft className="size-3" /> Voltar ao login
        </Link>
      </div>
    </div>
  );
}
