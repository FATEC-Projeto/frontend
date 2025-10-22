"use client";

import { useMemo, useState } from "react";
import {
  Search, Filter, LayoutList, LayoutGrid, ChevronRight,
  Tag, User, Building2, Clock, ArrowUpDown
} from "lucide-react";

type Status = "ABERTO" | "EM_ATENDIMENTO" | "AGUARDANDO_USUARIO" | "RESOLVIDO" | "ENCERRADO";
type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
type Nivel = "N1" | "N2" | "N3";

type Chamado = {
  id: string;
  protocolo?: string;
  titulo: string;
  criadoEm: string; // ISO
  status: Status;
  prioridade: Prioridade;
  nivel: Nivel;
  solicitante: string;
  responsavel?: string | null;
  setor?: string | null;
};

const MOCK: Chamado[] = [
  { id: "1", protocolo: "WF-2025-0101", titulo: "Acesso bloqueado ao SIGA", criadoEm: "2025-10-18T09:12:00Z", status: "ABERTO", prioridade: "ALTA", nivel: "N1", solicitante: "João Silva", responsavel: null, setor: "TI Acadêmica" },
  { id: "2", protocolo: "WF-2025-0102", titulo: "Erro emissão de boleto", criadoEm: "2025-10-16T15:38:00Z", status: "AGUARDANDO_USUARIO", prioridade: "MEDIA", nivel: "N2", solicitante: "Maria Souza", responsavel: "Ana", setor: "Financeiro" },
  { id: "3", protocolo: "WF-2025-0103", titulo: "Solicitação histórico escolar", criadoEm: "2025-10-14T11:05:00Z", status: "EM_ATENDIMENTO", prioridade: "BAIXA", nivel: "N1", solicitante: "Carlos Lima", responsavel: "Bruno", setor: "Secretaria" },
  { id: "4", protocolo: "WF-2025-0104", titulo: "Integração SSO — falha OIDC", criadoEm: "2025-10-13T08:21:00Z", status: "EM_ATENDIMENTO", prioridade: "URGENTE", nivel: "N3", solicitante: "Equipe Infra", responsavel: "Carla", setor: "TI Acadêmica" },
  { id: "5", protocolo: "WF-2025-0105", titulo: "Alteração de matrícula", criadoEm: "2025-10-12T08:21:00Z", status: "RESOLVIDO", prioridade: "MEDIA", nivel: "N2", solicitante: "Ana Pereira", responsavel: "Diego", setor: "Secretaria" },
];

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* Badges / Chips */
function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string }> = {
    ABERTO: { label: "Aberto", cls: "bg-[var(--brand-cyan)]/12 text-[var(--brand-cyan)] border-[var(--brand-cyan)]/30" },
    EM_ATENDIMENTO: { label: "Em atendimento", cls: "bg-[var(--brand-teal)]/12 text-[var(--brand-teal)] border-[var(--brand-teal)]/30" },
    AGUARDANDO_USUARIO: { label: "Aguard. usuário", cls: "bg-[var(--warning)]/12 text-[var(--warning)] border-[var(--warning)]/30" },
    RESOLVIDO: { label: "Resolvido", cls: "bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/30" },
    ENCERRADO: { label: "Encerrado", cls: "bg-[var(--muted)] text-muted-foreground border-[var(--border)]" },
  };
  const v = map[status];
  return <span className={cx("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border", v.cls)}>{v.label}</span>;
}
function PrioridadeDot({ p }: { p: Prioridade }) {
  const map: Record<Prioridade, string> = {
    BAIXA: "bg-[var(--muted-foreground)]", MEDIA: "bg-[var(--brand-cyan)]",
    ALTA: "bg-[var(--brand-teal)]", URGENTE: "bg-[var(--brand-red)]",
  };
  return <span className={cx("inline-block size-2 rounded-full", map[p])} />;
}
function NivelBadge({ n }: { n: Nivel }) {
  const map: Record<Nivel, string> = {
    N1: "bg-blue-500/12 text-blue-600 border-blue-500/30",
    N2: "bg-purple-500/12 text-purple-600 border-purple-500/30",
    N3: "bg-rose-500/12 text-rose-600 border-rose-500/30",
  };
  return <span className={cx("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border", map[n])}>{n}</span>;
}
function SetorChip({ s }: { s?: string | null }) {
  if (!s) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-background px-2 py-0.5 text-xs">
      <Building2 className="size-3" /> {s}
    </span>
  );
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

  const setoresDisponiveis = useMemo(() => {
    const s = new Set(MOCK.map(c => c.setor).filter(Boolean) as string[]);
    return Array.from(s);
  }, []);

  const dados = useMemo(() => {
    let arr = MOCK.filter((c) => {
      const matchQ =
        !q ||
        c.titulo.toLowerCase().includes(q.toLowerCase()) ||
        c.protocolo?.toLowerCase().includes(q.toLowerCase()) ||
        c.solicitante.toLowerCase().includes(q.toLowerCase());
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
  }, [q, status, prioridade, nivel, setor, sortDesc]);

  return (
    <div className="space-y-6">
      {/* Toolbar / Filtros */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Esquerda: busca */}
          <div className="relative sm:w-[360px]">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Buscar por protocolo, título ou solicitante"
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

      {view === "LIST" ? <Lista dados={dados} sortDesc={sortDesc} setSortDesc={setSortDesc} /> : <Kanban dados={dados} />}
    </div>
  );
}

/* ====================== LISTA ====================== */
function Lista({ dados, sortDesc, setSortDesc }: {
  dados: Chamado[];
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
                    <SetorChip s={c.setor} />
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3" /> {c.responsavel ?? "—"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">{c.solicitante}</td>
                <td className="px-4 py-3 hidden xl:table-cell"><SetorChip s={c.setor} /></td>
                <td className="px-4 py-3"><NivelBadge n={c.nivel} /></td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <PrioridadeDot p={c.prioridade} />
                    <span>{c.prioridade}</span>
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {new Date(c.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}{" "}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-1"><Clock className="size-3" /> {new Date(c.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="inline-flex items-center h-9 px-3 rounded-md hover:bg-[var(--muted)]">
                    Detalhes <ChevronRight className="size-4 ml-1" />
                  </button>
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
function Kanban({ dados }: { dados: Chamado[] }) {
  // agrupa por status nas colunas
  const byStatus: Record<Status, Chamado[]> = {
    ABERTO: [], EM_ATENDIMENTO: [], AGUARDANDO_USUARIO: [], RESOLVIDO: [], ENCERRADO: [],
  };
  for (const c of dados) byStatus[c.status]?.push(c);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {STATUS_COLS.map((col) => (
        <div key={col} className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
          <div className="px-3 py-2 bg-[var(--muted)] flex items-center justify-between">
            <div className="text-sm font-semibold flex items-center gap-2">
              <StatusBadge status={col} />
              <span className="text-muted-foreground font-normal">({byStatus[col]?.length ?? 0})</span>
            </div>
            {/* Dica: você pode colocar um botão “+ Novo” aqui por coluna, se fizer sentido */}
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

function CardKanban({ c }: { c: Chamado }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-background p-3 hover:border-[var(--ring)] transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{c.protocolo ?? `#${c.id}`}</div>
          <div className="font-medium leading-tight line-clamp-2">{c.titulo}</div>
        </div>
        <NivelBadge n={c.nivel} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1">
          <Tag className="size-3" /> <strong>{c.prioridade}</strong>
        </span>
        <SetorChip s={c.setor} />
        <span className="inline-flex items-center gap-1">
          <User className="size-3" /> {c.responsavel ?? "—"}
        </span>
      </div>
    </div>
  );
}
