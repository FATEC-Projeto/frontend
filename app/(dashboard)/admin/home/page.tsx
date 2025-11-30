"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Filter,
  Search,
  ChevronRight,
  Ticket,
  User,
  FileChartColumn,
} from "lucide-react";
import MobileSidebarTriggerAdmin from "../_components/MobileSidebarTriggerAdmin";
import { apiFetch } from "../../../../utils/api";

import TicketStatusBadge from "../../../components/shared/TicketStatusBadge";
import PriorityDot from "../../../components/shared/PriorityDot";

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
    } catch (e: any) {
      setError(e?.message || "Falha ao carregar chamados");
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
      <section className="rounded-xl border border-[var(--border)] bg-card mb-6">
        <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Buscar por protocolo, título ou solicitante"
              className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative">
              <Filter className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                className="h-10 w-[220px] pl-9 pr-8 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="ALL">Todos os status</option>
                <option value="ABERTO">Aberto</option>
                <option value="EM_ATENDIMENTO">Em atendimento</option>
                <option value="AGUARDANDO_USUARIO">Aguardando usuário</option>
                <option value="RESOLVIDO">Resolvido</option>
                <option value="ENCERRADO">Encerrado</option>
              </select>
            </div>

            <select
              className="h-10 w-[200px] px-3 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as any)}
            >
              <option value="ALL">Todas as prioridades</option>
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
        </div>
      </section>

      {/* Tabela */}
      <section className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--muted)] text-foreground/90">
              <tr>
                <th className="text-left font-medium px-4 py-3">Protocolo</th>
                <th className="text-left font-medium px-4 py-3">Título</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">
                  Solicitante
                </th>
                <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">
                  Setor
                </th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Prioridade</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">
                  Criado em
                </th>
                <th className="text-right font-medium px-4 py-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Carregando…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-destructive"
                  >
                    Falha ao carregar: {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Nenhum chamado encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-medium">
                      {c.protocolo ?? `#${c.id}`}
                    </td>
                    <td className="px-4 py-3 max-w-[360px]">
                      <div className="line-clamp-1">{c.titulo}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {c.criadoPor?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {c.setor?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <TicketStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <PriorityDot prioridade={c.prioridade} />
                        <span>{c.prioridade}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {new Date(c.criadoEm).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/chamados/${c.id}`}
                        className="inline-flex items-center h-9 px-3 rounded-md hover:bg-[var(--muted)]"
                      >
                        Detalhes <ChevronRight className="size-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
