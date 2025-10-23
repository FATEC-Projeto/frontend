"use client";
import { apiFetch } from "../../../../../utils/api"
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Mail, User, Badge, Shield, CheckCircle2, XCircle,
  Pencil, Trash2, KeyRound, AlertTriangle, Search, Filter,
  ChevronRight, Loader2, Check, X
} from "lucide-react";

/* ===================== Tipos (alinhados ao Prisma) ===================== */
type Papel = "USUARIO" | "BACKOFFICE" | "TECNICO" | "ADMINISTRADOR";
type StatusChamado = "ABERTO" | "EM_ATENDIMENTO" | "AGUARDANDO_USUARIO" | "RESOLVIDO" | "ENCERRADO";
type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
type Nivel = "N1" | "N2" | "N3";

type Usuario = {
  id: string;
  nome: string | null;
  emailPessoal: string;
  emailEducacional: string | null;
  ra: string | null;
  papel: Papel;
  ativo: boolean;
  criadoEm: string;      // ISO
  atualizadoEm: string;  // ISO
};

type Chamado = {
  id: string;
  protocolo?: string | null;
  titulo: string;
  criadoEm: string; // ISO
  status: StatusChamado;
  prioridade: Prioridade;
  nivel: Nivel;
  setor?: string | null; // mapeado no backend (setor.nome)
};

/* ===================== ENV ===================== */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

