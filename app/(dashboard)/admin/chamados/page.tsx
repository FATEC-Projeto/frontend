"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search, Filter, LayoutList, LayoutGrid, ChevronRight,
  Tag, User, Building2, Clock, ArrowUpDown
} from "lucide-react";
import { apiFetch } from "../../../../utils/api"; 
import Link from "next/link";

import { cx } from '../../../../utils/cx'
import TicketStatusBadge from "../../../components/shared/TicketStatusBadge";
import PriorityDot from "../../../components/shared/PriorityDot"; 
import NivelBadge from "../../../components/shared/NivelBadge";   
import SetorChip from "../../../components/shared/SetorChip";

/* ===== Tipos ===== */
type Status = "ABERTO" | "EM_ATENDIMENTO" | "AGUARDANDO_USUARIO" | "RESOLVIDO" | "ENCERRADO";
type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
type Nivel = "N1" | "N2" | "N3";

type ChamadoUI = {
  id: string;
  protocolo?: string | null;
  titulo: string;
  criadoEm: string; // ISO
  status: Status;
  prioridade: Prioridade;
  nivel: Nivel;
  solicitante: string;
  responsavel?: string | null;
  setor?: string | null;
};

type ApiChamado = {
  id: string;
  protocolo?: string | null;
  titulo: string;
  descricao?: string | null;
  nivel: Nivel;
  status: Status;
  prioridade: Prioridade;
  criadoEm: string;
  criadoPor?: { nome?: string | null } | null;
  responsavel?: { nome?: string | null } | null;
  setor?: { nome?: string | null } | null;
};

type PageResp = {
  total: number;
  page: number;
  pageSize: number;
  items: ApiChamado[];
};


function toUI(x: ApiChamado): ChamadoUI {
  return {
    id: x.id,
    protocolo: x.protocolo ?? undefined,
    titulo: x.titulo,
    criadoEm: x.criadoEm,
    status: x.status,
    prioridade: x.prioridade,
    nivel: x.nivel,
    solicitante: x.criadoPor?.nome || "—",
    responsavel: x.responsavel?.nome || null,
    setor: x.setor?.nome || null,
  };
}

/* ---- Filtros / Estado ---- */
type ViewMode = "LIST" | "KANBAN";
const STATUS_COLS: Status[] = ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_USUARIO", "RESOLVIDO"];

