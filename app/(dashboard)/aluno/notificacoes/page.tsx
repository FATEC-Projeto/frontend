"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";

export default function NotificacoesAlunoPage() {
  const [saudacao, setSaudacao] = useState("Olá 👋");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (data?.nome) {
          const primeiro = String(data.nome).split(" ")[0];
          setSaudacao(`Olá, ${primeiro} 👋`);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="space-y-6">
      {/* Topbar */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="font-grotesk text-2xl sm:text-3xl font-semibold tracking-tight">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Carregando…
              </span>
            ) : (
              saudacao
            )}
          </h1>
          <p className="text-muted-foreground">Veja novidades e alertas sobre seus chamados.</p>
        </div>
        <MobileSidebarTriggerAluno />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Notificações</h2>
        </div>

        <div className="text-sm text-muted-foreground">
          Nenhuma notificação no momento.
          <br />
          (Quando houver, você verá mensagens como “Chamado #WF-2025-0112 recebeu uma nova resposta”.)
        </div>
      </div>
    </div>
  );
}
