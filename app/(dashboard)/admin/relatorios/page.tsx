"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, Filter, Download, RefreshCcw,
  Clock, CheckCircle2, AlertTriangle, BarChart3, PieChart, Loader2,
} from "lucide-react";
import { cx } from '../../../../utils/cx';
import { apiFetch } from '../../../../utils/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/* ===================== Tipos ===================== */
type Status = "ABERTO" | "EM_ATENDIMENTO" | "AGUARDANDO_USUARIO" | "RESOLVIDO" | "ENCERRADO";
type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
type Nivel = "N1" | "N2" | "N3";

type Chamado = {
  id: string;
  protocolo?: string;
  titulo: string;
  criadoEm: string;
  encerradoEm?: string;
  vencimentoSla?: string;
  status: Status;
  prioridade: Prioridade;
  nivel: Nivel;
  setor?: string | null;
  responsavel?: string | null;
};

type StatsData = {
  total: number;
  porStatus: Record<Status, number>;
  porNivel: Record<Nivel, number>;
  porPrioridade: Record<Prioridade, number>;
  porSetor: Array<{ setorId: string; setorNome: string; total: number }>;
  porResponsavel: Array<{ responsavelId: string; responsavelNome: string; total: number }>;
  ttrMedioHoras: number;
  slaMedioDias: number;
  pctNoPrazo: number;
  pctResolvidos: number;
  tendencia7dias: Array<{ data: string; total: number }>;
  atualizadoEm: string;
};

