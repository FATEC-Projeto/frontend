import type { ReactNode } from "react";
import SidebarAdmin from "./_components/SidebarAdmin";
import MobileSidebarTriggerAdmin from "./_components/MobileSidebarTriggerAdmin";
import SistemaTopbar from "./_components/SistemaTopbar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_rgba(198,40,40,0.06),_transparent_55%)]">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar fixa em telas grandes */}
        <div className="hidden xl:block">
          <SidebarAdmin />
        </div>

        {/* Conteúdo das páginas */}
        <main className="min-h-dvh px-2 sm:px-0">
          {/* Topbar do sistema (nome + e-mail, tema, notificações) */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              {/* botão de menu (mobile) à esquerda */}
              <div className="xl:hidden mr-2">
                <MobileSidebarTriggerAdmin />
              </div>
              {/* topbar ocupa o resto */}
              <div className="flex-1">
                <SistemaTopbar notificationsHref="/sistema/notificacoes" />
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
