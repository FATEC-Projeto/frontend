"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  Hash,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  Loader2,
} from "lucide-react";
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

  function storeAuthTokens(data: Record<string, unknown>) {
    if (!data?.accessToken) return;
    // Usa o protocolo real da página — cookie Secure só funciona em HTTPS.
    // NODE_ENV=production não garante HTTPS (ex: IP direto na AWS).
    const isSecure = window.location.protocol === "https:";
    const secure = isSecure ? "; Secure" : "";
    document.cookie = `accessToken=${data.accessToken}; Path=/; Max-Age=${15 * 60}; SameSite=Lax${secure}`;
    localStorage.setItem("accessToken", String(data.accessToken));
    if (data.refreshToken) {
      document.cookie = `refreshToken=${data.refreshToken}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;
      localStorage.setItem("refreshToken", String(data.refreshToken));
    }
  }

  function handleFirstAccess(data: Record<string, unknown>) {
    const token = data?.token;
    toast.message("Primeiro acesso", {
      description: "Você precisa criar uma nova senha antes de continuar.",
    });
    window.location.href = `/primeiro-acesso${token ? `?token=${token}` : ""}`;
  }

  function handleSuccessfulLogin(data: Record<string, unknown>) {
    const user = data?.user as Usuario | undefined;
    toast.success("Login realizado com sucesso!", {
      description: `Bem-vindo(a), ${user?.nome ?? "usuário"} 👋`,
    });
    storeAuthTokens(data);
    window.location.href = safeRedirect(redirectParam, getRedirectPath(user));
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao autenticar";
      setErr(msg);
      toast.error("Falha no login", { description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_rgba(178,0,0,0.07),_transparent_60%)] flex flex-col items-center justify-center px-4 py-10">

      {/* Marca */}
      <div className="mb-8 flex flex-col items-center gap-2 select-none">
        <div className="size-12 rounded-2xl bg-primary grid place-items-center text-primary-foreground text-sm font-bold shadow-md ring-4 ring-primary/10">
          WF
        </div>
        <div className="text-center">
          <p className="font-grotesk text-lg font-semibold tracking-tight">Workflow Fatec</p>
          <p className="text-sm text-muted-foreground">Portal de atendimento acadêmico</p>
        </div>
      </div>

      {/* Card do formulário */}
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-lg ring-1 ring-border">
        <form onSubmit={onSubmit} className="p-6 space-y-5">

          {/* Seletor de modo */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--muted)] p-1">
            <button
              type="button"
              onClick={() => setMode("email")}
              className={[
                "flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition",
                mode === "email"
                  ? "bg-background shadow-sm ring-1 ring-border text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <Mail className="size-3.5 shrink-0" />
              Funcionário
            </button>
            <button
              type="button"
              onClick={() => setMode("ra")}
              className={[
                "flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition",
                mode === "ra"
                  ? "bg-background shadow-sm ring-1 ring-border text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <Hash className="size-3.5 shrink-0" />
              Aluno (RA)
            </button>
          </div>

          <div className="space-y-4">
            {/* Campo identificador */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium" htmlFor="identifier">
                  {mode === "email" ? "Email institucional" : "Registro de Aluno (RA)"}
                </label>
                {/* Tooltip de info */}
                <div className="relative group inline-flex">
                  <Info className="size-3.5 text-muted-foreground cursor-help" aria-hidden />
                  <div className="pointer-events-none absolute bottom-full right-0 mb-2 z-20 w-52 rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity">
                    {mode === "email"
                      ? "Use o e-mail institucional cadastrado pela Fatec."
                      : "Seu RA sem espaços — letras, números, ponto, underscore ou hífen."}
                    <span className="absolute top-full right-3 border-4 border-transparent border-t-popover" />
                  </div>
                </div>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  {mode === "email" ? <Mail className="size-4" /> : <Hash className="size-4" />}
                </span>
                <input
                  id="identifier"
                  type={mode === "email" ? "email" : "text"}
                  inputMode={mode === "email" ? "email" : "text"}
                  autoComplete={mode === "email" ? "email" : "username"}
                  placeholder={mode === "email" ? "nome.sobrenome@fatec.sp.gov.br" : "Ex.: 1234567"}
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-input ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring text-sm transition"
                  value={identifier}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {mode === "email"
                  ? "Ex.: joao.silva@fatec.sp.gov.br"
                  : "Apenas letras, números, ponto (.), underscore (_) e hífen (-)."}
              </p>
            </div>

            {/* Campo senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="password">Senha</label>
                <Link
                  href="/esqueci-senha"
                  className="text-[11px] text-muted-foreground underline-offset-4 hover:underline hover:text-foreground transition"
                >
                  Esqueci a senha
                </Link>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <Lock className="size-4" aria-hidden />
                </span>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full h-10 pl-9 pr-10 rounded-lg bg-input ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring text-sm transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition"
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">Mínimo de 8 caracteres.</p>
            </div>

            {/* Erro inline */}
            {err && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <Info className="size-4 shrink-0 mt-0.5" aria-hidden />
                {err}
              </div>
            )}

            {/* Botão de submit */}
            <button
              type="submit"
              disabled={!isValid || loading}
              className="group inline-flex w-full items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Links rodapé */}
      <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground hover:underline transition">Página inicial</Link>
        <span>·</span>
        <Link href="/termos" className="hover:text-foreground hover:underline transition">Termos de uso</Link>
        <span>·</span>
        <Link href="/privacidade" className="hover:text-foreground hover:underline transition">Privacidade</Link>
      </div>
    </div>
  );
}