/* ===================== Utils ===================== */
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

  const [q, setQ] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<Status | "ALL">("ALL");
  const [prioridade, setPrioridade] = useState<Prioridade | "ALL">("ALL");
  const [nivel, setNivel] = useState<Nivel | "ALL">("ALL");
  const [setor, setSetor] = useState<string | "ALL">("ALL");
  const [dtIni, setDtIni] = useState<string>("");
  const [dtFim, setDtFim] = useState<string>("");

  const [stats, setStats] = useState<StatsData | null>(null);
  const [tickets, setTickets] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        apiFetch(`${API_BASE}/tickets/stats`),
        apiFetch(`${API_BASE}/tickets?pageSize=100&include=setor,responsavel`),
      ]);

      if (statsRes.ok) {
        const json = await statsRes.json();
        setStats(json);
      }

      if (ticketsRes.ok) {
        const json = await ticketsRes.json();
        const list = Array.isArray(json) ? json : (json.data ?? []);
        setTickets(
          list.map((t: any) => ({
            id: t.id,
            protocolo: t.protocolo,
            titulo: t.titulo ?? t.assunto ?? "—",
            criadoEm: t.criadoEm,
            encerradoEm: t.encerradoEm ?? undefined,
            vencimentoSla: t.vencimentoSla ?? undefined,
            status: t.status,
            prioridade: t.prioridade,
            nivel: t.nivel,
            setor: t.setor?.nome ?? t.setorNome ?? (typeof t.setor === "string" ? t.setor : null),
            responsavel:
              t.responsavel?.nome ??
              t.responsavelNome ??
              (typeof t.responsavel === "string" ? t.responsavel : null),
          }))
        );
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const setoresDisponiveis = useMemo(() => {
    if (!stats) return [];
    return stats.porSetor.map((s) => s.setorNome).sort();
  }, [stats]);

  const dadosFiltrados = useMemo(() => {
    return tickets.filter((c) => {
      const matchQ =
        !q ||
        c.titulo.toLowerCase().includes(q.toLowerCase()) ||
        c.protocolo?.toLowerCase().includes(q.toLowerCase()) ||
        c.responsavel?.toLowerCase().includes(q.toLowerCase()) ||
        c.setor?.toLowerCase().includes(q.toLowerCase());
      const matchS = statusFiltro === "ALL" || c.status === statusFiltro;
      const matchP = prioridade === "ALL" || c.prioridade === prioridade;
      const matchN = nivel === "ALL" || c.nivel === nivel;
      const matchSetor = setor === "ALL" || c.setor === setor;
      const ts = new Date(c.criadoEm).getTime();
      const matchDataIni = !dtIni || ts >= new Date(`${dtIni}T00:00:00`).getTime();
      const matchDataFim = !dtFim || ts <= new Date(`${dtFim}T23:59:59`).getTime();
      return matchQ && matchS && matchP && matchN && matchSetor && matchDataIni && matchDataFim;
    });
  }, [tickets, q, statusFiltro, prioridade, nivel, setor, dtIni, dtFim]);

  const kpis = useMemo(() => {
    if (!stats) return { total: 0, abertos: 0, atendimento: 0, aguardUser: 0, resolvidos: 0, ttrMedio: 0, slaMedioDias: 0, pctNoPrazo: 0, pctResolvidos: 0 };
    return {
      total: stats.total,
      abertos: stats.porStatus.ABERTO ?? 0,
      atendimento: stats.porStatus.EM_ATENDIMENTO ?? 0,
      aguardUser: stats.porStatus.AGUARDANDO_USUARIO ?? 0,
      resolvidos: (stats.porStatus.RESOLVIDO ?? 0) + (stats.porStatus.ENCERRADO ?? 0),
      ttrMedio: stats.ttrMedioHoras ?? 0,
      slaMedioDias: stats.slaMedioDias ?? 0,
      pctNoPrazo: stats.pctNoPrazo ?? 0,
      pctResolvidos: stats.pctResolvidos ?? 0,
    };
  }, [stats]);

  const porSetor = useMemo(() => {
    if (!stats) return [];
    const total = stats.porSetor.reduce((a, b) => a + b.total, 0) || 1;
    return stats.porSetor.map((s) => ({
      setor: s.setorNome,
      qtd: s.total,
      pct: Math.round((s.total / total) * 100),
    }));
  }, [stats]);

  const porNivel = useMemo(() => {
    if (!stats) return [];
    const keys: Nivel[] = ["N1", "N2", "N3"];
    return keys.map((n) => ({ nivel: n, qtd: stats.porNivel[n] ?? 0 }));
  }, [stats]);

  const porPrioridade = useMemo(() => {
    if (!stats) return [];
    const keys: Prioridade[] = ["BAIXA", "MEDIA", "ALTA", "URGENTE"];
    return keys.map((p) => ({ prioridade: p, qtd: stats.porPrioridade[p] ?? 0 }));
  }, [stats]);

  const porTecnico = useMemo(() => {
    if (!stats) return [];
    return stats.porResponsavel
      .map((r) => ({ responsavel: r.responsavelNome, qtd: r.total }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [stats]);

  const slaPorSetor = useMemo(() => {
    const map: Record<string, { total: number; somaTTR: number; comSLA: number; noPrazo: number }> = {};
    for (const d of tickets) {
      const key = d.setor ?? "—";
      map[key] = map[key] || { total: 0, somaTTR: 0, comSLA: 0, noPrazo: 0 };
      map[key].total += 1;
      if (d.encerradoEm && d.criadoEm) {
        const ttr = (new Date(d.encerradoEm).getTime() - new Date(d.criadoEm).getTime()) / 3_600_000;
        map[key].somaTTR += ttr;
      }
      if (d.vencimentoSla && d.encerradoEm) {
        map[key].comSLA += 1;
        if (new Date(d.encerradoEm) <= new Date(d.vencimentoSla)) map[key].noPrazo += 1;
      }
    }
    return Object.entries(map)
      .map(([s, v]) => ({
        setor: s,
        ttrMedio: v.somaTTR && v.total ? +(v.somaTTR / v.total).toFixed(1) : 0,
        pctNoPrazo: v.comSLA ? Math.round(100 * (v.noPrazo / v.comSLA)) : 0,
        total: v.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [tickets]);

  function exportarCSV() {
    if (dadosFiltrados.length === 0) return;
    const rows = dadosFiltrados.map((d) => ({
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
    }));
    toCSV(rows);
  }

  return (
    <div className="space-y-6">
      {/* Barra de status */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {error && <span className="text-destructive">{error}</span>}
        </div>
        {lastUpdated && (
          <span>
            Última atualização: {lastUpdated.toLocaleTimeString("pt-BR")} · atualiza a cada 30s
          </span>
        )}
      </div>

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
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value as any)}
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
            onClick={() => { setLoading(true); fetchData(); }}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
          >
            <RefreshCcw className="size-4" /> Atualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Kpi icon={<BarChart3 className="size-4" />} label="Total" value={kpis.total} loading={loading} />
        <Kpi icon={<AlertTriangle className="size-4" />} label="Abertos" value={kpis.abertos} tone="brand-cyan" loading={loading} />
        <Kpi icon={<Clock className="size-4" />} label="Em atendimento" value={kpis.atendimento} tone="brand-teal" loading={loading} />
        <Kpi icon={<Clock className="size-4" />} label="Aguard. usuário" value={kpis.aguardUser} tone="warning" loading={loading} />
        <Kpi icon={<CheckCircle2 className="size-4" />} label="Resolvidos/Encerr." value={kpis.resolvidos} tone="success" loading={loading} />
        <Kpi icon={<PieChart className="size-4" />} label="% no prazo (SLA)" value={`${kpis.pctNoPrazo}%`} loading={loading} />
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
              rows={porSetor.map((r) => ({ label: r.setor, value: r.qtd, suffix: ` (${r.pct}%)` }))}
              total={porSetor.reduce((a, b) => a + b.qtd, 0)}
            />
          </Card>

          <Card title="Por Nível / Prioridade" className="xl:col-span-5">
            <div className="grid grid-cols-2 gap-4">
              <MiniBar title="Por Nível" rows={porNivel.map((x) => ({ label: x.nivel, value: x.qtd }))} />
              <MiniBar title="Por Prioridade" rows={porPrioridade.map((x) => ({ label: x.prioridade, value: x.qtd }))} />
            </div>
          </Card>

          <Card title="Por Responsável (Top)" className="xl:col-span-12">
            <BarTable
              rows={porTecnico.map((r) => ({ label: r.responsavel, value: r.qtd }))}
              total={porTecnico.reduce((a, b) => a + b.qtd, 0)}
            />
          </Card>
        </section>
      )}

      {tab === "SLA" && (
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <Card title="Tempo médio de resolução (h) por Setor" className="xl:col-span-7">
            <BarTable
              rows={slaPorSetor.map((x) => ({ label: x.setor, value: x.ttrMedio, suffix: " h" }))}
              total={slaPorSetor.reduce((a, b) => a + b.ttrMedio, 0)}
              normalizeByMax
            />
          </Card>

          <Card title="% no prazo (SLA) por Setor" className="xl:col-span-5">
            <MiniBar
              title="No prazo (SLA)"
              rows={slaPorSetor.map((x) => ({ label: x.setor, value: x.pctNoPrazo }))}
              valueSuffix="%"
              clamp100
            />
          </Card>

          <Card title="Tempos médios" className="xl:col-span-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Stat label="TTR médio (h)" value={kpis.ttrMedio ? kpis.ttrMedio.toFixed(1) : "—"} />
              <Stat label="SLA médio (dias)" value={kpis.slaMedioDias ? kpis.slaMedioDias.toFixed(1) : "—"} />
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
                { label: "Aberto", value: kpis.abertos },
                { label: "Em atendimento", value: kpis.atendimento },
                { label: "Aguard. usuário", value: kpis.aguardUser },
                { label: "Resolvido/Encerr.", value: kpis.resolvidos },
              ]}
            />
          </Card>
          <Card title="Backlog por Nível" className="xl:col-span-6">
            <MiniBar rows={porNivel.map((x) => ({ label: x.nivel, value: x.qtd }))} />
          </Card>

          <Card
            title={`Detalhes — ${dadosFiltrados.length} chamado${dadosFiltrados.length !== 1 ? "s" : ""} (com filtros aplicados)`}
            className="xl:col-span-12"
          >
            <DataTable dados={dadosFiltrados} />
          </Card>
        </section>
      )}
    </div>
  );
}

/* ===================== Componentes UI ===================== */
function Kpi({ icon, label, value, tone, loading }: {
  icon: React.ReactNode; label: string; value: number | string;
  tone?: "brand-cyan" | "brand-teal" | "warning" | "success";
  loading?: boolean;
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
          {loading
            ? <div className="h-8 w-16 rounded bg-[var(--muted)] animate-pulse" />
            : <div className="text-2xl font-semibold">{value}</div>
          }
        </div>
        <div className={cx("size-10 rounded-lg grid place-items-center", tone ? bg[tone] : "bg-[var(--muted)]") }>
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
  const max = Math.max(...rows.map((r) => r.value), 1);
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
            {r.suffix && <span className="text-muted-foreground">{r.suffix}</span>}
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
  const max = Math.max(...rows.map((r) => r.value), 1);
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
            </tr>
          </thead>
          <tbody>
            {dados.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 font-medium">{c.protocolo ?? `#${c.id.slice(0, 8)}`}</td>
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
              </tr>
            ))}
            {dados.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
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
