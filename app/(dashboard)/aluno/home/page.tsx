"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, ReactNode } from "react";
import {
  Ticket,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquareText,
  Paperclip,
  ChevronRight,
} from "lucide-react";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";

/* ------------------------- TIPOS ------------------------- */
type Status = "ABERTO" | "EM_ATENDIMENTO" | "AGUARDANDO_USUARIO" | "RESOLVIDO" | "ENCERRADO";
type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

type Chamado = {
  id: string;
  protocolo?: string;
  titulo: string;
  criadoEm: string;
  status: Status;
  prioridade: Prioridade;
  setor?: string;
  precisaAcaoDoAluno?: boolean;
  mensagensNaoLidas?: number;
};

/* ------------------------- UTILS ------------------------- */
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* ------------------------- MOCK (substituir por fetch do backend) ------------------------- */
const MEUS_CHAMADOS: Chamado[] = [
  {
    id: "11",
    protocolo: "WF-2025-0112",
    titulo: "Dificuldade para emitir boleto de rematrícula",
    criadoEm: "2025-10-17T13:42:00Z",
    status: "AGUARDANDO_USUARIO",
    prioridade: "MEDIA",
    setor: "Financeiro",
    precisaAcaoDoAluno: true,
    mensagensNaoLidas: 2,
  },
  {
    id: "12",
    protocolo: "WF-2025-0111",
    titulo: "Solicitação de revisão de nota – Estruturas de Dados",
    criadoEm: "2025-10-15T09:28:00Z",
    status: "EM_ATENDIMENTO",
    prioridade: "BAIXA",
    setor: "Secretaria",
    mensagensNaoLidas: 1,
  },
  {
    id: "13",
    protocolo: "WF-2025-0100",
    titulo: "Liberação de histórico parcial para transferência",
    criadoEm: "2025-10-10T08:03:00Z",
    status: "ABERTO",
    prioridade: "ALTA",
    setor: "Secretaria",
  },
  {
    id: "14",
    protocolo: "WF-2025-0087",
    titulo: "Atualização de email educacional",
    criadoEm: "2025-10-02T16:50:00Z",
    status: "RESOLVIDO",
    prioridade: "BAIXA",
    setor: "TI Acadêmica",
  },
];

/* ------------------------- BADGES ------------------------- */
function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string }> = {
    ABERTO: {
      label: "Aberto",
      cls: "bg-[var(--brand-cyan)]/12 text-[var(--brand-cyan)] border-[var(--brand-cyan)]/30",
    },
    EM_ATENDIMENTO: {
      label: "Em atendimento",
      cls: "bg-[var(--brand-teal)]/12 text-[var(--brand-teal)] border-[var(--brand-teal)]/30",
    },
    AGUARDANDO_USUARIO: {
      label: "Aguardando você",
      cls: "bg-[var(--warning)]/12 text-[var(--warning)] border-[var(--warning)]/30",
    },
    RESOLVIDO: {
      label: "Resolvido",
      cls: "bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/30",
    },
    ENCERRADO: {
      label: "Encerrado",
      cls: "bg-[var(--muted)] text-muted-foreground border-[var(--border)]",
    },
  };
  const v = map[status];
  return (
    <span className={cx("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border", v.cls)}>
      {v.label}
    </span>
  );
}

function PrioridadeDot({ p }: { p: Prioridade }) {
  const map: Record<Prioridade, string> = {
    BAIXA: "bg-[var(--muted-foreground)]",
    MEDIA: "bg-[var(--brand-cyan)]",
    ALTA: "bg-[var(--brand-teal)]",
    URGENTE: "bg-[var(--brand-red)]",
  };
  return <span className={cx("inline-block size-2 rounded-full", map[p])} />;
}