export default function AdminChamadosPage() {
  const [view, setView] = useState<ViewMode>("LIST");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const [prioridade, setPrioridade] = useState<Prioridade | "ALL">("ALL");
  const [nivel, setNivel] = useState<Nivel | "ALL">("ALL");
  const [setor, setSetor] = useState<string | "ALL">("ALL");
  const [sortDesc, setSortDesc] = useState(true);

  const [loading, setLoading] = useState(true);
  const [dadosApi, setDadosApi] = useState<ChamadoUI[]>([]);
  const [error, setError] = useState<string | null>(null);

  /* Fetch real */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets?include=setor,criadoPor,responsavel&pageSize=20`;
        const res = await apiFetch(url, { cache: "no-store" });
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || `HTTP ${res.status}`);
        }
        const data: PageResp = await res.json();
        const items = (data?.items ?? []).map(toUI);
        if (alive) setDadosApi(items);
      } catch (e: any) {
        if (alive) setError(e?.message || "Falha ao carregar chamados");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const setoresDisponiveis = useMemo(() => {
    const s = new Set(dadosApi.map(c => c.setor).filter(Boolean) as string[]);
    return Array.from(s);
  }, [dadosApi]);

  const dados = useMemo(() => {
    const base = dadosApi.slice();
    let arr = base.filter((c) => {
      const ql = q.trim().toLowerCase();
      const matchQ =
        !ql ||
        c.titulo.toLowerCase().includes(ql) ||
        (c.protocolo ?? "").toLowerCase().includes(ql) ||
        c.solicitante.toLowerCase().includes(ql) ||
        (c.responsavel ?? "").toLowerCase().includes(ql);
      const matchS = status === "ALL" || c.status === status;
      const matchP = prioridade === "ALL" || c.prioridade === prioridade;
      const matchN = nivel === "ALL" || c.nivel === nivel;
      const matchSetor = setor === "ALL" || c.setor === setor;
      return matchQ && matchS && matchP && matchN && matchSetor;
    });
    arr = arr.sort((a, b) =>
      (sortDesc ? +new Date(b.criadoEm) - +new Date(a.criadoEm) : +new Date(a.criadoEm) - +new Date(b.criadoEm))
    );
    return arr;
  }, [dadosApi, q, status, prioridade, nivel, setor, sortDesc]);

  return (
    <div className="space-y-6">
      {/* Toolbar / Filtros */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Esquerda: busca */}
          <div className="relative sm:w-[360px]">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Buscar por protocolo, título, solicitante ou responsável"
              className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Direita: filtros + toggle de visão */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  className="h-10 w-[190px] pl-9 pr-8 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="ALL">Todos os status</option>
                  <option value="ABERTO">Aberto</option>
                  <option value="EM_ATENDIMENTO">Em atendimento</option>
                  <option value="AGUARDANDO_USUARIO">Aguard. usuário</option>
                  <option value="RESOLVIDO">Resolvido</option>
                  <option value="ENCERRADO">Encerrado</option>
                </select>
              </div>

              <select
                className="h-10 w-[160px] px-3 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as any)}
              >
                <option value="ALL">Todas as prioridades</option>
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>

              <select
                className="h-10 w-[120px] px-3 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={nivel}
                onChange={(e) => setNivel(e.target.value as any)}
              >
                <option value="ALL">Nível (todos)</option>
                <option value="N1">N1</option>
                <option value="N2">N2</option>
                <option value="N3">N3</option>
              </select>

              <select
                className="h-10 w-[180px] px-3 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={setor}
                onChange={(e) => setSetor(e.target.value as any)}
              >
                <option value="ALL">Todos os setores</option>
                {setoresDisponiveis.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Toggle visão */}
            <div className="flex items-center gap-1 border border-[var(--border)] rounded-lg p-1">
              <button
                type="button"
                className={cx("h-8 px-3 rounded-md text-sm", view === "LIST" ? "bg-[var(--muted)]" : "hover:bg-[var(--muted)]/70")}
                onClick={() => setView("LIST")}
                title="Lista"
              >
                <LayoutList className="size-4 inline-block mr-1" />
                Lista
              </button>
              <button
                type="button"
                className={cx("h-8 px-3 rounded-md text-sm", view === "KANBAN" ? "bg-[var(--muted)]" : "hover:bg-[var(--muted)]/70")}
                onClick={() => setView("KANBAN")}
                title="Kanban"
              >
                <LayoutGrid className="size-4 inline-block mr-1" />
                Kanban
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-card p-10 text-center text-muted-foreground">
          Carregando chamados...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[var(--border)] bg-card p-10 text-center text-destructive">
          Falha ao carregar: {error}
        </div>
      ) : view === "LIST" ? (
        <Lista dados={dados} sortDesc={sortDesc} setSortDesc={setSortDesc} />
      ) : (
        <Kanban dados={dados} />
      )}
    </div>
  );
}

/* ====================== LISTA ====================== */
function Lista({ dados, sortDesc, setSortDesc }: {
  dados: ChamadoUI[];
  sortDesc: boolean;
  setSortDesc: (v: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--muted)] text-foreground/90">
            <tr>
              <th className="text-left font-medium px-4 py-3">Protocolo</th>
              <th className="text-left font-medium px-4 py-3">Título</th>
              <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Solicitante</th>
              <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">Setor</th>
              <th className="text-left font-medium px-4 py-3">Nível</th>
              <th className="text-left font-medium px-4 py-3">Prioridade</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">
                <button
                  className="inline-flex items-center gap-1 hover:underline"
                  onClick={() => setSortDesc(!sortDesc)}
                  title="Ordenar por criado em"
                >
                  Criado em <ArrowUpDown className="size-3" />
                </button>
              </th>
              <th className="text-right font-medium px-4 py-3">Ação</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 font-medium">{c.protocolo ?? `#${c.id}`}</td>
                <td className="px-4 py-3 max-w-[380px]">
                  <div className="line-clamp-1">{c.titulo}</div>
                  <div className="md:hidden mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <SetorChip nome={c.setor} />
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3" /> {c.responsavel ?? "—"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">{c.solicitante}</td>
                <td className="px-4 py-3 hidden xl:table-cell"><SetorChip nome={c.setor} /></td>
                <td className="px-4 py-3"><NivelBadge nivel={c.nivel} /></td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <PriorityDot prioridade={c.prioridade} />
                    <span>{c.prioridade}</span>
                  </span>
                </td>
                <td className="px-4 py-3"><TicketStatusBadge status={c.status} /></td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {new Date(c.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}{" "}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-1"><Clock className="size-3" /> {new Date(c.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
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
            ))}
            {dados.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum chamado encontrado com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ====================== KANBAN ====================== */
function Kanban({ dados }: { dados: ChamadoUI[] }) {
  const byStatus: Record<Status, ChamadoUI[]> = {
    ABERTO: [], EM_ATENDIMENTO: [], AGUARDANDO_USUARIO: [], RESOLVIDO: [], ENCERRADO: [],
  };
  for (const c of dados) byStatus[c.status]?.push(c);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {STATUS_COLS.map((col) => (
        <div key={col} className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
          <div className="px-3 py-2 bg-[var(--muted)] flex items-center justify-between">
            <div className="text-sm font-semibold flex items-center gap-2">
              <TicketStatusBadge status={col} />
              <span className="text-muted-foreground font-normal">({byStatus[col]?.length ?? 0})</span>
            </div>
          </div>

          <div className="p-3 space-y-3 min-h-[120px]">
            {(byStatus[col] ?? []).map((c) => (
              <CardKanban key={c.id} c={c} />
            ))}
            {(byStatus[col] ?? []).length === 0 && (
              <div className="text-xs text-muted-foreground px-2 py-6 text-center">
                Sem itens neste status.
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardKanban({ c }: { c: ChamadoUI }) {
  return (
    <Link
      href={`/admin/chamados/${c.id}`}
      className="block rounded-lg border border-[var(--border)] bg-background p-3 hover:border-[var(--ring)] transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">
            {c.protocolo ?? `#${c.id}`}
          </div>
          <div className="font-medium leading-tight line-clamp-2">
            {c.titulo}
          </div>
        </div>
        <NivelBadge nivel={c.nivel} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1">
          <Tag className="size-3" /> <strong>{c.prioridade}</strong>
        </span>
        <SetorChip nome={c.setor} />
        <span className="inline-flex items-center gap-1">
          <User className="size-3" /> {c.responsavel ?? "—"}
        </span>
      </div>
    </Link>
  );
}
