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

/* ---------- Utils ---------- */
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

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
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  // carregar notificações
  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/notificacoes?orderDir=desc&page=1&pageSize=100`, {
        cache: "no-store",
      });
      const data: PageResp = await res.json();
      setNotifs(data.items ?? []);
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [apiBase]);

  const unread = useMemo(() => notifs.filter((n) => !n.lidaEm).length, [notifs]);

  async function markAsRead(id: string) {
    try {
      setMarking(id);
      await apiFetch(`${apiBase}/notificacoes/${id}/lida`, {
        method: "PATCH",
        body: JSON.stringify({ lida: true }),
      });
      setNotifs((xs) => xs.map((n) => (n.id === id ? { ...n, lidaEm: new Date().toISOString() } : n)));
    } finally {
      setMarking(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Topbar compacta */}
      <div className="mb-2 flex items-center justify-between">
      
        <MobileSidebarTriggerAluno />
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
                      "shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-xs",
                      n.lidaEm
                        ? "opacity-50 cursor-default border-[var(--border)]"
                        : "border-[var(--brand-teal)]/40 text-[var(--brand-teal)] hover:bg-[var(--brand-teal)]/10"
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
