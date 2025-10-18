"use client";

import { useMemo, useState } from "react";
import { Mail, Lock, ArrowRight, Shield, Eye, EyeOff, Info } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Mode = "email" | "ra";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("email"); // "email" (funcionário) | "ra" (aluno)
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isValid = useMemo(() => {
    const idOk =
      mode === "email"
        ? /@/.test(identifier)
        : /^[A-Za-z0-9._-]{3,32}$/.test(identifier);
    return idOk && password.length >= 6;
  }, [identifier, password, mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!isValid) return;

    setLoading(true);
    try {
      const body =
        mode === "email"
          ? { email: identifier.trim(), password }
          : { ra: identifier.trim(), password };

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/login`;

      // Logs de debug
      console.log("🔹 Enviando login para backend:", url);
      console.log("🔸 Body:", body);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log("🔹 Status da resposta:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Erro na resposta:", text);
        throw new Error("Credenciais inválidas ou erro no servidor");
      }

      const data = await res.json();
      console.log("✅ Resposta do backend:", data);

      toast.success("Login realizado com sucesso!", {
        description: `Bem-vindo(a), ${data?.user?.nome ?? "usuário"} 👋`,
      });

      // Exemplo de roteamento simples (ajuste conforme papel)
      // if (data.user.papel === "ALUNO") window.location.href = "/dashboard/aluno";
      // else window.location.href = "/dashboard/admin";

    } catch (e: any) {
      console.error("🔥 Erro no login:", e);
      setErr(e?.message ?? "Erro ao autenticar");
      toast.error("Falha no login", {
        description: e?.message ?? "Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_rgba(198,40,40,0.08),_transparent_55%)] flex flex-col items-center justify-center px-4">
      {/* Header compacto (título do tamanho do logo + centralizado) */}
      <div className="mb-6 grid place-items-center select-none">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary grid place-items-center text-primary-foreground text-xs font-bold">
            WF
          </div>
          <span className="font-grotesk text-base font-semibold tracking-tight">
            Workflow Fatec
          </span>
        </div>
        <p className="text-muted-foreground text-sm mt-1">Portal do Aluno</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <form onSubmit={onSubmit} className="p-5 sm:p-6">
          {/* Toggle modo de login */}
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-[hsl(var(--muted))]/60 p-1">
            <button
              type="button"
              onClick={() => setMode("email")}
              className={`h-9 rounded-md text-sm font-medium transition ${
                mode === "email" ? "bg-background ring-1 ring-border" : "opacity-70 hover:opacity-100"
              }`}
            >
              Funcionário (Email)
            </button>
            <button
              type="button"
              onClick={() => setMode("ra")}
              className={`h-9 rounded-md text-sm font-medium transition ${
                mode === "ra" ? "bg-background ring-1 ring-border" : "opacity-70 hover:opacity-100"
              }`}
            >
              Aluno (RA)
            </button>
          </div>

          <div className="space-y-4">
            {/* IDENTIFIER */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="identifier">
                  {mode === "email" ? "Email" : "RA do Aluno"}
                </label>

                {/* Tooltip simples */}
                <div className="relative group inline-flex items-center">
                  <Info className="size-4 text-muted-foreground" aria-hidden />
                  <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow ring-1 ring-border opacity-0 group-hover:opacity-100 transition">
                    {mode === "email"
                      ? "Use seu email cadastrado"
                      : "Seu RA sem espaços (3–32 caracteres)."}
                  </div>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail className={`size-4 ${mode === "ra" ? "opacity-0" : ""}`} aria-hidden />
                </span>
                <input
                  id="identifier"
                  type={mode === "email" ? "email" : "text"}
                  inputMode={mode === "email" ? "email" : "text"}
                  autoComplete={mode === "email" ? "email" : "username"}
                  placeholder={mode === "email" ? "seu@email.com" : "Ex.: 123456"}
                  className={`w-full ${mode === "email" ? "pl-9" : "pl-3"} pr-3 h-11 rounded-lg bg-input ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring text-base`}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {mode === "email"
                    ? "Informe o email cadastrado no sistema."
                    : "Somente letras, números e . _ -"}
                </p>
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="size-4" aria-hidden />
                </span>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 h-11 rounded-lg bg-input ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[hsl(var(--muted))]/60"
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  title={showPass ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</span>
                <Link href="/recuperar-senha" className="text-xs underline underline-offset-4 hover:opacity-80">
                  Esqueci a senha
                </Link>
              </div>
            </div>

            {/* ERRO (fallback visual além do toast) */}
            {err && (
              <div className="text-sm text-destructive-foreground bg-destructive/15 border border-destructive rounded-md px-3 py-2">
                {err}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={!isValid || loading}
              className="group inline-flex w-full items-center justify-center gap-2 h-11 rounded-lg bg-primary text-primary-foreground font-medium shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Entrando..." : "Entrar"}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

        </form>
      </div>

      <Link href="/" className="mt-6 text-sm text-muted-foreground hover:underline">
        Voltar para a página inicial
      </Link>
    </div>
  );
}
