"use client";

import { useEffect, useState } from "react";
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
  AlertCircle,
} from "lucide-react";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";
import { cx } from '../../../../utils/cx';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

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

export default function NotificacoesAlunoPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [marking, setMarking] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const unread = notifs.filter((n) => !n.lidaEm).length;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `${API_BASE}/notifications?orderDir=desc&page=1&pageSize=100`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? `Erro ${res.status}`);
      }
      const data: PageResp = await res.json();
      setNotifs(data.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível carregar as notificações");
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markAsRead(id: string) {
    setMarking(id);
    try {
      await apiFetch(`${API_BASE}/notifications/${id}/lida`, { method: "PATCH" });
      setNotifs((xs) =>
        xs.map((n) => (n.id === id ? { ...n, lidaEm: new Date().toISOString() } : n))
      );
    } finally {
      setMarking(null);
    }
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    try {
      await apiFetch(`${API_BASE}/notifications/read-all`, { method: "POST" });
      setNotifs((prev) =>
        prev.map((n) => ({ ...n, lidaEm: n.lidaEm ?? new Date().toISOString() }))
      );
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <MobileSidebarTriggerAluno />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Novidades e alertas</h2>
            {unread > 0 && (
              <span className="rounded-md border border-[var(--border)] bg-background px-1.5 py-0.5 text-xs font-medium">
                {unread} não lida{unread !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {notifs.length > 0 && unread > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
            >
              {markingAll ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Marcar todas como lidas
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
            <Loader2 className="size-4 animate-spin" />
            Carregando notificações…
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive py-8 justify-center">
            <AlertCircle className="size-4" />
            {error}
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Nenhuma notificação no momento.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {notifs.map((n) => (
              <li
                key={n.id}
                className={cx(
                  "p-3 sm:p-4 transition",
                  !n.lidaEm ? "bg-[var(--brand-cyan)]/10" : ""
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
                        <Link href={`/aluno/chamados/${n.chamadoId}`} className="text-[var(--brand-cyan)] hover:underline">
                          Ver solicitação →
                        </Link>
                      )}
                      {n.meta?.url && (
                        <Link href={n.meta.url} className="text-[var(--brand-cyan)] hover:underline">
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
                      "shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-xs transition",
                      n.lidaEm
                        ? "opacity-40 cursor-default border-[var(--border)] text-muted-foreground"
                        : "border-[var(--border)] hover:bg-[var(--muted)] text-foreground"
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
