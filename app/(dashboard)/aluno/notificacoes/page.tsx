"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../utils/api";
import {
  Bell,
  Loader2,
  Mail,
  MessageSquareText,
  Paperclip,
  Check,
  Info,
} from "lucide-react";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";
import { cx } from '../../../../utils/cx'

/* ---------- Tipos ---------- */
type Tipo =
  | "CHAMADO_CRIADO"
  | "CHAMADO_ATRIBUIDO"
  | "CHAMADO_ATUALIZADO"
  | "STATUS_ALTERADO"
  | "MENSAGEM_NOVA"
  | "ANEXO_NOVO"
  | "SISTEMA";

type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: Tipo;
  criadoEm: string;
  lidaEm?: string | null;
  arquivadaEm?: string | null;
  chamadoId?: string | null;
  meta?: Record<string, any> | null;
};

type PageResp = {
  total: number;
  page: number;
  pageSize: number;
  items: Notificacao[];
};


function TipoIcon({ tipo }: { tipo: Tipo }) {
  const cls = "size-4";
  switch (tipo) {
    case "MENSAGEM_NOVA":
      return <MessageSquareText className={cls} />;
    case "ANEXO_NOVO":
      return <Paperclip className={cls} />;
    case "CHAMADO_ATRIBUIDO":
    case "CHAMADO_CRIADO":
    case "CHAMADO_ATUALIZADO":
    case "STATUS_ALTERADO":
      return <Bell className={cls} />;
    case "SISTEMA":
      return <Info className={cls} />;
    default:
      return <Mail className={cls} />;
  }
}

/* ---------- Página ---------- */
export default function NotificacoesAlunoPage() {
  const [loading, setLoading] = useState(true);
  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [marking, setMarking] = useState<string | null>(null);
  const [unread, setUnread] = useState(0); // Contador de notificações não lidas
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  // carregar notificações
  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/notifications?orderDir=desc&page=1&pageSize=100`, {
        cache: "no-store",
      });
      const data: PageResp = await res.json();
      setNotifs(data.items ?? []);
      setUnread(data.items.filter((n) => !n.lidaEm).length); // Recalcular as notificações não lidas
    } catch {
      setNotifs([]);
      setUnread(0); // Caso não haja notificações, garantir que o contador seja zero
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [apiBase]);

  // Marcar notificação como lida
  async function markAsRead(id: string) {
    try {
      setMarking(id);
      await apiFetch(`${apiBase}/notifications/${id}/lida`, {
        method: "PATCH",
        body: JSON.stringify({ lida: true }),
      });
      setNotifs((xs) => xs.map((n) => (n.id === id ? { ...n, lidaEm: new Date().toISOString() } : n)));
      setUnread((prevUnread) => prevUnread - 1); // Decrementar o contador de notificações não lidas
    } finally {
      setMarking(null);
    }
  }

  // Marcar todas as notificações como lidas
  async function markAllAsRead() {
    try {
      setLoading(true);
      // Enviar corpo com JSON
await apiFetch(`${apiBase}/notifications/read-all`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json", // Especificar o tipo do conteúdo
  },
  body: JSON.stringify({ lida: true }), // Enviar corpo com a chave lida
});


      // Atualizar todas as notificações no estado como lidas
      setNotifs((prevNotifs) =>
        prevNotifs.map((n) => ({ ...n, lidaEm: new Date().toISOString() }))
      );

      // Resetando o contador de notificações não lidas
      setUnread(0);
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Topbar compacta */}
      <div className="mb-2 flex items-center justify-between">
        <MobileSidebarTriggerAluno />
      </div>

      {/* Botão de "Marcar todas como lidas" */}
      <div className="mb-4">
        <button
          onClick={markAllAsRead}
          className="bg-[#D91F2B] text-white px-4 py-2 rounded hover:bg-[#B11D22]" // Vermelho mais escuro


        >
          Marcar todas como lidas
        </button>
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Novidades e alertas</h2>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin" />
            Carregando notificações…
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Nenhuma notificação no momento.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {notifs.map((n) => (
              <li
                key={n.id}
                className={cx(
                  "p-3 sm:p-4 transition",
                  !n.lidaEm ? "bg-[var(--brand-cyan)]/8" : "bg-card"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-[var(--border)] bg-background">
                        <TipoIcon tipo={n.tipo} />
                      </span>
                      <strong className="text-sm leading-tight truncate">{n.titulo}</strong>
                      {!n.lidaEm && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md border bg-[var(--brand-cyan)]/15 text-[var(--brand-cyan)] border-[var(--brand-cyan)]/30">
                          novo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap break-words">
                      {n.mensagem}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <time>{new Date(n.criadoEm).toLocaleString("pt-BR")}</time>
                      {n.chamadoId && (
                        <Link
                          href={`/aluno/chamados/${n.chamadoId}`}
                          className="text-[var(--brand-cyan)] hover:underline"
                        >
                          Ver chamado →
                        </Link>
                      )}
                      {n.meta?.url && (
                        <Link
                          href={n.meta.url}
                          className="text-[var(--brand-cyan)] hover:underline"
                        >
                          Abrir detalhe →
                        </Link>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => markAsRead(n.id)}
                    disabled={!!n.lidaEm || marking === n.id}
                    title="Marcar como lida"
                    className={cx(
                      "shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-[#4B5563] text-xs", // Cor de texto mais forte
                      n.lidaEm ? "opacity-50 cursor-default border-[#6B7280]" : "border-[#D91F2B] text-[#D91F2B] hover:bg-[#D91F2B]/10"
                    )}
                  >

                    {marking === n.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Lida
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
