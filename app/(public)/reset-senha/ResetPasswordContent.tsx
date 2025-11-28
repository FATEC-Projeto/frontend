"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Info, LockKeyhole, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Cookies from "js-cookie";

type Usuario = {
  id: string;
  nome?: string | null;
  ra?: string | null;
  papel?: "USUARIO" | "BACKOFFICE" | "TECNICO" | "ADMINISTRADOR";
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3333";

/** rota pós-login baseada no papel */
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

/** força simples de senha (0-4) com dicas */
function passwordScore(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export default function ResetPasswordContent() {
  const q = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromQuery = q.get("token");
    setToken(fromQuery || null);
  }, [q]);

  const score = useMemo(() => passwordScore(newPassword), [newPassword]);

  const meetsPolicy =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /\d/.test(newPassword) &&
    /[^A-Za-z0-9]/.test(newPassword);

  const canSubmit =
    !!token &&
    meetsPolicy &&
    newPassword === confirm &&
    !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Token de redefinição não encontrado.");
      return;
    }
    if (!meetsPolicy) {
      toast.error("A senha não atende aos critérios.");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Falha ao redefinir senha (${res.status})`);
      }

      const data = await res.json();
      const user: Usuario | undefined = data?.user;

      if (data?.accessToken) {
        Cookies.set("accessToken", data.accessToken, {
          expires: 7,
          secure: process.env.NODE_ENV === "production",
          path: "/",
        });
        localStorage.setItem("accessToken", data.accessToken);
      }
      if (data?.refreshToken) {
        Cookies.set("refreshToken", data.refreshToken, {
          expires: 30,
          secure: process.env.NODE_ENV === "production",
          path: "/",
        });
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      toast.success("Senha redefinida com sucesso!", {
        description: "Você já pode acessar normalmente com a nova senha.",
      });

      window.location.href = getRedirectPath(user);
    } catch (err: any) {
      toast.error("Não foi possível redefinir a senha.", {
        description: err?.message ?? "Tente novamente em instantes.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_rgba(198,40,40,0.06),_transparent_55%)] flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="mb-6 grid place-items-center select-none">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary grid place-items-center text-primary-foreground text-xs font-bold">
            WF
          </div>
          <span className="font-grotesk text-base font-semibold tracking-tight">
            Workflow Fatec
          </span>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Redefinir senha
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Nota */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4" />
            <p>
              Você solicitou a redefinição da sua senha. Crie uma nova senha forte para proteger sua conta.
            </p>
          </div>

          {/* Nova senha */}
          <div>
            <label className="text-sm font-medium" htmlFor="newPassword">
              Nova senha
            </label>
            <div className="relative mt-1">
              <input
                id="newPassword"
                type={show ? "text" : "password"}
                placeholder="Crie uma senha forte"
                className="w-full h-11 rounded-lg bg-input ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring px-3 pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--muted)]/60"
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Regras */}
            <ul className="mt-2 text-xs space-y-1 text-muted-foreground">
              <li className={newPassword.length >= 8 ? "text-foreground" : ""}>• Mínimo de 8 caracteres</li>
              <li className={/[A-Z]/.test(newPassword) ? "text-foreground" : ""}>• Uma letra maiúscula</li>
              <li className={/[a-z]/.test(newPassword) ? "text-foreground" : ""}>• Uma letra minúscula</li>
              <li className={/\d/.test(newPassword) ? "text-foreground" : ""}>• Um número</li>
              <li className={/[^A-Za-z0-9]/.test(newPassword) ? "text-foreground" : ""}>• Um símbolo</li>
            </ul>

            {/* Barra de força */}
            <div className="mt-2 h-2 w-full rounded-full bg-[var(--muted)] overflow-hidden">
              <div
                className="h-full bg-primary transition-[width]"
                style={{ width: `${(score / 4) * 100}%` }}
                aria-hidden
              />
            </div>
          </div>

          {/* Confirmação */}
          <div>
            <label className="text-sm font-medium" htmlFor="confirm">
              Confirmar nova senha
            </label>
            <div className="relative mt-1">
              <input
                id="confirm"
                type={show ? "text" : "password"}
                placeholder="Repita a nova senha"
                className="w-full h-11 rounded-lg bg-input ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring px-3"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <ShieldCheck className="size-4" />
              </span>
            </div>
            {confirm && confirm !== newPassword && (
              <p className="mt-1 text-xs text-destructive">As senhas não conferem.</p>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <Link
              href="/login"
              className="h-11 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
            >
              Voltar ao login
            </Link>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-lg bg-primary text-primary-foreground text-sm hover:brightness-95 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Redefinindo…
                </>
              ) : (
                <>
                  <LockKeyhole className="size-4" /> Redefinir senha
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Não foi você que pediu isso? Ignore o e-mail ou entre em contato com o suporte.
      </p>
    </div>
  );
}
