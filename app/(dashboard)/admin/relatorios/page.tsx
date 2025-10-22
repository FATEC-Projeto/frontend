"use client";

import { useMemo, useState } from "react";
import {
  Search, Filter, Download, RefreshCcw,
  Clock, CheckCircle2, AlertTriangle, BarChart3, PieChart,
} from "lucide-react";

/* ===================== Tipos ===================== */
type Status = "ABERTO" | "EM_ATENDIMENTO" | "AGUARDANDO_USUARIO" | "RESOLVIDO" | "ENCERRADO";
type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
type Nivel = "N1" | "N2" | "N3";

type Chamado = {
  id: string;
  protocolo?: string;
  titulo: string;
  criadoEm: string;        // ISO
  encerradoEm?: string;    // ISO | undefined
  status: Status;
  prioridade: Prioridade;
  nivel: Nivel;
  setor?: string | null;
  responsavel?: string | null;
  slaDias?: number;        // SLA contratado (dias) - opcional
  ttrHoras?: number;       // tempo total de resolução (horas) - opcional
  tfsHoras?: number;       // tempo para primeira resposta (horas) - opcional
  noPrazo?: boolean;       // se respeitou o SLA - opcional
};

/* ===================== MOCK ===================== */
const MOCK: Chamado[] = [
  { id: "1", protocolo: "WF-2025-0101", titulo: "Acesso ao SIGA", criadoEm: "2025-10-18T09:12:00Z", status: "ABERTO", prioridade: "ALTA", nivel: "N1", setor: "TI Acadêmica", responsavel: "Bruno", tfsHoras: 0.8 },
  { id: "2", protocolo: "WF-2025-0102", titulo: "Erro boleto", criadoEm: "2025-10-16T15:38:00Z", status: "AGUARDANDO_USUARIO", prioridade: "MEDIA", nivel: "N2", setor: "Financeiro", responsavel: "Ana", tfsHoras: 1.5 },
  { id: "3", protocolo: "WF-2025-0103", titulo: "Histórico escolar", criadoEm: "2025-10-14T11:05:00Z", status: "EM_ATENDIMENTO", prioridade: "BAIXA", nivel: "N1", setor: "Secretaria", responsavel: "Diego", tfsHoras: 3.2 },
  { id: "4", protocolo: "WF-2025-0104", titulo: "SSO OIDC", criadoEm: "2025-10-13T08:21:00Z", status: "RESOLVIDO", prioridade: "URGENTE", nivel: "N3", setor: "TI Acadêmica", responsavel: "Carla", encerradoEm: "2025-10-14T09:00:00Z", ttrHoras: 24.7, tfsHoras: 0.6, slaDias: 3, noPrazo: true },
  { id: "5", protocolo: "WF-2025-0105", titulo: "Alteração matrícula", criadoEm: "2025-10-12T08:21:00Z", status: "RESOLVIDO", prioridade: "MEDIA", nivel: "N2", setor: "Secretaria", responsavel: "Diego", encerradoEm: "2025-10-13T10:00:00Z", ttrHoras: 28.0, tfsHoras: 1.1, slaDias: 2, noPrazo: false },
  { id: "6", protocolo: "WF-2025-0106", titulo: "Impressão carteirinha", criadoEm: "2025-10-12T12:00:00Z", status: "ENCERRADO", prioridade: "BAIXA", nivel: "N1", setor: "Secretaria", responsavel: "Luiza", encerradoEm: "2025-10-12T16:00:00Z", ttrHoras: 4, tfsHoras: 0.4, slaDias: 5, noPrazo: true },
  { id: "7", protocolo: "WF-2025-0107", titulo: "Falha integração ERP", criadoEm: "2025-10-11T09:00:00Z", status: "EM_ATENDIMENTO", prioridade: "ALTA", nivel: "N3", setor: "Financeiro", responsavel: "Ana", tfsHoras: 2.0 },
];

/* ===================== Utils ===================== */
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function parseISO(s: string) { return new Date(s).getTime(); }

function toCSV(rows: Array<Record<string, any>>) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (v: any) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "relatorio_chamados.csv"; a.click();
  URL.revokeObjectURL(url);
}

/* ===================== Página ===================== */
type Tab = "OVERVIEW" | "SLA" | "OPS";

