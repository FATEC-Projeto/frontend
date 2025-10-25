"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Send, User, Building2, Tag, Clock,
  CheckCircle2, RotateCcw, Pencil, Save, MessageSquareText
} from "lucide-react";
import { apiFetch } from "../../../../../utils/api";

/* ===== Tipos ===== */
type Nivel = "N1" | "N2" | "N3";
type Status = "ABERTO" | "EM_ATENDIMENTO" | "AGUARDANDO_USUARIO" | "RESOLVIDO" | "ENCERRADO";
type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

type UsuarioMin = { id: string; nome?: string | null; emailPessoal?: string | null };
type SetorMin = { id: string; nome?: string | null };
type ServicoMin = { id: string; nome?: string | null };
type ClienteMin = { id: string; nome?: string | null };
type ContratoMin = { id: string; numero?: string | null };

type Mensagem = {
  id: string;
  conteudo: string;
  criadoEm: string;
  autorId: string;
  autor?: UsuarioMin | null;
};

type Historico = {
  id: string;
  de: Status | null;
  para: Status;
  criadoEm: string;
  porUsuarioId?: string | null;
  porUsuario?: UsuarioMin | null;
  observacao?: string | null;
};

type Chamado = {
  id: string;
  protocolo?: string | null;
  titulo: string;
  descricao: string;
  nivel: Nivel;
  status: Status;
  prioridade: Prioridade;

  servicoId?: string | null;
  setorId?: string | null;
  clienteId?: string | null;
  contratoId?: string | null;

  responsavelId?: string | null;
  criadoPorId: string;

  criadoEm: string;
  atualizadoEm: string;
  encerradoEm?: string | null;

  criadoPor?: UsuarioMin | null;
  responsavel?: UsuarioMin | null;
  setor?: SetorMin | null;
  servico?: ServicoMin | null;
  cliente?: ClienteMin | null;
  contrato?: ContratoMin | null;
  mensagens?: Mensagem[];
  historico?: Historico[];
};

type TicketResponse = Chamado;

/* ===== Utils ===== */
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function BadgeStatus({ s }: { s: Status }) {
  const map: Record<Status, string> = {
    ABERTO: "bg-[var(--brand-cyan)]/12 text-[var(--brand-cyan)] border-[var(--brand-cyan)]/30",
    EM_ATENDIMENTO: "bg-[var(--brand-teal)]/12 text-[var(--brand-teal)] border-[var(--brand-teal)]/30",
    AGUARDANDO_USUARIO: "bg-[var(--warning)]/12 text-[var(--warning)] border-[var(--warning)]/30",
    RESOLVIDO: "bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/30",
    ENCERRADO: "bg-[var(--muted)] text-muted-foreground border-[var(--border)]",
  };
  return (
    <span className={cx("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border", map[s])}>
      {s.replace("_", " ")}
    </span>
  );
}

function DotPrioridade({ p }: { p: Prioridade }) {
  const map: Record<Prioridade, string> = {
    BAIXA: "bg-[var(--muted-foreground)]",
    MEDIA: "bg-[var(--brand-cyan)]",
    ALTA: "bg-[var(--brand-teal)]",
    URGENTE: "bg-[var(--brand-red)]",
  };
  return <span className={cx("inline-block size-2 rounded-full", map[p])} />;
}

