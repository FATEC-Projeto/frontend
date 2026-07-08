"use client";
import { apiFetch, extractApiError } from "../../../../../utils/api"
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Mail, User, Badge, Shield, CheckCircle2, XCircle,
  Pencil, Trash2, KeyRound, AlertTriangle, Search, Filter,
  ChevronRight, Loader2, Check, X, Ticket, Clock,
  Phone, MessageCircle, GraduationCap, Building2, BookOpen,
} from "lucide-react";

import { cx } from '../../../../../utils/cx'
import TicketStatusBadge from "../../../../components/shared/TicketStatusBadge";
import KpiCard from "../../../../components/shared/KpiCard";
import FormAlunoEdit from "../../_components/FormAlunoEdit";

/* ===================== Tipos ===================== */
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
  criadoEm: string;
  atualizadoEm: string;
  // Curso
  cursoNome: string | null;
  cursoSigla: string | null;
  curso: string | null;
  eixoTecnologico: string | null;
  matrizCurricular: string | null;
  // Dados acadêmicos
  unidadeFatec: string | null;
  turno: string | null;
  turma: string | null;
  semestreAtual: string | null;
  anoSemestreIngresso: string | null;
  situacaoAcademica: string | null;
  coordenadorCurso: string | null;
  // Contato
  telefoneCelular: string | null;
  whatsapp: string | null;
  canalPreferencialContato: string | null;
  melhorPeriodoContato: string | null;
  // Acessibilidade
  necessitaAtendimentoAcessivel: boolean | null;
  tipoAcessibilidade: string | null;
  observacoesAtendimento: string | null;
};

type Chamado = {
  id: string;
  protocolo?: string | null;
  titulo: string;
  criadoEm: string;
  status: StatusChamado;
  prioridade: Prioridade;
  nivel: Nivel;
  setor?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-background px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}

