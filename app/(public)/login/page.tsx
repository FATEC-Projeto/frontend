// app/login/page.tsx
"use client";

import { useMemo, useState } from "react";
import { Mail, Hash, Lock, ArrowRight, Eye, EyeOff, Info } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Cookies from 'js-cookie';

type Mode = "email" | "ra";

type Usuario = {
  id: string;
  nome?: string | null;
  ra?: string | null;
  papel?: "USUARIO" | "BACKOFFICE" | "TECNICO" | "ADMINISTRADOR";
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3333";

function getRedirectPath(user?: Usuario | null) {
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

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("email"); // "email" (funcionário) | "ra" (aluno)
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Regex de RA atual (sem '/'). Se seu RA tiver '/', troque para a linha comentada abaixo.
  const raRegex = /^[A-Za-z0-9._-]{3,32}$/;
  // const raRegex = /^[A-Za-z0-9._\/-]{3,32}$/; // permite '/'

  // validação com trim (evita travar por espaço invisível)
  const isValid = useMemo(() => {
    const id = identifier.trim();
    const passOk = password.trim().length >= 8;
    const idOk = mode === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id) : raRegex.test(id);
    return idOk && passOk;
  }, [identifier, password, mode]);

  // auto-switch opcional: se não tem '@' e só contém chars válidos, muda pra RA
  function handleIdentifierChange(v: string) {
    setIdentifier(v);
    const t = v.trim();
    if (!t.includes("@") && /^[A-Za-z0-9._/-]+$/.test(t)) {
      setMode("ra");
    }
  }

  // Funções auxiliares extraídas
  const handleFirstAccess = (data: any) => {
    const uid = data?.user?.id;
    if (uid) localStorage.setItem("firstAccessUserId", uid);
    toast.message("Primeiro acesso", {
      description: "Você precisa criar uma nova senha antes de continuar.",
    });
    window.location.href = `/primeiro-acesso${uid ? `?uid=${uid}` : ""}`;
  };

  const handleErrorResponse = async (res: Response) => {
    if (res.status === 401) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || "Credenciais inválidas");
    }
    if (res.status === 423) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || "Conta temporariamente bloqueada");
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Erro no servidor");
    }
  };

  const handleSuccessfulLogin = (data: any) => {
    toast.success("Login realizado com sucesso!", {
      description: `Bem-vindo(a), ${data?.user?.nome ?? "usuário"} 👋`,
    });

    // Extrair tratamento de tokens para função separada
    storeAuthTokens(data);

    const to = getRedirectPath(data?.user);
    window.location.href = to;
  };

  const storeAuthTokens = (data: any) => {
    if (data?.accessToken) {
      Cookies.set("accessToken", data.accessToken, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        path: '/'
      });
      localStorage.setItem("accessToken", data.accessToken);

      try {
        const payload = JSON.parse(atob(String(data.accessToken).split(".")[1] || ""));
        if (payload?.sub) localStorage.setItem("userId", payload.sub);
      } catch { }
    }

    if (data?.refreshToken) {
      Cookies.set("refreshToken", data.refreshToken, {
        expires: 30,
        secure: process.env.NODE_ENV === 'production',
        path: '/'
      });
      localStorage.setItem("refreshToken", data.refreshToken);
    }
  };

  // Função principal refatorada
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

      // 428 = precisa trocar senha (primeiro acesso)
      if (res.status === 428) {
        const data = await res.json().catch(() => ({}));
        handleFirstAccess(data);
        return;
      }

      // Tratamento de erros
      await handleErrorResponse(res);

      // Login bem-sucedido
      const data = await res.json();
      handleSuccessfulLogin(data);

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
      {/* Header compacto */}
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

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <form onSubmit={onSubmit} className="p-5 sm:p-6">
          {/* Toggle modo de login */}
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-[var(--muted)]/60 p-1">
            <button
              type="button"
              onClick={() => setMode("email")}
              className={`h-9 rounded-md text-sm font-medium transition ${mode === "email" ? "bg-background ring-1 ring-border" : "opacity-70 hover:opacity-100"
                }`}
            >
              Funcionário (Email)
            </button>
            <button
              type="button"
              onClick={() => setMode("ra")}
              className={`h-9 rounded-md text-sm font-medium transition ${mode === "ra" ? "bg-background ring-1 ring-border" : "opacity-70 hover:opacity-100"
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
                  className={`w-full pl-9 pr-3 h-11 rounded-lg bg-input ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring text-base`}
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--muted)]/60"
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  title={showPass ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</span>
                <Link href="/recuperar-senha" className="text-xs underline underline-offset-4 hover:opacity-80">
                  Esqueci a senha
                </Link>
              </div>
            </div>

            {/* ERRO */}
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
