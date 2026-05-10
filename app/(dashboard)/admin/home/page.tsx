"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Ticket, User, FileChartColumn } from "lucide-react";
import MobileSidebarTriggerAdmin from "../_components/MobileSidebarTriggerAdmin";
import { apiFetch } from "../../../../utils/api";
import TicketStatusBadge from "../../../components/shared/TicketStatusBadge";
import PriorityDot from "../../../components/shared/PriorityDot";
import Alert from "../../../components/ui/Alert";
import EmptyState from "../../../components/ui/EmptyState";
import { SkeletonTable } from "../../../components/ui/Skeleton";

/* ----------------------------- Tipos ----------------------------- */
type Status =
  | "ABERTO"
  | "EM_ATENDIMENTO"
  | "AGUARDANDO_USUARIO"
  | "RESOLVIDO"
  | "ENCERRADO";
type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

type Chamado = {
  id: string;
  protocolo?: string | null;
  titulo: string;
  criadoEm: string; // ISO
  status: Status;
  prioridade: Prioridade;
  setor?: { nome?: string | null } | null;
  criadoPor?: { nome?: string | null } | null;
};

type PageResp = {
  total: number;
  page: number;
  pageSize: number;
  items: Chamado[];
};

/* ----------------------------- Página ----------------------------- */
export default function AdminHomePage() {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL;

  // filtros
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const [prioridade, setPrioridade] = useState<Prioridade | "ALL">("ALL");

  // dados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PageResp>({
    total: 0,
    page: 1,
    pageSize: 50,
    items: [],
  });

  // monta URL com filtros (alinhado com backend)
  const buildUrl = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", "50"); // <= 100 (validação no backend)
    params.set("orderBy", "criadoEm");
    params.set("orderDir", "desc");
    params.set("include", "setor,criadoPor");

    if (q.trim()) params.set("search", q.trim());
    if (status !== "ALL") params.set("status", status);
    if (prioridade !== "ALL") params.set("prioridade", prioridade);

    return `${API}/tickets?${params.toString()}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch(buildUrl(), { cache: "no-store" });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as PageResp;
      setPageData({
        total: Number(data?.total ?? 0),
        page: Number(data?.page ?? 1),
        pageSize: Number(data?.pageSize ?? 50),
        items: Array.isArray(data?.items) ? data.items : [],
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Falha ao carregar chamados");
    } finally {
      setLoading(false);
    }
  };

  // carrega ao abrir e sempre que filtros mudarem
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, prioridade, API]);

  const items = pageData.items;

  return (
    <div className="min-h-dvh px-4 py-2 sm:px-6 lg:px-8">
      {/* Topbar (mobile) */}
      <div className="mb-4 xl:hidden">
        <MobileSidebarTriggerAdmin />
      </div>

      {/* Ações rápidas (no topo) */}
      <section className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/admin/chamados"
          className="rounded-xl border border-[var(--border)] bg-card p-4 flex items-center justify-between hover:bg-[var(--muted)]/60 transition"
        >
          <div>
            <div className="text-sm text-muted-foreground">Ir para</div>
            <div className="text-lg font-semibold">Chamados</div>
          </div>
          <Ticket className="size-5 opacity-80" />
        </Link>

        <Link
          href="/admin/alunos"
          className="rounded-xl border border-[var(--border)] bg-card p-4 flex items-center justify-between hover:bg-[var(--muted)]/60 transition"
        >
          <div>
            <div className="text-sm text-muted-foreground">Ir para</div>
            <div className="text-lg font-semibold">Cadastro de aluno</div>
          </div>
          <User className="size-5 opacity-80" />
        </Link>

        <Link
          href="/admin/relatorios"
          className="rounded-xl border border-[var(--border)] bg-card p-4 flex items-center justify-between hover:bg-[var(--muted)]/60 transition"
        >
          <div>
            <div className="text-sm text-muted-foreground">Ir para</div>
            <div className="text-lg font-semibold">Relatórios</div>
          </div>
          <FileChartColumn className="size-5 opacity-80" />
        </Link>
      </section>

      {/* Filtros */}
      <section className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            placeholder="Buscar por protocolo, título ou solicitante…"
            aria-label="Buscar chamados"
            className="w-full h-9 rounded-lg border border-[var(--border)] bg-input pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="h-9 rounded-lg border border-[var(--border)] bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] sm:w-48"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status | "ALL")}
          >
            <option value="ALL">Todos os status</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM_ATENDIMENTO">Em atendimento</option>
            <option value="AGUARDANDO_USUARIO">Aguardando usuário</option>
            <option value="RESOLVIDO">Resolvido</option>
            <option value="ENCERRADO">Encerrado</option>
          </select>
          <select
            className="h-9 rounded-lg border border-[var(--border)] bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] sm:w-44"
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as Prioridade | "ALL")}
          >
            <option value="ALL">Todas as prioridades</option>
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>
      </section>

      {/* Tabela */}
      <section className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : error ? (
          <div className="p-4">
            <Alert variant="error" title="Erro ao carregar chamados">{error}</Alert>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Ticket className="size-6" />}
            title="Nenhum chamado encontrado"
            description="Tente ajustar os filtros de busca."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--muted)]/60 border-b border-[var(--border)]">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Protocolo</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Título</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 hidden md:table-cell">Solicitante</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 hidden xl:table-cell">Setor</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Prioridade</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 hidden lg:table-cell">Criado em</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--muted)]/20 transition">
                    <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                      {c.protocolo ?? `#${c.id.slice(0, 8)}`}
                    </td>
                    <td className="px-4 py-3 max-w-[360px]">
                      <div className="line-clamp-1 font-medium">{c.titulo}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.criadoPor?.nome ?? "—"}</td>
                    <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">{c.setor?.nome ?? "—"}</td>
                    <td className="px-4 py-3"><TicketStatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <PriorityDot prioridade={c.prioridade} />
                        <span className="text-muted-foreground capitalize">{c.prioridade.toLowerCase()}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/chamados/${c.id}`}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm transition"
                      >
                        Detalhes <ChevronRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
