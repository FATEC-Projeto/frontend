"use client";
import type { ReactNode } from "react";
import SidebarAluno from "./_components/SidebarAluno";
import AlunoTopbar from "./_components/AlunoTopbar";

export default function AlunoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_rgba(198,40,40,0.06),_transparent_55%)]">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-6">
        
        {/* Sidebar fixa (desktop) */}
        <div className="hidden xl:block">
          <SidebarAluno />
        </div>

        <main className="min-h-dvh px-2 sm:px-0 space-y-6">
          {/* Topbar global com saudação + dark mode + notificações */}
          <AlunoTopbar
            notificationsHref="/aluno/notificacoes"
            profileHref="/aluno/dados"
            greetingFallback="Olá 👋"
            pollMs={60_000} // verifica notificações a cada 1min
          />
          {children}
        </main>
      </div>
    </div>
  );
}