/* ===== Página ===== */
export default function AdminChamadoPage() {
  const { id } = useParams<{ id: string }>();
  const API = process.env.NEXT_PUBLIC_API_BASE_URL;

  // dados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketResponse | null>(null);

  // edição
  const [status, setStatus] = useState<Status>("ABERTO");
  const [prioridade, setPrioridade] = useState<Prioridade>("MEDIA");
  const [nivel, setNivel] = useState<Nivel>("N1");
  const [responsavelId, setResponsavelId] = useState<string>("");

  // chat
  const [msg, setMsg] = useState("");
  const chatRef = useRef<HTMLDivElement | null>(null);

  const include = useMemo(
    () =>
      [
        "criadoPor",
        "responsavel",
        "setor",
        "servico",
        "cliente",
        "contrato",
        "historico",
        "mensagens",
      ].join(","),
    []
  );

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await apiFetch(`${API}/tickets/${id}?include=${encodeURIComponent(include)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || `Erro HTTP ${res.status}`);
      }
      const data: TicketResponse = await res.json();
      setTicket(data);
      setStatus(data.status);
      setPrioridade(data.prioridade);
      setNivel(data.nivel);
      setResponsavelId(data.responsavelId ?? "");
    } catch (e: any) {
      setErr(e?.message || "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, API]);

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [ticket?.mensagens?.length]);

  async function saveEdits() {
    if (!ticket) return;
    try {
      setSaving(true);
      const body = {
        status,
        prioridade,
        nivel,
        responsavelId: responsavelId || null,
      };
      const res = await apiFetch(`${API}/tickets/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || `Erro HTTP ${res.status}`);
      }
      await load();
    } catch (e: any) {
      alert(e?.message || "Falha ao salvar alterações");
    } finally {
      setSaving(false);
    }
  }

  async function sendMessage() {
    if (!ticket) return;
    const trimmed = msg.trim();
    if (!trimmed) return;
    try {
      setSending(true);
      // 🔧 usa a rota oficial de mensagens deste ticket
      const res = await apiFetch(`${API}/tickets/${ticket.id}/mensagens`, {
        method: "POST",
        body: JSON.stringify({ conteudo: trimmed }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || `Erro HTTP ${res.status}`);
      }
      setMsg("");
      await load();
    } catch (e: any) {
      alert(e?.message || "Falha ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando chamado…
        </div>
      </div>
    );
  }

  if (err || !ticket) {
    return (
      <div className="p-6 space-y-3">
        <Link href="/admin/chamados" className="inline-flex items-center gap-2 text-sm hover:underline">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <div className="rounded-xl border border-[var(--border)] bg-card p-4">
          <div className="text-red-500 font-medium">Erro</div>
          <div className="text-sm text-muted-foreground mt-1">{err ?? "Chamado não encontrado"}</div>
        </div>
      </div>
    );
  }

  const mensagens = (ticket.mensagens ?? []).slice().sort(
    (a, b) => +new Date(a.criadoEm) - +new Date(b.criadoEm)
  );
  const historico = (ticket.historico ?? []).slice().sort(
    (a, b) => +new Date(b.criadoEm) - +new Date(a.criadoEm)
  );

  return (
    <div className="px-4 py-2 sm:px-6 lg:px-8">
      {/* topo */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/admin/chamados" className="inline-flex items-center gap-2 text-sm hover:underline">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <div className="text-sm text-muted-foreground">
          Criado em {new Date(ticket.criadoEm).toLocaleDateString("pt-BR")}
        </div>
      </div>

      {/* header do chamado */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4 mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{ticket.protocolo ?? `#${ticket.id}`}</div>
            <h1 className="font-grotesk text-xl sm:text-2xl font-semibold tracking-tight line-clamp-2">
              {ticket.titulo}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BadgeStatus s={ticket.status} />
            <span className="inline-flex items-center gap-2 text-sm border rounded-md px-2 py-1">
              <DotPrioridade p={ticket.prioridade} /> {ticket.prioridade}
            </span>
            <span className="inline-flex items-center gap-2 text-xs border rounded-md px-2 py-1">
              Nível {ticket.nivel}
            </span>
          </div>
        </div>

        {/* metadados */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          <div className="inline-flex items-center gap-2">
            <User className="size-4" />
            <span className="text-muted-foreground">Criado por:</span>
            <span className="font-medium">{ticket.criadoPor?.nome ?? "—"}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <User className="size-4" />
            <span className="text-muted-foreground">Responsável:</span>
            <span className="font-medium">{ticket.responsavel?.nome ?? "—"}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Building2 className="size-4" />
            <span className="text-muted-foreground">Setor:</span>
            <span className="font-medium">{ticket.setor?.nome ?? "—"}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Tag className="size-4" />
            <span className="text-muted-foreground">Serviço:</span>
            <span className="font-medium">{ticket.servico?.nome ?? "—"}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <User className="size-4" />
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium">{ticket.cliente?.nome ?? "—"}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Clock className="size-4" />
            <span className="text-muted-foreground">Atualizado:</span>
            <span className="font-medium">
              {new Date(ticket.atualizadoEm).toLocaleDateString("pt-BR")}{" "}
              {new Date(ticket.atualizadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>

      {/* layout: chat à esquerda, gestão à direita */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* chat */}
        <section className="xl:col-span-8 rounded-xl border border-[var(--border)] bg-card flex flex-col">
          <div className="p-3 border-b border-[var(--border)] flex items-center gap-2">
            <MessageSquareText className="size-4" />
            <div className="font-grotesk font-semibold">Mensagens</div>
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {mensagens.length === 0 ? (
              <div className="text-sm text-muted-foreground">Sem mensagens ainda.</div>
            ) : (
              mensagens.map((m) => (
                <div key={m.id} className={cx("max-w-[86%]", m.autorId === ticket.criadoPorId ? "" : "ml-auto")}>
                  <div
                    className={cx(
                      "rounded-lg px-3 py-2 border",
                      m.autorId === ticket.criadoPorId
                        ? "bg-background"
                        : "bg-[var(--brand-cyan)]/10 border-[var(--brand-cyan)]/30"
                    )}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {m.autor?.nome ?? (m.autorId === ticket.criadoPorId ? "Solicitante" : "Equipe")}
                      {" · "}
                      {new Date(m.criadoEm).toLocaleDateString("pt-BR")}{" "}
                      {new Date(m.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="whitespace-pre-wrap">{m.conteudo}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-[var(--border)]">
            <div className="flex items-end gap-2">
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={2}
                placeholder="Escreva uma mensagem…"
                className="flex-1 h-[72px] rounded-lg border border-[var(--border)] bg-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !msg.trim()}
                className="h-[72px] px-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-60 inline-flex items-center justify-center"
                title="Enviar"
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </div>
          </div>
        </section>

        {/* gestão */}
        <aside className="xl:col-span-4 space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-card">
            <div className="p-3 border-b border-[var(--border)] flex items-center gap-2">
              <Pencil className="size-4" />
              <div className="font-grotesk font-semibold">Atribuição & Status</div>
            </div>
            <div className="p-4 space-y-3">
              <label className="text-sm block">
                <span className="text-muted-foreground">Status</span>
                <select
                  className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                >
                  <option value="ABERTO">Aberto</option>
                  <option value="EM_ATENDIMENTO">Em atendimento</option>
                  <option value="AGUARDANDO_USUARIO">Aguardando usuário</option>
                  <option value="RESOLVIDO">Resolvido</option>
                  <option value="ENCERRADO">Encerrado</option>
                </select>
              </label>

              <label className="text-sm block">
                <span className="text-muted-foreground">Prioridade</span>
                <select
                  className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as Prioridade)}
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </label>

              <label className="text-sm block">
                <span className="text-muted-foreground">Nível</span>
                <select
                  className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value as Nivel)}
                >
                  <option value="N1">N1</option>
                  <option value="N2">N2</option>
                  <option value="N3">N3</option>
                </select>
              </label>

              <label className="text-sm block">
                <span className="text-muted-foreground">Responsável (ID do usuário)</span>
                <input
                  value={responsavelId}
                  onChange={(e) => setResponsavelId(e.target.value)}
                  placeholder="cuid_xxx do responsável"
                  className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </label>

              {/* 🔧 botões empilhados, largura total */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    setStatus("RESOLVIDO");
                    saveEdits();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
                >
                  <CheckCircle2 className="size-4" /> Marcar como resolvido
                </button>
                <button
                  onClick={() => {
                    setStatus("ABERTO");
                    setPrioridade("MEDIA");
                    setNivel("N1");
                    saveEdits();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
                >
                  <RotateCcw className="size-4" /> Reabrir (reset básico)
                </button>
                <button
                  onClick={saveEdits}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-md bg-primary text-primary-foreground disabled:opacity-60 text-sm"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Salvar alterações
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-card">
            <div className="p-3 border-b border-[var(--border)] font-grotesk font-semibold">Histórico de status</div>
            <div className="p-3 space-y-3 max-h-[360px] overflow-y-auto">
              {historico.length === 0 ? (
                <div className="text-sm text-muted-foreground">Sem histórico.</div>
              ) : (
                historico.map((h) => (
                  <div key={h.id} className="text-sm">
                    <div className="font-medium">
                      {h.de ? <BadgeStatus s={h.de} /> : <span className="text-xs text-muted-foreground">—</span>}
                      <span className="mx-2">→</span>
                      <BadgeStatus s={h.para} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(h.criadoEm).toLocaleDateString("pt-BR")}{" "}
                      {new Date(h.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {h.porUsuario?.nome ? ` · por ${h.porUsuario.nome}` : ""}
                      {h.observacao ? ` · ${h.observacao}` : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