export default function RelatoriosPage() {
  const [tab, setTab] = useState<Tab>("OVERVIEW");

  // filtros
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const [prioridade, setPrioridade] = useState<Prioridade | "ALL">("ALL");
  const [nivel, setNivel] = useState<Nivel | "ALL">("ALL");
  const [setor, setSetor] = useState<string | "ALL">("ALL");
  const [dtIni, setDtIni] = useState<string>(""); // yyyy-mm-dd
  const [dtFim, setDtFim] = useState<string>(""); // yyyy-mm-dd

  const setoresDisponiveis = useMemo(() => {
    const s = new Set(MOCK.map(c => c.setor).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, []);

  const dados = useMemo(() => {
    return MOCK.filter((c) => {
      const matchQ =
        !q ||
        c.titulo.toLowerCase().includes(q.toLowerCase()) ||
        c.protocolo?.toLowerCase().includes(q.toLowerCase()) ||
        c.responsavel?.toLowerCase().includes(q.toLowerCase()) ||
        c.setor?.toLowerCase().includes(q.toLowerCase());
      const matchS = status === "ALL" || c.status === status;
      const matchP = prioridade === "ALL" || c.prioridade === prioridade;
      const matchN = nivel === "ALL" || c.nivel === nivel;
      const matchSetor = setor === "ALL" || c.setor === setor;

      const matchDataIni = !dtIni || parseISO(c.criadoEm) >= parseISO(`${dtIni}T00:00:00`);
      const matchDataFim = !dtFim || parseISO(c.criadoEm) <= parseISO(`${dtFim}T23:59:59`);

      return matchQ && matchS && matchP && matchN && matchSetor && matchDataIni && matchDataFim;
    });
  }, [q, status, prioridade, nivel, setor, dtIni, dtFim]);

  /* ===== KPIs ===== */
  const kpis = useMemo(() => {
    const total = dados.length;
    const abertos = dados.filter(d => d.status === "ABERTO").length;
    const atendimento = dados.filter(d => d.status === "EM_ATENDIMENTO").length;
    const aguardUser = dados.filter(d => d.status === "AGUARDANDO_USUARIO").length;
    const resolvidos = dados.filter(d => d.status === "RESOLVIDO" || d.status === "ENCERRADO").length;

    const resolvidosComTTR = dados.filter(d => d.ttrHoras != null);
    const ttrMedio = resolvidosComTTR.length
      ? (resolvidosComTTR.reduce((acc, d) => acc + (d.ttrHoras ?? 0), 0) / resolvidosComTTR.length)
      : 0;

    const tfsComValor = dados.filter(d => d.tfsHoras != null);
    const tfsMedio = tfsComValor.length
      ? (tfsComValor.reduce((acc, d) => acc + (d.tfsHoras ?? 0), 0) / tfsComValor.length)
      : 0;

    const temSLA = dados.filter(d => d.noPrazo != null);
    const pctNoPrazo = temSLA.length
      ? Math.round(100 * (temSLA.filter(d => d.noPrazo).length / temSLA.length))
      : 0;

    return { total, abertos, atendimento, aguardUser, resolvidos, ttrMedio, tfsMedio, pctNoPrazo };
  }, [dados]);

  /* ===== Agregados ===== */
  const porSetor = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of dados) {
      const key = d.setor ?? "—";
      map[key] = (map[key] ?? 0) + 1;
    }
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(map).map(([setor, qtd]) => ({ setor, qtd, pct: Math.round((qtd / total) * 100) }));
  }, [dados]);

  const porNivel = useMemo(() => {
    const keys: Nivel[] = ["N1", "N2", "N3"];
    return keys.map(n => ({ nivel: n, qtd: dados.filter(d => d.nivel === n).length }));
  }, [dados]);

  const porPrioridade = useMemo(() => {
    const keys: Prioridade[] = ["BAIXA", "MEDIA", "ALTA", "URGENTE"];
    return keys.map(p => ({ prioridade: p, qtd: dados.filter(d => d.prioridade === p).length }));
  }, [dados]);

  const porTecnico = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of dados) {
      const key = d.responsavel ?? "—";
      map[key] = (map[key] ?? 0) + 1;
    }
    return Object.entries(map).map(([responsavel, qtd]) => ({ responsavel, qtd }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [dados]);

  const slaPorSetor = useMemo(() => {
    // média de TTR por setor + % no prazo
    const map: Record<string, { total: number; somaTTR: number; comSLA: number; noPrazo: number }> = {};
    for (const d of dados) {
      const key = d.setor ?? "—";
      map[key] = map[key] || { total: 0, somaTTR: 0, comSLA: 0, noPrazo: 0 };
      map[key].total += 1;
      if (d.ttrHoras != null) map[key].somaTTR += d.ttrHoras;
      if (d.noPrazo != null) {
        map[key].comSLA += 1;
        if (d.noPrazo) map[key].noPrazo += 1;
      }
    }
    return Object.entries(map).map(([setor, v]) => ({
      setor,
      ttrMedio: v.somaTTR && v.total ? +(v.somaTTR / v.total).toFixed(1) : 0,
      pctNoPrazo: v.comSLA ? Math.round(100 * (v.noPrazo / v.comSLA)) : 0,
      total: v.total,
    })).sort((a, b) => b.total - a.total);
  }, [dados]);

  function exportarCSV() {
    if (dados.length === 0) return;
    const rows = dados.map(d => ({
      id: d.id,
      protocolo: d.protocolo ?? "",
      titulo: d.titulo,
      criadoEm: d.criadoEm,
      encerradoEm: d.encerradoEm ?? "",
      status: d.status,
      prioridade: d.prioridade,
      nivel: d.nivel,
      setor: d.setor ?? "",
      responsavel: d.responsavel ?? "",
      ttrHoras: d.ttrHoras ?? "",
      tfsHoras: d.tfsHoras ?? "",
      noPrazo: d.noPrazo ?? "",
    }));
    toCSV(rows);
  }

  return (
    <div className="space-y-6">
      {/* Toolbar de filtros */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Buscar por protocolo, título, setor, responsável"
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex gap-2">
              <input type="date" className="h-10 w-full rounded-lg border border-[var(--border)] bg-background px-3" value={dtIni} onChange={(e) => setDtIni(e.target.value)} />
              <input type="date" className="h-10 w-full rounded-lg border border-[var(--border)] bg-background px-3" value={dtFim} onChange={(e) => setDtFim(e.target.value)} />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="relative">
              <Filter className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                className="h-10 w-full pl-9 pr-8 rounded-lg border border-[var(--border)] bg-background"
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
          </div>

          <div className="lg:col-span-2">
            <select
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-background px-3"
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

          <div className="lg:col-span-1">
            <select
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-background px-3"
              value={nivel}
              onChange={(e) => setNivel(e.target.value as any)}
            >
              <option value="ALL">Nível</option>
              <option value="N1">N1</option>
              <option value="N2">N2</option>
              <option value="N3">N3</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-background px-3"
              value={setor}
              onChange={(e) => setSetor(e.target.value as any)}
            >
              <option value="ALL">Todos os setores</option>
              {setoresDisponiveis.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={exportarCSV}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
          >
            <Download className="size-4" /> Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => {/* poderia reconsultar backend */}}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
          >
            <RefreshCcw className="size-4" /> Atualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Kpi icon={<BarChart3 className="size-4" />} label="Total" value={dados.length} />
        <Kpi icon={<AlertTriangle className="size-4" />} label="Abertos" value={kpis.abertos} tone="brand-cyan" />
        <Kpi icon={<Clock className="size-4" />} label="Em atendimento" value={kpis.atendimento} tone="brand-teal" />
        <Kpi icon={<Clock className="size-4" />} label="Aguard. usuário" value={kpis.aguardUser} tone="warning" />
        <Kpi icon={<CheckCircle2 className="size-4" />} label="Resolvidos/Encerr." value={kpis.resolvidos} tone="success" />
        <Kpi icon={<PieChart className="size-4" />} label="% no prazo (SLA)" value={`${kpis.pctNoPrazo}%`} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border border-[var(--border)] rounded-lg p-1 w-fit">
        <TabBtn active={tab === "OVERVIEW"} onClick={() => setTab("OVERVIEW")} label="Visão Geral" />
        <TabBtn active={tab === "SLA"} onClick={() => setTab("SLA")} label="SLA" />
        <TabBtn active={tab === "OPS"} onClick={() => setTab("OPS")} label="Operacional" />
      </div>

      {tab === "OVERVIEW" && (
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <Card title="Distribuição por Setor" className="xl:col-span-7">
            <BarTable
              rows={porSetor.map(r => ({ label: r.setor, value: r.qtd, suffix: ` (${r.pct}%)` }))}
              total={porSetor.reduce((a, b) => a + b.qtd, 0)}
            />
          </Card>

          <Card title="Por Nível / Prioridade" className="xl:col-span-5">
            <div className="grid grid-cols-2 gap-4">
              <MiniBar title="Por Nível" rows={porNivel.map(x => ({ label: x.nivel, value: x.qtd }))} />
              <MiniBar title="Por Prioridade" rows={porPrioridade.map(x => ({ label: x.prioridade, value: x.qtd }))} />
            </div>
          </Card>

          <Card title="Por Responsável (Top)" className="xl:col-span-12">
            <BarTable
              rows={porTecnico.map(r => ({ label: r.responsavel, value: r.qtd }))}
              total={porTecnico.reduce((a, b) => a + b.qtd, 0)}
            />
          </Card>
        </section>
      )}

      {tab === "SLA" && (
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <Card title="Tempo médio de resolução (h) por Setor" className="xl:col-span-7">
            <BarTable
              rows={slaPorSetor.map(x => ({ label: x.setor, value: x.ttrMedio, suffix: " h" }))}
              total={slaPorSetor.reduce((a, b) => a + b.ttrMedio, 0)}
              normalizeByMax
            />
          </Card>

          <Card title="% no prazo (SLA) por Setor" className="xl:col-span-5">
            <MiniBar
              title="No prazo (SLA)"
              rows={slaPorSetor.map(x => ({ label: x.setor, value: x.pctNoPrazo }))}
              valueSuffix="%"
              clamp100
            />
          </Card>

          <Card title="Tempos médios" className="xl:col-span-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Stat label="TTR médio (h)" value={kpis.ttrMedio ? kpis.ttrMedio.toFixed(1) : "—"} />
              <Stat label="TFS médio (h)" value={kpis.tfsMedio ? kpis.tfsMedio.toFixed(1) : "—"} />
              <Stat label="% no prazo (SLA)" value={`${kpis.pctNoPrazo}%`} />
            </div>
          </Card>
        </section>
      )}

      {tab === "OPS" && (
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <Card title="Fila atual por status" className="xl:col-span-6">
            <MiniBar
              rows={[
                { label: "Aberto", value: dados.filter(d => d.status === "ABERTO").length },
                { label: "Em atendimento", value: dados.filter(d => d.status === "EM_ATENDIMENTO").length },
                { label: "Aguard. usuário", value: dados.filter(d => d.status === "AGUARDANDO_USUARIO").length },
                { label: "Resolvido/Encerr.", value: dados.filter(d => d.status === "RESOLVIDO" || d.status === "ENCERRADO").length },
              ]}
            />
          </Card>
          <Card title="Backlog por Nível" className="xl:col-span-6">
            <MiniBar
              rows={[
                { label: "N1", value: dados.filter(d => d.nivel === "N1" && d.status !== "RESOLVIDO" && d.status !== "ENCERRADO").length },
                { label: "N2", value: dados.filter(d => d.nivel === "N2" && d.status !== "RESOLVIDO" && d.status !== "ENCERRADO").length },
                { label: "N3", value: dados.filter(d => d.nivel === "N3" && d.status !== "RESOLVIDO" && d.status !== "ENCERRADO").length },
              ]}
            />
          </Card>

          <Card title="Detalhes (dados filtrados)" className="xl:col-span-12">
            <DataTable dados={dados} />
          </Card>
        </section>
      )}
    </div>
  );
}

/* ===================== Componentes UI ===================== */
function Kpi({ icon, label, value, tone }: {
  icon: React.ReactNode; label: string; value: number | string;
  tone?: "brand-cyan" | "brand-teal" | "warning" | "success";
}) {
  const bg: Record<string, string> = {
    "brand-cyan": "bg-[var(--brand-cyan)]/10",
    "brand-teal": "bg-[var(--brand-teal)]/10",
    warning: "bg-[var(--warning)]/10",
    success: "bg-[var(--success)]/10",
  };
  const fg: Record<string, string> = {
    "brand-cyan": "text-[var(--brand-cyan)]",
    "brand-teal": "text-[var(--brand-teal)]",
    warning: "text-[var(--warning)]",
    success: "text-[var(--success)]",
  };
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
        <div className={cx("size-10 rounded-lg grid place-items-center", tone ? bg[tone] : "bg-[var(--muted)]")}>
          <div className={cx("opacity-90", tone ? fg[tone] : "text-muted-foreground")}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      className={cx("h-8 px-3 rounded-md text-sm", active ? "bg-[var(--muted)]" : "hover:bg-[var(--muted)]/70")}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function Card({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cx("rounded-xl border border-[var(--border)] bg-card p-4", className)}>
      <div className="text-sm font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}

function Bar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2 w-full rounded bg-[var(--muted)]">
      <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

function BarTable({ rows, total, normalizeByMax = false }: {
  rows: Array<{ label: string; value: number; suffix?: string }>;
  total: number;
  normalizeByMax?: boolean;
}) {
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-12 items-center gap-2">
          <div className="col-span-5 truncate">{r.label}</div>
          <div className="col-span-5">
            <Bar value={normalizeByMax ? r.value : (total ? (r.value / total) * 100 : 0)} max={normalizeByMax ? max : 100} />
          </div>
          <div className="col-span-2 text-right text-sm">
            <span className="font-medium">{r.value}</span>
            {r.suffix && <span className="text-muted-foreground"> {r.suffix}</span>}
          </div>
        </div>
      ))}
      {rows.length === 0 && (
        <div className="text-sm text-muted-foreground py-8 text-center">Sem dados para o período/filtros.</div>
      )}
    </div>
  );
}

