"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  AlertTriangle,
  ChevronRight,
  Paperclip,
  Plus,
  Loader2,
  MessageSquareText,
} from "lucide-react";
import { toast } from "sonner";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";
import { apiFetch } from "../../../../utils/api";
import { cx } from '../../../../utils/cx'
import TicketStatusBadge from "../../../components/shared/TicketStatusBadge";

/* ---------- Tipos ---------- */
type Status =
  | "ABERTO"
  | "EM_ATENDIMENTO"
  | "AGUARDANDO_USUARIO"
  | "RESOLVIDO"
  | "ENCERRADO";

type Chamado = {
  id: string;
  protocolo?: string | null;
  titulo: string;
  criadoEm: string;
  status: Status;
  setor?: { nome?: string | null } | null;
  precisaAcaoDoAluno?: boolean | null;
  mensagensNaoLidas?: number | null;
};

type PageResp = {
  total: number;
  page: number;
  pageSize: number;
  items: Chamado[];
};


function AcoesChamado({ c }: { c: Chamado }) {
  const base =
    "inline-flex items-center h-9 px-3 rounded-md border border-[var(--border)] bg-background hover:bg-[var(--muted)] text-sm transition";

  return (
    <div className="flex gap-2 justify-end">
      {/* Link sempre visível: permite consultar o chamado mesmo encerrado */}
      <Link
        href={`/aluno/chamados/${c.id}`}
        className={cx(base, "text-[var(--brand-teal)] border-[var(--brand-teal)]/40")}
      >
        Ver detalhes
      </Link>

      {/* Se ainda pode responder */}
      {["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_USUARIO"].includes(c.status) && (
        <Link
          href={`/aluno/chamados/${c.id}#responder`}
          className={cx(base, "text-[var(--brand-teal)] border-[var(--brand-teal)]/40")}
        >
          Responder
        </Link>
      )}

      {/* Se precisa enviar arquivo */}
      {c.precisaAcaoDoAluno && (
        <Link
          href={`/aluno/chamados/${c.id}#anexos`}
          className={cx(
            base,
            "border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10"
          )}
        >
          <Paperclip className="size-4 mr-1" /> Enviar arquivo
        </Link>
      )}
    </div>
  );
}


/* ---------- Página ---------- */
export default function MeusChamadosPage() {
  const [dados, setDados] = useState<Chamado[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  // Busca tickets do usuário autenticado.
  // O backend já usa o JWT para filtrar (não precisamos mandar feitoPorId).
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
          throw new Error(err?.error || `Erro HTTP ${res.status}`);
        }
        const data: PageResp = await res.json();
        if (alive) setDados(data.items ?? []);
      } catch (err: any) {
        toast.error("Erro ao carregar chamados", { description: err?.message });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return dados.filter((c) => {
      const qOk =
        !termo ||
        c.titulo.toLowerCase().includes(termo) ||
        (c.protocolo ?? "").toLowerCase().includes(termo);
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
      {/* Topbar mínima (sem saudação; cabeçalho global está no layout) */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">Acompanhe e gerencie seus chamados.</p>
        </div>
        <MobileSidebarTriggerAluno />
      </div>

      {/* Banner aguardando ação (se houver) */}
      {aguardandoCount > 0 && (
        <div className="mb-4 rounded-xl border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-[var(--warning)] mt-0.5" />
              <div>
                <div className="font-medium">Você tem {aguardandoCount} chamado(s) aguardando sua ação.</div>
                <div className="text-sm text-muted-foreground">
                  Envie documentos, responda mensagens ou conclua a tarefa.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center h-9 px-3 rounded-md border border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10"
              onClick={() => setStatus("AGUARDANDO_USUARIO")}
            >
              Filtrar por “Aguardando você”
            </button>
          </div>
        </div>
      )}

      {/* Ações + Filtros */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Link
            href="/aluno/catalogo"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" /> Abrir novo chamado
          </Link>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-[320px]">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Buscar por protocolo ou título"
              aria-label="Buscar por protocolo ou título"
              className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select
            className="h-10 w-full sm:w-[200px] px-3 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="ALL">Todos os status</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM_ATENDIMENTO">Em atendimento</option>
            <option value="AGUARDANDO_USUARIO">Aguardando você</option>
            <option value="RESOLVIDO">Resolvido</option>
            <option value="ENCERRADO">Encerrado</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="size-4 animate-spin inline-block mr-2" />
            Carregando...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum chamado encontrado com os filtros atuais.
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--muted)] text-foreground/90">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Protocolo</th>
                    <th className="text-left font-medium px-4 py-3">Título</th>
                    <th className="text-left font-medium px-4 py-3">Setor</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-left font-medium px-4 py-3">Criado em</th>
                    <th className="text-right font-medium px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((c) => (
                    <tr key={c.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-3 font-medium">{c.protocolo ?? `#${c.id}`}</td>
                      <td className="px-4 py-3 max-w-[420px]">
                        <div className="line-clamp-1">{c.titulo}</div>
                        {!!c.mensagensNaoLidas && (
                          <span className="ml-2 align-middle text-xs rounded-md px-1.5 py-0.5 bg-[var(--brand-cyan)]/15 text-[var(--brand-cyan)] border border-[var(--brand-cyan)]/30">
                            {c.mensagensNaoLidas} nova(s)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{c.setor?.nome ?? "—"}</td>
                      <td className="px-4 py-3">
                        <TicketStatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3">
                        {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AcoesChamado c={c} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-[var(--border)]">
              {filtrados.map((c) => (
                <div key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {c.protocolo ?? `#${c.id}`}
                      </div>
                      <div className="font-medium">{c.titulo}</div>
                    </div>
                    <TicketStatusBadge status={c.status} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Setor</div>
                    <div>{c.setor?.nome ?? "—"}</div>
                    <div className="text-muted-foreground">Criado em</div>
                    <div>{new Date(c.criadoEm).toLocaleDateString("pt-BR")}</div>
                  </div>

                  {!!c.mensagensNaoLidas && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs rounded-md px-1.5 py-0.5 bg-[var(--brand-cyan)]/15 text-[var(--brand-cyan)] border border-[var(--brand-cyan)]/30">
                      <MessageSquareText className="size-3.5" />
                      {c.mensagensNaoLidas} nova(s) mensagem(ns)
                    </div>
                  )}

                  <div className="mt-3">
                    <AcoesChamado c={c} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