/* ------------------------- KPI ------------------------- */
function Kpi({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  tone?: "brand-cyan" | "brand-teal" | "warning" | "success";
  hint?: string;
}) {
  const bgMap: Record<string, string> = {
    "brand-cyan": "bg-[var(--brand-cyan)]/10",
    "brand-teal": "bg-[var(--brand-teal)]/10",
    warning: "bg-[var(--warning)]/10",
    success: "bg-[var(--success)]/10",
  };
  const textMap: Record<string, string> = {
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
          {hint && <div className="text-xs text-muted-foreground/80">{hint}</div>}
        </div>
        <div className={cx("size-10 rounded-lg grid place-items-center", tone ? bgMap[tone] : "bg-[var(--muted)]")}>
          <div className={cx("opacity-90", tone ? textMap[tone] : "text-muted-foreground")}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- BANNER: Aguardando Você ------------------------- */
function BannerAguardandoVocê({ count, onClickFilter }: { count: number; onClickFilter: () => void }) {
  if (count === 0) return null;
  return (
    <div className="mb-4 rounded-xl border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 text-[var(--warning)] mt-0.5" />
          <div>
            <div className="font-medium">Você tem {count} chamado(s) aguardando sua ação.</div>
            <div className="text-sm text-muted-foreground">Envie documentos, responda mensagens ou conclua a tarefa.</div>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center h-9 px-3 rounded-md border border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10"
          onClick={onClickFilter}
        >
          Filtrar por “Aguardando você”
        </button>
      </div>
    </div>
  );
}

/* ------------------------- AÇÕES POR CHAMADO ------------------------- */
function AcoesChamado({ c, compact }: { c: Chamado; compact?: boolean }) {
  const baseBtn =
    "inline-flex items-center h-9 px-3 rounded-md border border-[var(--border)] bg-background hover:bg-[var(--muted)]";

  const podeResponder = ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_USUARIO"].includes(c.status);
  const precisaAnexo = c.precisaAcaoDoAluno === true;

  return (
    <div className={cx("flex gap-2 justify-end", compact && "justify-start")}>
      <Link href={`/aluno/chamados/${c.id}`} className={baseBtn} aria-label={`Detalhes do chamado ${c.protocolo ?? c.id}`}>
        Detalhes <ChevronRight className="size-4 ml-1" />
      </Link>

      {podeResponder && (
        <Link
          href={`/aluno/chamados/${c.id}#responder`}
          className={cx(baseBtn, "text-[var(--brand-teal)] border-[var(--brand-teal)]/40")}
        >
          Responder
        </Link>
      )}

      {precisaAnexo && (
        <Link
          href={`/aluno/chamados/${c.id}#anexos`}
          className={cx(baseBtn, "border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10")}
        >
          <Paperclip className="size-4 mr-1" /> Enviar arquivo
        </Link>
      )}
    </div>
  );
}

/* ------------------------- PÁGINA ------------------------- */
export default function AlunoHomePage() {
  const [alunoNome, setAlunoNome] = useState<string>("Olá 👋");

  useEffect(() => {
    async function fetchUsuario() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data?.nome) {
          const primeiroNome = data.nome.split(" ")[0];
          setAlunoNome(`Olá, ${primeiroNome} 👋`);
        } else {
          setAlunoNome("Olá 👋");
        }
      } catch {
        setAlunoNome("Olá 👋");
      }
    }
    fetchUsuario();
  }, []);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const [prioridade, setPrioridade] = useState<Prioridade | "ALL">("ALL");

  const dados = useMemo(() => {
    return MEUS_CHAMADOS.filter((c) => {
      const matchQ =
        !q ||
        c.titulo.toLowerCase().includes(q.toLowerCase()) ||
        c.protocolo?.toLowerCase().includes(q.toLowerCase());
      const matchS = status === "ALL" || c.status === status;
      const matchP = prioridade === "ALL" || c.prioridade === prioridade;
      return matchQ && matchS && matchP;
    });
  }, [q, status, prioridade]);

  const kpi = useMemo(() => {
    const abertos = MEUS_CHAMADOS.filter((d) => ["ABERTO", "EM_ATENDIMENTO"].includes(d.status)).length;
    const aguardandoEu = MEUS_CHAMADOS.filter((d) => d.status === "AGUARDANDO_USUARIO").length;
    const emAtendimento = MEUS_CHAMADOS.filter((d) => d.status === "EM_ATENDIMENTO").length;
    const resolvidos = MEUS_CHAMADOS.filter((d) => d.status === "RESOLVIDO").length;
    return { abertos, aguardandoEu, emAtendimento, resolvidos };
  }, []);

  const aguardandoCount = dados.filter((d) => d.status === "AGUARDANDO_USUARIO").length;

  return (
    <>
      {/* Topbar (igual à de chamados) */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-grotesk text-2xl sm:text-3xl font-semibold tracking-tight">{alunoNome}</h1>
          <p className="text-muted-foreground">Acompanhe seus chamados e ações pendentes.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <div className="text-sm font-medium">Aluno(a)</div>
            <div className="text-xs text-muted-foreground">aluno@fatec.sp.gov.br</div>
          </div>
          <MobileSidebarTriggerAluno />
        </div>
      </div>

      {/* Banner aguardando */}
      <BannerAguardandoVocê count={aguardandoCount} onClickFilter={() => setStatus("AGUARDANDO_USUARIO")} />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi icon={<Ticket className="size-4" />} label="Meus abertos" value={kpi.abertos} tone="brand-cyan" hint="Aberto + Em atendimento" />
        <Kpi icon={<AlertTriangle className="size-4" />} label="Aguardando minha ação" value={kpi.aguardandoEu} tone="warning" hint="Responda ou anexe arquivos" />
        <Kpi icon={<Clock className="size-4" />} label="Em atendimento" value={kpi.emAtendimento} tone="brand-teal" />
        <Kpi icon={<CheckCircle2 className="size-4" />} label="Resolvidos" value={kpi.resolvidos} tone="success" />
      </div>

      {/* Ações rápidas + Filtros */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Link
            href="/aluno/novo-chamado"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" /> Abrir novo chamado
          </Link>
        </div>

        {/* Busca/Filtros */}
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

          <select
            className="h-10 w-full sm:w-[180px] px-3 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as any)}
          >
            <option value="ALL">Todas prioridades</option>
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>
      </div>

      {/* Lista (tabela desktop + cards mobile) */}
      <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--muted)] text-foreground/90">
              <tr>
                <th className="text-left font-medium px-4 py-3">Protocolo</th>
                <th className="text-left font-medium px-4 py-3">Título</th>
                <th className="text-left font-medium px-4 py-3">Setor</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Prioridade</th>
                <th className="text-left font-medium px-4 py-3">Criado em</th>
                <th className="text-right font-medium px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((c) => (
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
                  <td className="px-4 py-3">{c.setor ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <PrioridadeDot p={c.prioridade} />
                      <span>{c.prioridade}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(c.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AcoesChamado c={c} />
                  </td>
                </tr>
              ))}

              {dados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-background px-4 py-3 text-sm text-muted-foreground">
                      <Search className="size-4" />
                      Nenhum chamado encontrado com os filtros atuais.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile (cards) */}
        <div className="md:hidden divide-y divide-[var(--border)]">
          {dados.map((c) => (
            <div key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">{c.protocolo ?? `#${c.id}`}</div>
                  <div className="font-medium">{c.titulo}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Setor</div>
                <div>{c.setor ?? "—"}</div>
                <div className="text-muted-foreground">Prioridade</div>
                <div className="inline-flex items-center gap-2">
                  <PrioridadeDot p={c.prioridade} />
                  <span>{c.prioridade}</span>
                </div>
                <div className="text-muted-foreground">Criado em</div>
                <div>{new Date(c.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}</div>
              </div>

              {!!c.mensagensNaoLidas && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs rounded-md px-1.5 py-0.5 bg-[var(--brand-cyan)]/15 text-[var(--brand-cyan)] border border-[var(--brand-cyan)]/30">
                  <MessageSquareText className="size-3.5" />
                  {c.mensagensNaoLidas} nova(s) mensagem(ns)
                </div>
              )}

              <div className="mt-3">
                <AcoesChamado c={c} compact />
              </div>
            </div>
          ))}

          {dados.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum chamado encontrado com os filtros atuais.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
