"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Hash, Lock, ArrowRight, Eye, EyeOff, Info } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Papel } from "../../../utils/types";

type Mode = "email" | "ra";

type Usuario = {
  id: string;
  nome?: string | null;
  ra?: string | null;
  papel?: Papel;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function getRedirectPath(user?: Usuario | null): string {
  switch (user?.papel) {
    case "ADMINISTRADOR":
    case "BACKOFFICE":
      return "/admin/home";
    case "TECNICO":
      return "/admin";
    case "USUARIO":
    default:
      return "/aluno/home";
  }
}

function safeRedirect(redirect: string | null, fallback: string): string {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//"))
    return redirect;
  return fallback;
}

export default function LoginContent() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [mode, setMode] = useState<Mode>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const raRegex = /^[A-Za-z0-9._-]{3,32}$/;

  const isValid = useMemo(() => {
    const id = identifier.trim();
    return (
      password.trim().length >= 8 &&
      (mode === "email"
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)
        : raRegex.test(id))
    );
  }, [identifier, password, mode]);

  function handleIdentifierChange(v: string) {
    setIdentifier(v);
    const t = v.trim();
    if (!t.includes("@") && /^[A-Za-z0-9._/-]+$/.test(t)) setMode("ra");
  }

  function storeAuthTokens(data: any) {
    if (!data?.accessToken) return;
    const isProd = process.env.NODE_ENV === "production";
    const secure = isProd ? "; Secure" : "";
    document.cookie = `accessToken=${data.accessToken}; Path=/; Max-Age=${15 * 60}; SameSite=Lax${secure}`;
    localStorage.setItem("accessToken", data.accessToken);
    if (data.refreshToken) {
      document.cookie = `refreshToken=${data.refreshToken}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;
      localStorage.setItem("refreshToken", data.refreshToken);
    }
  }

  function handleFirstAccess(data: any) {
    const token = data?.token;
    toast.message("Primeiro acesso", {
      description: "Você precisa criar uma nova senha antes de continuar.",
    });
    window.location.href = `/primeiro-acesso${token ? `?token=${token}` : ""}`;
  }

  function handleSuccessfulLogin(data: any) {
    toast.success("Login realizado com sucesso!", {
      description: `Bem-vindo(a), ${data?.user?.nome ?? "usuário"} 👋`,
    });
    storeAuthTokens(data);
    window.location.href = safeRedirect(redirectParam, getRedirectPath(data?.user));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const id = identifier.trim();
      const body = mode === "email" ? { email: id, password } : { ra: id, password };

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.status === 428) {
        handleFirstAccess(await res.json().catch(() => ({})));
        return;
      }
      if (res.status === 401) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Credenciais inválidas");
      }
      if (res.status === 423) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Conta temporariamente bloqueada");
      }
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || "Erro no servidor");

      handleSuccessfulLogin(await res.json());
    } catch (e: any) {
      const msg = e?.message ?? "Erro ao autenticar";
      setErr(msg);
      toast.error("Falha no login", { description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_rgba(198,40,40,0.08),_transparent_55%)] flex flex-col items-center justify-center px-4">
      <div className="mb-6 grid place-items-center select-none">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary grid place-items-center text-primary-foreground text-xs font-bold">
            WF
          </div>
          <span className="font-grotesk text-base font-semibold tracking-tight">
            Workflow Fatec
          </span>
        </div>
        <p className="text-muted-foreground text-sm mt-1">Acessar o portal</p>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <form onSubmit={onSubmit} className="p-5 sm:p-6">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-[var(--muted)]/60 p-1">
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="identifier">
                  {mode === "email" ? "Email institucional" : "RA do Aluno"}
                </label>
                <div className="relative group inline-flex items-center">
                  <Info className="size-4 text-muted-foreground" aria-hidden />
                  <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow ring-1 ring-border opacity-0 group-hover:opacity-100 transition">
                    {mode === "email" ? "Use seu e-mail cadastrado" : "Seu RA sem espaços (3–32 caracteres)."}
                  </div>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {mode === "email" ? <Mail className="size-4" /> : <Hash className="size-4" />}
                </span>
                <input
                  id="identifier"
                  type={mode === "email" ? "email" : "text"}
                  inputMode={mode === "email" ? "email" : "text"}
                  autoComplete={mode === "email" ? "email" : "username"}
                  placeholder={mode === "email" ? "nome.sobrenome@fatec.sp.gov.br" : "Ex.: 123456"}
                  className="w-full pl-9 pr-3 h-11 rounded-lg bg-input ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring text-base"
                  value={identifier}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {mode === "email"
                    ? "Informe o e-mail institucional cadastrado."
                    : "Apenas letras, números, ponto (.), underscore (_) e hífen (-)."}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">Senha</label>
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--muted)]/60"
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</span>
                <Link href="/esqueci-senha" className="text-xs underline underline-offset-4 hover:opacity-80">
                  Esqueci a senha
                </Link>
              </div>
            </div>

            {err && (
              <div className="text-sm text-destructive-foreground bg-destructive/15 border border-destructive rounded-md px-3 py-2">
                {err}
              </div>
            )}

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