function MiniBar({ title, rows, valueSuffix = "", clamp100 = false }: {
  title?: string;
  rows: Array<{ label: string; value: number }>;
  valueSuffix?: string;
  clamp100?: boolean;
}) {
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <div>
      {title && <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{title}</div>}
      <div className="space-y-3">
        {rows.map((r) => {
          const pct = clamp100 ? Math.min(100, r.value) : (max ? (r.value / max) * 100 : 0);
          return (
            <div key={r.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{r.label}</span>
                <span className="ml-2 font-medium">{r.value}{valueSuffix}</span>
              </div>
              <div className="h-2 w-full rounded bg-[var(--muted)]">
                <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="text-sm text-muted-foreground py-8 text-center">Sem dados.</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-background p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function DataTable({ dados }: { dados: Chamado[] }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--muted)] text-foreground/90">
            <tr>
              <th className="text-left font-medium px-4 py-3">Protocolo</th>
              <th className="text-left font-medium px-4 py-3">Título</th>
              <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Setor</th>
              <th className="text-left font-medium px-4 py-3">Nível</th>
              <th className="text-left font-medium px-4 py-3">Prioridade</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Resp.</th>
              <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Criado em</th>
              <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Encerrado em</th>
              <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">TFS (h)</th>
              <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">TTR (h)</th>
              <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">SLA</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 font-medium">{c.protocolo ?? `#${c.id}`}</td>
                <td className="px-4 py-3 max-w-[380px]"><div className="line-clamp-1">{c.titulo}</div></td>
                <td className="px-4 py-3 hidden md:table-cell">{c.setor ?? "—"}</td>
                <td className="px-4 py-3">{c.nivel}</td>
                <td className="px-4 py-3">{c.prioridade}</td>
                <td className="px-4 py-3">{c.status}</td>
                <td className="px-4 py-3 hidden lg:table-cell">{c.responsavel ?? "—"}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {new Date(c.criadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {c.encerradoEm
                    ? new Date(c.encerradoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </td>
                <td className="px-4 py-3 hidden xl:table-cell">{c.tfsHoras ?? "—"}</td>
                <td className="px-4 py-3 hidden xl:table-cell">{c.ttrHoras ?? "—"}</td>
                <td className="px-4 py-3 hidden xl:table-cell">
                  {c.noPrazo == null ? "—" : c.noPrazo ? "No prazo" : "Fora do prazo"}
                </td>
              </tr>
            ))}
            {dados.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">
                  Sem dados com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
