"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Loader2, Moon, Sun } from "lucide-react";
import { apiFetch } from "../../../../utils/api";

type Props = {
  notificationsHref?: string; // default: /sistema/notificacoes
  pollMs?: number;            // default: 60000
};

export default function SistemaTopbar({
  notificationsHref = "/sistema/notificacoes",
  pollMs = 60_000,
}: Props) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [mounted, setMounted] = useState(false);

  const [loadingUser, setLoadingUser] = useState(true);
  const [userNome, setUserNome] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [unread, setUnread] = useState<number | null>(null);
  const [loadingUnread, setLoadingUnread] = useState(true);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Montagem: somente no client lemos localStorage e ajustamos <html>
  useEffect(() => {
    setMounted(true);
    try {
      const stored = (localStorage.getItem("theme") as "light" | "dark") || "light";
      setTheme(stored);
      const root = document.documentElement;
      if (stored === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    } catch {}
  }, []);

  // Aplicar mudanças de tema após montado
  useEffect(() => {
    if (!mounted) return;
    try {
      const root = document.documentElement;
      if (theme === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme, mounted]);

  // Carrega usuário (nome/email)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`${apiBase}/auth/me`, { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        setUserNome(data?.nome ?? null);
        setUserEmail(data?.emailPessoal ?? data?.email ?? null);
      } catch {
        setUserNome(null);
        setUserEmail(null);
      } finally {
        if (alive) setLoadingUser(false);
      }
    })();
    return () => { alive = false; };
  }, [apiBase]);

  // Notificações não lidas
  async function fetchUnread() {
    try {
      setLoadingUnread(true);
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
  }

  useEffect(() => {
    fetchUnread();
    const t = setInterval(fetchUnread, pollMs);
    return () => clearInterval(t);
  }, [pollMs]);

  const badgeText =
    unread === null ? "" : unread > 99 ? "99+" : unread > 0 ? String(unread) : "";

  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        {loadingUser ? (
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando usuário…
          </div>
        ) : userNome ? (
          <>
            <h1 className="font-grotesk text-2xl sm:text-3xl font-semibold tracking-tight">
              {userNome}
            </h1>
            {userEmail && (
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            )}
          </>
        ) : (
          <h1 className="text-muted-foreground">Usuário não identificado</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Toggle de tema — evita hidratação até montar */}
        {mounted ? (
          <button
            aria-label="Alternar tema"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border)] bg-background hover:bg-[var(--muted)]"
            title={theme === "dark" ? "Tema claro" : "Tema escuro"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        ) : (
          // placeholder estático evita mismatch e layout shift
          <div className="h-9 w-9 rounded-lg border border-[var(--border)] bg-background" />
        )}

        {/* Notificações */}
        <Link
          href={notificationsHref}
          className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border)] bg-background hover:bg-[var(--muted)]"
          aria-label="Notificações"
          title="Notificações"
        >
          <Bell className="size-4" />
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
      </div>
    </div>
  );
}
