"use client";
import Link from "next/link";
import { useMemo, useState, ReactNode } from "react";
import {
  LayoutDashboard,
  Ticket,
  Users,
  UserPlus,
  FileChartColumn,
  Settings,
  Menu,
  X,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  ChevronRight,
} from "lucide-react";

/*
  📄 Coloque este arquivo em: app/(dashboard)/admin/page.tsx
  ⚙️ Tailwind já no projeto.

  ✅ Se quiser tornar a sidebar global para todo o /admin, mova a Sidebar
  para app/(dashboard)/admin/layout.tsx e renderize {children}.
*/

/* ------------------------- TIPOS E MOCK ------------------------- */

type Status =
  | "ABERTO"
  | "EM_ATENDIMENTO"
  | "AGUARDANDO_USUARIO"
  | "RESOLVIDO"
  | "ENCERRADO";

type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

type Chamado = {
  id: string;
  protocolo?: string;
  titulo: string;
  criadoEm: string;
  status: Status;
  prioridade: Prioridade;
  solicitante: string;
  setor?: string;
};

const MOCK: Chamado[] = [
  {
    id: "1",
    protocolo: "WF-2025-0001",
    titulo: "Problema no acesso ao Portal do Aluno",
    criadoEm: "2025-10-18T09:12:00Z",
    status: "ABERTO",
    prioridade: "ALTA",
    solicitante: "João Silva",
    setor: "TI Acadêmica",
  },
  {
    id: "2",
    protocolo: "WF-2025-0002",
    titulo: "Atualização de matrícula — documentos pendentes",
    criadoEm: "2025-10-16T15:38:00Z",
    status: "AGUARDANDO_USUARIO",
    prioridade: "MEDIA",
    solicitante: "Maria Souza",
    setor: "Secretaria",
  },
  {
    id: "3",
    protocolo: "WF-2025-0003",
    titulo: "Solicitação de histórico escolar",
    criadoEm: "2025-10-14T11:05:00Z",
    status: "EM_ATENDIMENTO",
    prioridade: "BAIXA",
    solicitante: "Carlos Lima",
    setor: "Secretaria",
  },
  {
    id: "4",
    protocolo: "WF-2025-0004",
    titulo: "Falha na emissão de boleto",
    criadoEm: "2025-10-10T08:21:00Z",
    status: "RESOLVIDO",
    prioridade: "URGENTE",
    solicitante: "Ana Pereira",
    setor: "Financeiro",
  },
];

/* ------------------------- UTILS ------------------------- */
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* ------------------------- SIDEBAR ------------------------- */
type NavItemProps = {
  href?: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
};

