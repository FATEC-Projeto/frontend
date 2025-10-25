"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Loader2, Moon, Sun, User } from "lucide-react";
import { apiFetch } from "../../../../utils/api";

type Props = {
  notificationsHref?: string; // default: /aluno/notificacoes
  profileHref?: string;       // default: /aluno/dados
  greetingFallback?: string;  // default: "Olá 👋"
  pollMs?: number;            // default: 60000
};

export default function AlunoTopbar({
  notificationsHref = "/aluno/notificacoes",
  profileHref = "/aluno/dados",
  greetingFallback = "Olá 👋",
  pollMs = 60_000,
}: Props) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [loadingUser, setLoadingUser] = useState(true);
  const [saudacao, setSaudacao] = useState(greetingFallback);

  const [unread, setUnread] = useState<number | null>(null);
  const [loadingUnread, setLoadingUnread] = useState(true);

  // ===== Dark mode =====
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ===== Load user (saudação) =====
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`${apiBase}/auth/me`, { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        if (data?.nome) {
          const primeiro = String(data.nome).split(" ")[0];
          setSaudacao(`Olá, ${primeiro} 👋`);
        } else {
          setSaudacao(greetingFallback);
        }
      } catch {
        setSaudacao(greetingFallback);
      } finally {
        if (alive) setLoadingUser(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiBase, greetingFallback]);

  // ===== Unread notifications (poll) =====
  const fetchUnread = useMemo(
    () => async () => {
      try {
        setLoadingUnread(true);
        // pedir só o total (pageSize=1)
        const res = await apiFetch(
          `${apiBase}/notifications?apenasNaoLidas=1&page=1&pageSize=1`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setUnread(Number(data?.total ?? 0));
      } catch {
        setUnread(0);
      } finally {
        setLoadingUnread(false);
      }
    },
    [apiBase]
  );

  useEffect(() => {
    let timer: any;
    fetchUnread();
    timer = setInterval(fetchUnread, pollMs);
    return () => clearInterval(timer);
  }, [fetchUnread, pollMs]);

  const badgeText =
    unread === null
      ? ""
      : unread > 99
      ? "99+"
      : unread > 0
      ? String(unread)
      : "";

  return (
    <div className="mb-2 flex items-center justify-between">
      <div>
        <h1 className="font-grotesk text-2xl sm:text-3xl font-semibold tracking-tight">
          {loadingUser ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando…
            </span>
          ) : (
            saudacao
          )}
        </h1>
        <p className="text-muted-foreground">
          Encontre respostas rápidas ou abra um chamado se precisar de ajuda.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          aria-label="Alternar tema"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border)] bg-background hover:bg-[var(--muted)]"
          title={theme === "dark" ? "Tema claro" : "Tema escuro"}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {/* Notifications */}
        <Link
          href={notificationsHref}
          className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border)] bg-background hover:bg-[var(--muted)]"
          aria-label="Notificações"
          title="Notificações"
        >
          <Bell className="size-4" />
          {/* badge */}
          {loadingUnread ? (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] grid place-items-center">
              <Loader2 className="size-3 animate-spin" />
            </span>
          ) : unread && unread > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-red-500 text-white text-[10px] grid place-items-center px-1">
              {badgeText}
            </span>
          ) : null}
        </Link>

        {/* Profile */}
        <Link
          href={profileHref}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--border)] bg-background hover:bg-[var(--muted)]"
        >
          <User className="size-4" />
          <span className="hidden sm:inline">Meus dados</span>
        </Link>
      </div>
    </div>
  );
}
