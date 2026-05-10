"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, AlertTriangle, Paperclip, Plus, MessageSquareText, Ticket } from "lucide-react";
import { toast } from "sonner";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";
import { apiFetch } from "../../../../utils/api";
import { cx } from "../../../../utils/cx";
import TicketStatusBadge from "../../../components/shared/TicketStatusBadge";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import Alert from "../../../components/ui/Alert";
import { SkeletonTable } from "../../../components/ui/Skeleton";
import type { Chamado, PageResponse, Status } from "../../../../utils/types";

type PageResp = PageResponse<Chamado>;

function AcoesChamado({ c }: { c: Chamado }) {
  return (
    <div className="flex gap-2 justify-end flex-wrap">
      <Link href={`/aluno/chamados/${c.id}`}>
        <Button variant="outline" size="sm">Ver detalhes</Button>
      </Link>
      {["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_USUARIO"].includes(c.status) && (
        <Link href={`/aluno/chamados/${c.id}#responder`}>
          <Button variant="outline" size="sm">Responder</Button>
        </Link>
      )}
      {c.precisaAcaoDoAluno && (
        <Link href={`/aluno/chamados/${c.id}#anexos`}>
          <Button variant="outline" size="sm" icon={<Paperclip className="size-3.5" />}
            className="border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10">
            Enviar arquivo
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function MeusChamadosPage() {
  const [dados, setDados] = useState<Chamado[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets?include=setor`
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? `Erro HTTP ${res.status}`);
        }
        const data: PageResp = await res.json();
        if (alive) setDados(data.items ?? []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : undefined;
        toast.error("Erro ao carregar solicitações", { description: message });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return dados.filter((c) => {
      const qOk = !termo || c.titulo.toLowerCase().includes(termo) || (c.protocolo ?? "").toLowerCase().includes(termo);
      const sOk = status === "ALL" || c.status === status;
      return qOk && sOk;
    });
  }, [dados, q, status]);

  const aguardandoCount = useMemo(
    () => filtrados.filter((d) => d.status === "AGUARDANDO_USUARIO").length,
    [filtrados]
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <MobileSidebarTriggerAluno />
      </div>

      <div className="space-y-5">
        <PageHeader
          title="Minhas solicitações"
          description="Acompanhe o andamento das suas solicitações acadêmicas."
          actions={
            <Link href="/aluno/catalogo">
              <Button icon={<Plus className="size-4" />}>Abrir solicitação</Button>
            </Link>
          }
        />

        {/* Banner aguardando ação */}
        {aguardandoCount > 0 && (
          <Alert variant="warning">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-medium">
                  {aguardandoCount} solicitação(ões) aguardando sua ação
                </p>
                <p className="text-sm opacity-80 mt-0.5">
                  Envie documentos, responda mensagens ou conclua a tarefa.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10 shrink-0"
                onClick={() => setStatus("AGUARDANDO_USUARIO")}
              >
                Filtrar
              </Button>
            </div>
          </Alert>
        )}

        {/* Filtros */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-0 sm:max-w-xs">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              placeholder="Buscar por protocolo ou título…"
              aria-label="Buscar solicitações"
              className="w-full h-9 rounded-lg border border-[var(--border)] bg-input pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="h-9 rounded-lg border border-[var(--border)] bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] sm:w-56"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status | "ALL")}
          >
            <option value="ALL">Todos os status</option>
            <option value="ABERTO">Recebida pela Fatec</option>
            <option value="EM_ATENDIMENTO">Em análise</option>
            <option value="AGUARDANDO_USUARIO">Aguardando minha ação</option>
            <option value="RESOLVIDO">Respondida</option>
            <option value="ENCERRADO">Encerrada</option>
          </select>
        </div>

        {/* Lista */}
        <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
          {loading ? (
            <SkeletonTable rows={5} cols={5} />
          ) : filtrados.length === 0 ? (
            <EmptyState
              icon={<Ticket className="size-6" />}
              title={dados.length === 0 ? "Nenhuma solicitação ainda" : "Nenhum resultado"}
              description={
                dados.length === 0
                  ? "Abra sua primeira solicitação pelo catálogo de serviços."
                  : "Tente ajustar os filtros de busca."
              }
              action={
                dados.length === 0 ? (
                  <Link href="/aluno/catalogo">
                    <Button size="sm" icon={<Plus className="size-4" />}>Abrir solicitação</Button>
                  </Link>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => { setQ(""); setStatus("ALL"); }}>
                    Limpar filtros
                  </Button>
                )
              }
            />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[var(--muted)]/60 border-b border-[var(--border)]">
                    <tr>
                      {["Protocolo", "Título", "Setor", "Status", "Criado em", "Ações"].map((h, i) => (
                        <th key={h} className={cx("text-xs font-medium text-muted-foreground px-4 py-2.5", i === 5 ? "text-right" : "text-left")}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filtrados.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--muted)]/20 transition">
                        <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                          {c.protocolo ?? `#${c.id.slice(0, 8)}`}
                        </td>
                        <td className="px-4 py-3 max-w-[340px]">
                          <span className="line-clamp-1 font-medium">{c.titulo}</span>
                          {!!c.mensagensNaoLidas && (
                            <span className="ml-2 align-middle text-[10px] rounded-md px-1.5 py-0.5 bg-[var(--brand-cyan)]/15 text-[var(--brand-cyan)] border border-[var(--brand-cyan)]/30">
                              {c.mensagensNaoLidas} nova(s)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{c.setor?.nome ?? "—"}</td>
                        <td className="px-4 py-3"><TicketStatusBadge status={c.status} /></td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(c.criadoEm).toLocaleDateString("pt-BR")}</td>
                        <td className="px-4 py-3"><AcoesChamado c={c} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-[var(--border)]">
                {filtrados.map((c) => (
                  <div key={c.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">{c.protocolo ?? `#${c.id.slice(0, 8)}`}</p>
                        <p className="font-medium truncate">{c.titulo}</p>
                      </div>
                      <TicketStatusBadge status={c.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Setor</span>
                      <span>{c.setor?.nome ?? "—"}</span>
                      <span className="text-muted-foreground">Criado em</span>
                      <span>{new Date(c.criadoEm).toLocaleDateString("pt-BR")}</span>
                    </div>
                    {!!c.mensagensNaoLidas && (
                      <div className="inline-flex items-center gap-1.5 text-[11px] rounded-md px-1.5 py-0.5 bg-[var(--brand-cyan)]/15 text-[var(--brand-cyan)] border border-[var(--brand-cyan)]/30">
                        <MessageSquareText className="size-3" />
                        {c.mensagensNaoLidas} nova(s) mensagem(ns)
                      </div>
                    )}
                    <AcoesChamado c={c} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