function Sidebar({ onClose }: { onClose?: () => void }) {
  const NavItem = ({ href = "#", icon, label, active = false }: NavItemProps) => (
    <Link
      href={href}
      className={cx(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "hover:bg-[var(--muted)]/70"
      )}
      onClick={onClose}
    >
      <span className="inline-grid place-items-center size-5 opacity-90">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );

  return (
    <aside className="xl:sticky xl:top-4 xl:self-start w-full xl:w-[260px]">
      <div className="rounded-2xl border border-[var(--border)] bg-card p-3">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2 px-2 select-none">
          <div className="size-8 rounded-lg bg-primary grid place-items-center text-primary-foreground text-xs font-bold">
            WF
          </div>
          <div>
            <div className="font-grotesk text-sm font-semibold">Secretaria</div>
            <div className="text-xs text-muted-foreground">Sistema de Gestão</div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="space-y-1">
          <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            Visão Geral
          </div>
          <NavItem
            href="/admin"
            icon={<LayoutDashboard className="size-4" />}
            label="Visão Geral"
            active
          />

          <div className="px-2 pt-3 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            Chamados
          </div>
          <NavItem href="#" icon={<Ticket className="size-4" />} label="Todos os Chamados" />
          <NavItem href="#" icon={<Users className="size-4" />} label="Gerenciar Alunos" />
          <NavItem href="#" icon={<UserPlus className="size-4" />} label="Gerenciar Funcionários" />
          <NavItem href="#" icon={<FileChartColumn className="size-4" />} label="Relatórios" />
          <NavItem href="#" icon={<Settings className="size-4" />} label="Configurações" />
        </nav>

        {/* Indicadores rápidos (abaixo do menu) */}
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-background p-3">
          <div className="text-xs text-muted-foreground mb-2">Indicadores rápidos</div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span>SLA médio (dias)</span><span className="font-medium">1,7</span>
            </li>
            <li className="flex items-center justify-between">
              <span>% resolvidos</span><span className="font-medium">82%</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Pendentes do usuário</span><span className="font-medium">—</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}

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
      label: "Aguardando usuário",
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
    <span
      className={cx(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border",
        v.cls
      )}
    >
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

/* ------------------------- KPIs ------------------------- */
function Kpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  tone?: "brand-cyan" | "brand-teal" | "warning" | "success";
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
        </div>
        <div
          className={cx(
            "size-10 rounded-lg grid place-items-center",
            tone ? bgMap[tone] : "bg-[var(--muted)]"
          )}
        >
          <div className={cx("opacity-90", tone ? textMap[tone] : "text-muted-foreground")}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- DASHBOARD ------------------------- */
function AdminDashboard() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const [prioridade, setPrioridade] = useState<Prioridade | "ALL">("ALL");

  const dados = useMemo(() => {
    return MOCK.filter((c) => {
      const matchQ =
        !q ||
        c.titulo.toLowerCase().includes(q.toLowerCase()) ||
        c.protocolo?.toLowerCase().includes(q.toLowerCase()) ||
        c.solicitante.toLowerCase().includes(q.toLowerCase());
      const matchS = status === "ALL" || c.status === status;
      const matchP = prioridade === "ALL" || c.prioridade === prioridade;
      return matchQ && matchS && matchP;
    });
  }, [q, status, prioridade]);

  const kpi = useMemo(() => {
    const total = dados.length;
    const abertos = dados.filter((d) => d.status === "ABERTO").length;
    const andamento = dados.filter((d) => d.status === "EM_ATENDIMENTO").length;
    const pendUser = dados.filter((d) => d.status === "AGUARDANDO_USUARIO").length;
    const resolvidos = dados.filter((d) => d.status === "RESOLVIDO").length;
    return { total, abertos, andamento, pendUser, resolvidos };
  }, [dados]);

  return (
    <div className="min-h-dvh px-4 py-6 sm:px-6 lg:px-8">
      {/* Topbar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-grotesk text-2xl sm:text-3xl font-semibold tracking-tight">
            Visão Geral
          </h1>
        <p className="text-muted-foreground">Dashboard de gestão de atendimento</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <div className="text-sm font-medium">Admin User</div>
            <div className="text-xs text-muted-foreground">admin@fatec.sp.gov.br</div>
          </div>
          <button
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
            type="button"
          >
            Sair
          </button>
          <MobileSidebarTrigger />
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Coluna principal */}
        <div className="xl:col-span-9 space-y-6">
          {/* Filtros */}
          <div className="rounded-xl border border-[var(--border)] bg-card">
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
          </div>

          {/* Tabela de chamados */}
          <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--muted)] text-foreground/90">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Protocolo</th>
                    <th className="text-left font-medium px-4 py-3">Título</th>
                    <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Solicitante</th>
                    <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">Setor</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-left font-medium px-4 py-3">Prioridade</th>
                    <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Criado em</th>
                    <th className="text-right font-medium px-4 py-3">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.map((c) => (
                    <tr key={c.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-3 font-medium">{c.protocolo ?? `#${c.id}`}</td>
                      <td className="px-4 py-3 max-w-[320px]">
                        <div className="line-clamp-1">{c.titulo}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">{c.solicitante}</td>
                      <td className="px-4 py-3 hidden xl:table-cell">{c.setor ?? "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <PrioridadeDot p={c.prioridade} />
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
                        <button
                          type="button"
                          className="inline-flex items-center h-9 px-3 rounded-md hover:bg-[var(--muted)]"
                        >
                          Detalhes <ChevronRight className="size-4 ml-1" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {dados.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                        Nenhum chamado encontrado com os filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <Kpi icon={<Ticket className="size-4" />} label="Total" value={kpi.total} />
            <Kpi icon={<AlertTriangle className="size-4" />} label="Abertos" value={kpi.abertos} tone="brand-cyan" />
            <Kpi icon={<Clock className="size-4" />} label="Em atendimento" value={kpi.andamento} tone="brand-teal" />
            <Kpi icon={<User className="size-4" />} label="Aguard. usuário" value={kpi.pendUser} tone="warning" />
            <Kpi icon={<CheckCircle2 className="size-4" />} label="Resolvidos" value={kpi.resolvidos} tone="success" />
          </div>
        </div>

        {/* Coluna lateral (widgets) */}
        <div className="xl:col-span-3 space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-card p-4">
            <h3 className="font-grotesk font-semibold mb-3">Ações rápidas</h3>
            <div className="grid grid-cols-1 gap-2">
              <button className="h-10 px-3 rounded-lg border border-[var(--border)] bg-background text-left inline-flex items-center justify-start text-sm font-medium">
                <Plus className="size-4 mr-2" /> Novo chamado
              </button>
              <button className="h-10 px-3 rounded-lg border border-[var(--border)] bg-background text-left inline-flex items-center justify-start text-sm font-medium">
                <User className="size-4 mr-2" /> Cadastro de aluno
              </button>
              <button className="h-10 px-3 rounded-lg border border-[var(--border)] bg-background text-left inline-flex items-center justify-start text-sm font-medium">
                <Filter className="size-4 mr-2" /> Relatórios
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-card p-4">
            <h3 className="font-grotesk font-semibold mb-3">Indicadores rápidos</h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">SLA médio (dias)</span>
                <span className="font-medium">1,7</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">% resolvidos</span>
                <span className="font-medium">82%</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pendentes do usuário</span>
                <span className="font-medium">{kpi.pendUser}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-card p-4">
            <h3 className="font-grotesk font-semibold mb-3">Atividades recentes</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="font-medium">WF-2025-0004</span> marcado como{" "}
                <span className="text-[var(--success)]">Resolvido</span>.
              </li>
              <li>
                <span className="font-medium">WF-2025-0002</span> aguardando envio de documentos do aluno.
              </li>
              <li>
                <span className="font-medium">WF-2025-0001</span> atribuído a <b>Equipe TI</b>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- MOBILE DRAWER ------------------------- */
function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="xl:hidden inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-4" /> Menu
      </button>
      {open && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-[320px] bg-background shadow-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-grotesk font-semibold">Secretaria</div>
              <button
                className="inline-grid place-items-center size-9 rounded-md hover:bg-[var(--muted)]"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <Sidebar onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------- PÁGINA ------------------------- */
export default function AdminPage() {
  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_rgba(198,40,40,0.06),_transparent_55%)]">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar (coluna) */}
        <div className="hidden xl:block">
          <Sidebar />
        </div>

        {/* Conteúdo */}
        <AdminDashboard />
      </div>
    </div>
  );
}
