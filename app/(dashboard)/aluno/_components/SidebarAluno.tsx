"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  User,
  HelpCircle,
  Settings,
  Bell,
  LogOut,
} from "lucide-react";
import Cookies from 'js-cookie';

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function SidebarAluno({
  aguardandoCount = 0,
  meusChamadosCount = 0,
  onClose,
}: {
  aguardandoCount?: number;
  meusChamadosCount?: number;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const items: NavItemProps[] = [
    { href: "/aluno/home", label: "Visão Geral", icon: <LayoutDashboard className="size-4" /> },
    { href: "/aluno/chamados", label: "Meus chamados", icon: <Ticket className="size-4" />},
    { href: "/aluno/catalogo", label: "Catálogo de serviços", icon: <BookOpen className="size-4" /> },
    { href: "/aluno/dados", label: "Meus dados", icon: <User className="size-4" /> },
    { href: "/aluno/notificacoes", label: "Notificações", icon: <Bell className="size-4" />, badge: aguardandoCount },
    { href: "/aluno/ajuda", label: "Ajuda / FAQ", icon: <HelpCircle className="size-4" /> },
    { href: "/aluno/configuracoes", label: "Configurações", icon: <Settings className="size-4" /> },
  ];

  function isActive(href: string) {
    // marca ativo por prefixo (ex.: /aluno/chamados/123 continua ativo em /aluno/chamados)
    if (href === "/home/aluno") return pathname === "/home/aluno" || pathname === "/aluno";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function handleLogout() {
    try {
      // Limpa os cookies que o middleware lê
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");

      // Limpa o localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
    } catch (e) {
      console.error("Erro ao fazer logout:", e);
    }
    // Redireciona para o login DEPOIS de limpar
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
            <div className="font-grotesk text-sm font-semibold">Portal do Aluno</div>
            <div className="text-xs text-muted-foreground">Autoatendimento</div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="space-y-1">
          <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">Geral</div>
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
              <span>Aguardando você</span>
              <span className="font-medium">{aguardandoCount}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Meus chamados</span>
              <span className="font-medium">{meusChamadosCount}</span>
            </li>
          </ul>
        </div>

        {/* Sair (fixo no rodapé do sidebar) */}
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