/* ===================== Utils UI ===================== */
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function StatusBadge({ status }: { status: StatusChamado }) {
  const map: Record<StatusChamado, { label: string; cls: string }> = {
    ABERTO: { label: "Aberto", cls: "bg-[var(--brand-cyan)]/12 text-[var(--brand-cyan)] border-[var(--brand-cyan)]/30" },
    EM_ATENDIMENTO: { label: "Em atendimento", cls: "bg-[var(--brand-teal)]/12 text-[var(--brand-teal)] border-[var(--brand-teal)]/30" },
    AGUARDANDO_USUARIO: { label: "Aguard. usuário", cls: "bg-[var(--warning)]/12 text-[var(--warning)] border-[var(--warning)]/30" },
    RESOLVIDO: { label: "Resolvido", cls: "bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/30" },
    ENCERRADO: { label: "Encerrado", cls: "bg-[var(--muted)] text-muted-foreground border-[var(--border)]" },
  };
  const v = map[status];
  return (
    <span className={cx("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border", v.cls)}>
      {v.label}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-background px-2 py-0.5 text-xs">{children}</span>;
}

function Dot({ tone = "ok" as "ok" | "muted" }) {
  return <span className={cx("inline-block size-2 rounded-full", tone === "ok" ? "bg-[var(--success)]" : "bg-[var(--muted-foreground)]")} />;
}

function toast(msg: string) {
  alert(msg);
}

/* ===================== Página ===================== */
export default function PageAlunoDetalhe() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [aluno, setAluno] = useState<Usuario | null>(null);
  const [chamados, setChamados] = useState<Chamado[]>([]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusChamado | "ALL">("ALL");
  const [prioridade, setPrioridade] = useState<Prioridade | "ALL">("ALL");
  const [nivel, setNivel] = useState<Nivel | "ALL">("ALL");

  const [delOpen, setDelOpen] = useState(false);
  const [delConfirmText, setDelConfirmText] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const token =
          (typeof window !== "undefined" && localStorage.getItem("accessToken")) ||
          process.env.NEXT_PUBLIC_ACCESS_TOKEN ||
          "";

        // GET usuário
        const uRes = await fetch(`${API_URL}/usuarios/${id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          cache: "no-store",
        });
        if (!uRes.ok) throw new Error("Falha ao buscar usuário");
        const u: Usuario = await uRes.json();

        // GET tickets do usuário (criadoPorId)
        const cRes = await fetch(`${API_URL}/tickets?criadoPorId=${u.id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          cache: "no-store",
        });
        if (!cRes.ok) throw new Error("Falha ao buscar tickets");
        let json = await cRes.json();
            let cs: Chamado[] = [];

            // Detecta formato retornado automaticamente
            if (Array.isArray(json)) {
            cs = json;
            } else if (Array.isArray(json.data)) {
            cs = json.data;
            } else if (Array.isArray(json.tickets)) {
            cs = json.tickets;
            } else {
            console.warn("Formato inesperado de /tickets:", json);
            cs = [];
            }


        if (active) {
          setAluno(u);
          setChamados(cs);
        }
      } catch (e) {
        console.error(e);
        if (active) toast("Erro ao carregar dados do usuário.");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      active = false;
    };
  }, [id]);

  const filtrados = useMemo(() => {
    return chamados.filter((c) => {
      const mQ =
        !q ||
        c.titulo.toLowerCase().includes(q.toLowerCase()) ||
        c.protocolo?.toLowerCase().includes(q.toLowerCase());
      const mS = status === "ALL" || c.status === status;
      const mP = prioridade === "ALL" || c.prioridade === prioridade;
      const mN = nivel === "ALL" || c.nivel === nivel;
      return mQ && mS && mP && mN;
    });
  }, [chamados, q, status, prioridade, nivel]);

    async function onExcluirUsuario() {
      if (!aluno) return;

      if (delConfirmText !== (aluno.emailEducacional ?? aluno.emailPessoal)) {
        toast("Digite exatamente o e-mail do usuário para confirmar.");
        return;
      }

      try {
        const res = await apiFetch(`${API_URL}/usuarios/${aluno.id}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Erro ao excluir");

        toast("Usuário excluído com sucesso.");
        router.push("/admin/alunos");
      } catch (e) {
        console.error(e);
        toast("Não foi possível excluir o usuário.");
      } finally {
        setDelOpen(false);
        setDelConfirmText("");
      }
    }

  function onResetSenha() {
    // aqui você pode chamar seu endpoint de reset e disparar email via Resend
    toast("Reset de senha enviado (stub).");
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando usuário...
        </div>
      </div>
    );
  }

  if (!aluno) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[var(--border)] bg-card p-6 text-center">
          <div className="text-lg font-semibold mb-1">Usuário não encontrado</div>
          <div className="text-sm text-muted-foreground">Verifique o ID na URL.</div>
          <Link
            href="/admin/alunos"
            className="inline-flex items-center gap-2 mt-4 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm"
          >
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>
      </div>
    );
  }

  const counts = {
    abertos: chamados.filter((c) => c.status === "ABERTO").length,
    andamento: chamados.filter((c) => c.status === "EM_ATENDIMENTO").length,
    aguard: chamados.filter((c) => c.status === "AGUARDANDO_USUARIO").length,
    resolvidos: chamados.filter((c) => c.status === "RESOLVIDO" || c.status === "ENCERRADO").length,
    total: chamados.length,
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb + voltar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/alunos"
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm"
          >
            <ArrowLeft className="size-4" /> Alunos
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium truncate max-w-[60vw]">{aluno.nome ?? "—"}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm"
            onClick={() => toast("Abrir editor (stub).")}
          >
            <Pencil className="size-4" /> Editar
          </button>
          <button
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm"
            onClick={onResetSenha}
          >
            <KeyRound className="size-4" /> Resetar senha
          </button>
          <button
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-red-300 text-red-600 hover:bg-red-50 text-sm"
            onClick={() => setDelOpen(true)}
          >
            <Trash2 className="size-4" /> Excluir
          </button>
        </div>
      </div>

      {/* Card principal */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-[var(--muted)] grid place-items-center">
              <User className="size-6 text-muted-foreground" />
            </div>
            <div>
              <div className="text-lg font-semibold">{aluno.nome ?? "—"}</div>
              <div className="flex flex-wrap gap-2 mt-1 text-sm">
                <Pill>
                  <Mail className="size-3" /> {aluno.emailEducacional ?? aluno.emailPessoal}
                </Pill>
                <Pill>
                  <Badge className="size-3" /> RA: {aluno.ra ?? "—"}
                </Pill>
                <Pill>
                  <Shield className="size-3" /> {aluno.papel}
                </Pill>
                <Pill>
                  {aluno.ativo ? (
                    <>
                      <Dot /> Ativo
                    </>
                  ) : (
                    <>
                      <Dot tone="muted" /> Inativo
                    </>
                  )}
                </Pill>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Criado em {new Date(aluno.criadoEm).toLocaleDateString("pt-BR")} • Atualizado em{" "}
            {new Date(aluno.atualizadoEm).toLocaleDateString("pt-BR")}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label="Total" value={counts.total} />
        <Kpi label="Abertos" value={counts.abertos} tone="brand-cyan" />
        <Kpi label="Em atendimento" value={counts.andamento} tone="brand-teal" />
        <Kpi label="Aguard. usuário" value={counts.aguard} tone="warning" />
        <Kpi label="Resolvidos/Enc." value={counts.resolvidos} tone="success" />
      </div>

      {/* Filtros + lista de chamados */}
      <div className="rounded-xl border border-[var(--border)] bg-card">
        <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Buscar por protocolo ou título"
              className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative">
              <Filter className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                className="h-10 w-[220px] pl-9 pr-8 rounded-lg border border-[var(--border)] bg-background"
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
              className="h-10 w-[160px] rounded-lg border border-[var(--border)] bg-background px-3"
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as any)}
            >
              <option value="ALL">Prioridade</option>
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>

            <select
              className="h-10 w-[130px] rounded-lg border border-[var(--border)] bg-background px-3"
              value={nivel}
              onChange={(e) => setNivel(e.target.value as any)}
            >
              <option value="ALL">Nível</option>
              <option value="N1">N1</option>
              <option value="N2">N2</option>
              <option value="N3">N3</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--muted)] text-foreground/90">
              <tr>
                <th className="text-left font-medium px-4 py-3">Protocolo</th>
                <th className="text-left font-medium px-4 py-3">Título</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Setor</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Nível</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Prioridade</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Criado em</th>
                <th className="text-right font-medium px-4 py-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-medium">{c.protocolo ?? `#${c.id}`}</td>
                  <td className="px-4 py-3 max-w-[360px]">
                    <div className="line-clamp-1">{c.titulo}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{c.setor ?? "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{c.nivel}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">{c.prioridade}</td>
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
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum chamado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog de exclusão */}
      {delOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDelOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 bg-background rounded-xl shadow-xl border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-600" />
              <div className="font-semibold">Confirmar exclusão do usuário</div>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm">
                Essa ação é <b>irreversível</b>. Para confirmar, digite o e-mail do usuário:
              </p>
              <div className="rounded-md border border-[var(--border)] bg-card p-3 text-sm">
                <div className="text-muted-foreground">E-mail esperado</div>
                <div className="font-mono">{aluno.emailEducacional ?? aluno.emailPessoal}</div>
              </div>
              <input
                className="w-full h-10 rounded-md border border-[var(--border)] bg-background px-3"
                placeholder="Digite aqui exatamente o e-mail"
                value={delConfirmText}
                onChange={(e) => setDelConfirmText(e.target.value)}
              />
            </div>
            <div className="p-4 border-t border-[var(--border)] flex items-center justify-end gap-2">
              <button
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm"
                onClick={() => setDelOpen(false)}
              >
                <X className="size-4" /> Cancelar
              </button>
              <button
                className={cx(
                  "inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm",
                  delConfirmText === (aluno.emailEducacional ?? aluno.emailPessoal)
                    ? "bg-red-600 text-white hover:brightness-95"
                    : "bg-red-600/50 text-white/80 cursor-not-allowed"
                )}
                onClick={onExcluirUsuario}
                disabled={delConfirmText !== (aluno.emailEducacional ?? aluno.emailPessoal)}
              >
                <Trash2 className="size-4" /> Excluir definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== Componentes auxiliares ===================== */
function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
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
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <div className="text-2xl font-semibold">{value}</div>
        <div className={cx("size-6 rounded-md grid place-items-center", tone ? bg[tone] : "bg-[var(--muted)]")}>
          {tone === "success" ? (
            <CheckCircle2 className={cx("size-4", tone ? fg[tone] : "text-muted-foreground")} />
          ) : tone ? (
            <XCircle className={cx("size-4", fg[tone])} />
          ) : (
            <Check className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}