function Dot({ tone = "ok" as "ok" | "muted" }) {
  return (
    <span
      className={cx(
        "inline-block size-2 rounded-full",
        tone === "ok" ? "bg-[var(--success)]" : "bg-[var(--muted-foreground)]",
      )}
    />
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm mt-0.5">{value || <span className="text-muted-foreground/60">—</span>}</span>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
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
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const token =
          (typeof window !== "undefined" && localStorage.getItem("accessToken")) || "";

        const uRes = await fetch(`${API_URL}/usuarios/${id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          cache: "no-store",
        });
        if (!uRes.ok) throw new Error("Falha ao buscar usuário");
        const u: Usuario = await uRes.json();

        const cRes = await fetch(`${API_URL}/tickets?criadoPorId=${u.id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          cache: "no-store",
        });
        if (!cRes.ok) throw new Error("Falha ao buscar tickets");
        const json = await cRes.json();
        let cs: Chamado[] = [];
        // GET /tickets responde { total, page, pageSize, items } — o array é
        // 'items'. Sem essa chave, a lista ficava sempre vazia no detalhe.
        if (Array.isArray(json)) cs = json;
        else if (Array.isArray(json.items)) cs = json.items;
        else if (Array.isArray(json.data)) cs = json.data;
        else if (Array.isArray(json.tickets)) cs = json.tickets;

        if (active) { setAluno(u); setChamados(cs); }
      } catch (e) {
        console.error(e);
        if (active) toast("Erro ao carregar dados do usuário.");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (id) load();
    return () => { active = false; };
  }, [id]);

  const filtrados = useMemo(() => {
    return chamados.filter((c) => {
      const mQ = !q || c.titulo.toLowerCase().includes(q.toLowerCase()) || c.protocolo?.toLowerCase().includes(q.toLowerCase());
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
      const res = await apiFetch(`${API_URL}/usuarios/${aluno.id}`, { method: "DELETE" });
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

  async function onResetSenha() {
    if (!aluno) return;
    const email = aluno.emailPessoal || aluno.emailEducacional;
    if (!email) {
      toast.error("Este aluno não tem e-mail cadastrado para envio do link.");
      return;
    }
    try {
      const res = await apiFetch(`${API_URL}/auth/esqueci-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(await extractApiError(res, `Erro ${res.status}`));
      toast.success(`Link de redefinição de senha enviado para ${email}.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar link de redefinição.");
    }
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
          <Link href="/admin/alunos" className="inline-flex items-center gap-2 mt-4 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>
      </div>
    );
  }

  const counts = {
    abertos:    chamados.filter((c) => c.status === "ABERTO").length,
    andamento:  chamados.filter((c) => c.status === "EM_ATENDIMENTO").length,
    aguard:     chamados.filter((c) => c.status === "AGUARDANDO_USUARIO").length,
    resolvidos: chamados.filter((c) => c.status === "RESOLVIDO" || c.status === "ENCERRADO").length,
    total:      chamados.length,
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb + voltar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/alunos" className="inline-flex items-center gap-2 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm">
            <ArrowLeft className="size-4" /> Alunos
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium truncate max-w-[60vw]">{aluno.nome ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border hover:bg-[var(--muted)] text-sm"
            onClick={() => setEditOpen(true)}
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
                <Pill><Mail className="size-3" /> {aluno.emailEducacional ?? aluno.emailPessoal}</Pill>
                {aluno.emailPessoal && aluno.emailEducacional && (
                  <Pill><Mail className="size-3" /> {aluno.emailPessoal}</Pill>
                )}
                <Pill><Badge className="size-3" /> RA: {aluno.ra ?? "—"}</Pill>
                <Pill><Shield className="size-3" /> {aluno.papel}</Pill>
                <Pill>{aluno.ativo ? <><Dot /> Ativo</> : <><Dot tone="muted" /> Inativo</>}</Pill>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Criado em {new Date(aluno.criadoEm).toLocaleDateString("pt-BR")} • Atualizado em{" "}
            {new Date(aluno.atualizadoEm).toLocaleDateString("pt-BR")}
          </div>
        </div>
      </div>

      {/* Cards de informações adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dados Acadêmicos */}
        <SectionCard title="Dados Acadêmicos" icon={<GraduationCap className="size-4" />}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <InfoRow label="Unidade Fatec" value={aluno.unidadeFatec} />
            <InfoRow label="Turno" value={aluno.turno} />
            <InfoRow label="Curso" value={aluno.cursoNome ?? aluno.curso} />
            <InfoRow label="Sigla" value={aluno.cursoSigla} />
            <InfoRow label="Eixo tecnológico" value={aluno.eixoTecnologico} />
            <InfoRow label="Turma" value={aluno.turma} />
            <InfoRow label="Semestre atual" value={aluno.semestreAtual} />
            <InfoRow label="Ingresso" value={aluno.anoSemestreIngresso} />
            <InfoRow label="Situação acadêmica" value={aluno.situacaoAcademica} />
            <InfoRow label="Matriz curricular" value={aluno.matrizCurricular} />
            <div className="col-span-2">
              <InfoRow label="Coordenador do curso" value={aluno.coordenadorCurso} />
            </div>
          </div>
        </SectionCard>

        {/* Contato & Acessibilidade */}
        <SectionCard title="Contato & Acessibilidade" icon={<Phone className="size-4" />}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <InfoRow label="Telefone celular" value={aluno.telefoneCelular} />
            <InfoRow label="WhatsApp" value={aluno.whatsapp} />
            <InfoRow label="Canal preferencial" value={aluno.canalPreferencialContato} />
            <InfoRow label="Melhor período" value={aluno.melhorPeriodoContato} />
            <div className="col-span-2">
              <InfoRow
                label="Atendimento acessível"
                value={
                  aluno.necessitaAtendimentoAcessivel === null
                    ? undefined
                    : aluno.necessitaAtendimentoAcessivel
                    ? "Sim"
                    : "Não"
                }
              />
            </div>
            {aluno.necessitaAtendimentoAcessivel && (
              <>
                <div className="col-span-2">
                  <InfoRow label="Tipo de acessibilidade" value={aluno.tipoAcessibilidade} />
                </div>
                <div className="col-span-2">
                  <InfoRow label="Observações" value={aluno.observacoesAtendimento} />
                </div>
              </>
            )}
          </div>
        </SectionCard>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={<Ticket className="size-4" />} label="Total" value={counts.total} />
        <KpiCard icon={<Ticket className="size-4" />} label="Abertos" value={counts.abertos} tone="brand-cyan" />
        <KpiCard icon={<Clock className="size-4" />} label="Em atendimento" value={counts.andamento} tone="brand-teal" />
        <KpiCard icon={<AlertTriangle className="size-4" />} label="Aguard. usuário" value={counts.aguard} tone="warning" />
        <KpiCard icon={<CheckCircle2 className="size-4" />} label="Resolvidos/Enc." value={counts.resolvidos} tone="success" />
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
                  <td className="px-4 py-3 max-w-[360px]"><div className="line-clamp-1">{c.titulo}</div></td>
                  <td className="px-4 py-3 hidden md:table-cell">{c.setor ?? "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{c.nivel}</td>
                  <td className="px-4 py-3"><TicketStatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell">{c.prioridade}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {new Date(c.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/chamados/${c.id}`} className="inline-flex items-center h-9 px-3 rounded-md hover:bg-[var(--muted)]">
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

      {/* Modal de edição */}
      {editOpen && aluno && (
        <FormAlunoEdit
          aluno={aluno}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setAluno((prev : any) => prev ? { ...prev, ...updated } : prev);
            setEditOpen(false);
          }}
        />
      )}

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
                    : "bg-red-600/50 text-white/80 cursor-not-allowed",
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
