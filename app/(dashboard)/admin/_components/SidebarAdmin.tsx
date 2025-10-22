"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Users,
  UserPlus,
  FileChartColumn,
  Settings,
  MessageSquareText,
  Building2,
  Bell,
  LogOut,
} from "lucide-react";
import { useMemo } from "react";

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function SidebarAdmin({
  chamadosAbertosCount = 0,
  notificacoesCount = 0,
  pendenciasCount = 0,
  onClose,
}: {
  /** Chamados em aberto (para badge do menu Chamados) */
  chamadosAbertosCount?: number;
  /** Notificações (para badge do menu Comunicações) */
  notificacoesCount?: number;
  /** Pendências gerais (ex.: aprovações) */
  pendenciasCount?: number;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const items: NavItemProps[] = useMemo(
    () => [
      { href: "/admin/home", label: "Visão Geral", icon: <LayoutDashboard className="size-4" /> },
      { href: "/admin/chamados", label: "Todos os Chamados", icon: <Ticket className="size-4" />, badge: chamadosAbertosCount },
      { href: "/admin/alunos", label: "Gerenciar Alunos", icon: <Users className="size-4" />, badge: pendenciasCount || undefined },
      { href: "/admin/funcionarios", label: "Gerenciar Funcionários", icon: <UserPlus className="size-4" /> },
      { href: "/admin/comunicacoes", label: "Comunicações", icon: <MessageSquareText className="size-4" />, badge: notificacoesCount },
      { href: "/admin/relatorios", label: "Relatórios", icon: <FileChartColumn className="size-4" /> },
      { href: "/admin/setores", label: "Setores", icon: <Building2 className="size-4" /> },
      { href: "/admin/configuracoes", label: "Configurações", icon: <Settings className="size-4" /> },
    ],
    [chamadosAbertosCount, notificacoesCount, pendenciasCount]
  );

  function isActive(href: string) {
    // marca ativo por prefixo (ex.: /admin/chamados/123 continua ativo em /admin/chamados)
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function handleLogout() {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } catch {}
    router.push("/login");
    onClose?.();
  }

  return (
    <aside className="xl:sticky xl:top-4 xl:self-start w-full xl:w-[260px]">
      <div className="rounded-2xl border border-[var(--border)] bg-card p-3 flex flex-col min-h-[520px]">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2 px-2 select-none">
          <div className="size-8 rounded-lg bg-primary grid place-items-center text-primary-foreground text-xs font-bold">
            WF
          </div>
          <div>
            <div className="font-grotesk text-sm font-semibold">Secretaria</div>
            <div className="text-xs text-muted-foreground">Sistema de Gestão</div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="space-y-1">
          <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">Visão Geral</div>

          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={cx(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive(it.href)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-[var(--muted)]/70"
              )}
              onClick={onClose}
            >
              <span className="flex items-center gap-3">
                <span className="inline-grid place-items-center size-5 opacity-90">{it.icon}</span>
                <span>{it.label}</span>
              </span>
              {it.badge != null && (
                <span className="ml-2 rounded-md bg-background px-1.5 py-0.5 text-xs border border-[var(--border)]">
                  {it.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Indicadores rápidos */}
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-background p-3">
          <div className="text-xs text-muted-foreground mb-2">Indicadores rápidos</div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span>SLA médio (dias)</span>
              <span className="font-medium">1,7</span>
            </li>
            <li className="flex items-center justify-between">
              <span>% resolvidos</span>
              <span className="font-medium">82%</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Pendências</span>
              <span className="font-medium">{pendenciasCount}</span>
            </li>
          </ul>
        </div>

        {/* Sair (rodapé) */}
        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
