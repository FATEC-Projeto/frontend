"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Send, User, Building2, Tag, Clock,
  CheckCircle2, RotateCcw, Pencil, Save, MessageSquareText,
  Paperclip, Download, Upload, Route,
} from "lucide-react";
import { apiFetch } from "../../../../../utils/api";
import { toast } from "sonner";

import { cx } from '../../../../../utils/cx'
import TicketStatusBadge from "../../../../components/shared/TicketStatusBadge";
import LoadingSpinner from "../../../../components/shared/LoadingSpinner";

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

type AnexoInfo = {
  id: string;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  enviadoEm: string;
  enviadoPor?: { id: string; nome?: string | null } | null;
};

type Ticket = {
  id: string;
  protocolo?: string | null;
  titulo: string;
  descricao: string;
  nivel: Nivel;
  status: Status;
  prioridade: Prioridade;
  criadoPorId: string;
  criadoEm: string;
  atualizadoEm: string;
  encerradoEm?: string | null;
  responsavelId?: string | null;
  // Catalog wizard fields
  catalogoServicoId?: string | null;
  catalogoCategoriaId?: string | null;
  catalogoCategoriaNome?: string | null;
  setorProvavel?: string | null;
  dadosAcademicos?: Record<string, string> | null;
  camposEspecificos?: Record<string, string> | null;
  origem?: string | null;

  criadoPor?: UsuarioMin | null;
  responsavel?: UsuarioMin | null;
  setor?: SetorMin | null;
  servico?: ServicoMin | null;
  cliente?: ClienteMin | null;
  contrato?: ContratoMin | null;
  mensagens?: Mensagem[];
  historico?: Historico[];
};

function formatarChave(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, c => c.toUpperCase())
    .trim();
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
if (process.env.NODE_ENV === "development" && !API) {
  console.warn("[AdminChamadoPage] NEXT_PUBLIC_API_BASE_URL não está configurada.");
}

/* ===== Página ===== */
export default function AdminChamadoPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>("ABERTO");
  const [prioridade, setPrioridade] = useState<Prioridade>("MEDIA");
  const [nivel, setNivel] = useState<Nivel>("N1");
  const [responsavelId, setResponsavelId] = useState<string>("");

  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const chatRef = useRef<HTMLDivElement | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  const [anexos, setAnexos] = useState<AnexoInfo[]>([]);
  const [loadingAnexos, setLoadingAnexos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const fetchAnexos = useCallback(async (ticketId: string) => {
    setLoadingAnexos(true);
    try {
      const res = await apiFetch(`${API}/tickets/${ticketId}/anexos`);
      if (!res.ok) throw new Error("Falha ao buscar anexos");
      const data = await res.json();
      setAnexos(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Falha ao carregar anexos.", { description: errMsg });
    } finally {
      setLoadingAnexos(false);
    }
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
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
      const data: Ticket = await res.json();

      (data.mensagens ?? []).forEach((m) => knownIds.current.add(m.id));

      setTicket(data);
      setStatus(data.status);
      setPrioridade(data.prioridade);
      setNivel(data.nivel);
      setResponsavelId(data.responsavelId ?? data.responsavel?.id ?? "");

      fetchAnexos(data.id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Falha ao carregar");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id, include, fetchAnexos]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.mensagens?.length]);

  // WebSocket em tempo real — token lido dentro de connect() para ficar fresco
  useEffect(() => {
    if (!id || !API) return;

    let ws: WebSocket | null = null;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const token = typeof window !== "undefined" ? (localStorage.getItem("accessToken") ?? "") : "";
      if (!token) return;
      const wsUrl = API.replace(/^http/, "ws") + `/ws?token=${encodeURIComponent(token)}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        attempt = 0;
        try { ws?.send(JSON.stringify({ type: "hello", chamadoId: id })); } catch {}
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "nova_mensagem" && data.chamadoId === id) {
            if (knownIds.current.has(data.mensagem.id)) return;
            knownIds.current.add(data.mensagem.id);
            setTicket((prev) =>
              prev
                ? { ...prev, mensagens: [...(prev.mensagens ?? []), data.mensagem] }
                : prev
            );
            endRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        } catch (e) {
          if (process.env.NODE_ENV === "development") console.warn("WS parse error:", e);
        }
      };

      ws.onclose = () => {
        const delay = Math.min(1_000 * 2 ** attempt, 30_000);
        attempt++;
        reconnectTimer = setTimeout(connect, delay);
      };
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [id]);

  async function saveEdits(newStatus?: Status) {
    if (!ticket) return;
    try {
      setSaving(true);
      const body = {
        status: newStatus ?? status,
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
      toast.success("Alterações salvas!");
      await load();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      toast.error("Falha ao salvar", { description: errMsg });
    } finally {
      setSaving(false);
    }
  }

  async function sendMessage() {
    if (!ticket || !msg.trim()) return;
    setSending(true);
    try {
      const res = await apiFetch(`${API}/tickets/${ticket.id}/mensagens`, {
        method: "POST",
        body: JSON.stringify({ conteudo: msg.trim() }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || `Erro HTTP ${res.status}`);
      }
      const nova = await res.json();

      if (!knownIds.current.has(nova.id)) {
        knownIds.current.add(nova.id);
        setTicket((prev) =>
          prev ? { ...prev, mensagens: [...(prev.mensagens ?? []), nova] } : prev
        );
      }

      setMsg("");
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      toast.error("Falha ao enviar mensagem", { description: errMsg });
    } finally {
      setSending(false);
    }
  }

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !ticket?.id) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await apiFetch(`${API}/tickets/${ticket.id}/anexos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Erro HTTP ${res.status}` }));
        throw new Error(errorData.error || `Erro HTTP ${res.status}`);
      }
      toast.success(`Arquivo "${selectedFile.name}" enviado com sucesso!`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchAnexos(ticket.id);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Falha ao enviar arquivo.", { description: errMsg });
    } finally {
      setUploading(false);
    }
  }, [selectedFile, ticket?.id, fetchAnexos]);

  if (loading && !ticket) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <LoadingSpinner label="Carregando chamado…" />
      </div>
    );
  }

  if (!ticket) {
    return <div className="p-6 text-sm text-muted-foreground">Chamado não encontrado.</div>;
  }

  const mensagens = (ticket.mensagens ?? [])
    .slice()
    .sort((a, b) => +new Date(a.criadoEm) - +new Date(b.criadoEm));

  const historico = (ticket.historico ?? [])
    .slice()
    .sort((a, b) => +new Date(b.criadoEm) - +new Date(a.criadoEm));

  const camposEspecificosEntries = ticket.camposEspecificos
    ? Object.entries(ticket.camposEspecificos).filter(([, v]) => v)
    : [];

  const dadosAcademicosEntries = ticket.dadosAcademicos
    ? Object.entries(ticket.dadosAcademicos).filter(([, v]) => v)
    : [];

  const isWizardTicket = ticket.origem === "catalogo_wizard_aluno";

  return (
    <div className="px-4 py-2 sm:px-6 lg:px-8">
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{ticket.protocolo ?? `#${ticket.id}`}</div>
            <h1 className="font-grotesk text-xl sm:text-2xl font-semibold tracking-tight line-clamp-2">
              {ticket.titulo}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{ticket.descricao}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0 pt-1">
            <TicketStatusBadge status={ticket.status} />
            <span className="inline-flex items-center gap-2 text-sm border rounded-md px-2 py-1">
              Prioridade {ticket.prioridade}
            </span>
            <span className="inline-flex items-center gap-2 text-xs border rounded-md px-2 py-1">
              Nível {ticket.nivel}
            </span>
          </div>
        </div>

        <div className="mt-4 border-t pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
          <div className="inline-flex items-center gap-2">
            <User className="size-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Criado por:</span>
            <span className="font-medium truncate">{ticket.criadoPor?.nome ?? "—"}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <User className="size-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Responsável:</span>
            <span className="font-medium truncate">{ticket.responsavel?.nome ?? "—"}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Building2 className="size-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Setor:</span>
            <span className="font-medium truncate">{ticket.setor?.nome ?? "—"}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Tag className="size-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Serviço:</span>
            <span className="font-medium truncate">{ticket.servico?.nome ?? "—"}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <User className="size-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium truncate">{ticket.cliente?.nome ?? "—"}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Clock className="size-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Atualizado:</span>
            <span className="font-medium truncate">
              {new Date(ticket.atualizadoEm).toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Roteamento do Catálogo — visível apenas para chamados do wizard */}
      {isWizardTicket && (
        <div className="rounded-xl border border-[var(--border)] bg-card mb-6">
          <div className="p-3 border-b border-[var(--border)] flex items-center gap-2">
            <Route className="size-4 text-[var(--brand-red)]" />
            <div className="font-semibold">Roteamento do Catálogo</div>
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Wizard do aluno</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            {ticket.catalogoCategoriaNome && (
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Processo / Serviço</div>
                <div className="font-medium">{ticket.catalogoCategoriaNome}</div>
              </div>
            )}
            {ticket.setorProvavel && (
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Setor de destino inicial</div>
                <div className="font-medium">{ticket.setorProvavel}</div>
              </div>
            )}
            {ticket.catalogoServicoId && (
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">ID do serviço (catálogo)</div>
                <div className="font-mono text-xs bg-muted px-2 py-1 rounded">{ticket.catalogoServicoId}</div>
              </div>
            )}
            {ticket.setor && (
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Setor atribuído (atual)</div>
                <div className="font-medium text-green-700 dark:text-green-400">{ticket.setor.nome}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* layout: chat/anexos à esquerda, gestão/histórico à direita */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ESQUERDA: Chat + Campos específicos + Anexos */}
        <div className="xl:col-span-8 space-y-6">
          {/* CHAT */}
          <section className="rounded-xl border border-[var(--border)] bg-card flex flex-col">
            <div className="p-3 border-b border-[var(--border)] flex items-center gap-2">
              <MessageSquareText className="size-4 text-[var(--brand-red)]" />
              <div className="font-semibold">Chat do Chamado</div>
            </div>

            <div
              ref={chatRef}
              className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[500px] rounded-b-lg scrollbar-thin"
            >
              {mensagens.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center">
                  Sem mensagens ainda.
                </div>
              ) : (
                Array.from(
                  new Map(mensagens.map((m) => [`${m.id}-${m.criadoEm}`, m])).values()
                ).map((m) => {
                  const isAluno = m.autorId === ticket.criadoPorId;
                  const nomeAutor = m.autor?.nome || m.autor?.emailPessoal || (isAluno ? "Aluno" : "Secretaria");
                  return (
                    <div
                      key={`${m.id}-${m.criadoEm}`}
                      className={cx("flex animate-fadeIn", isAluno ? "justify-start" : "justify-end")}
                    >
                      <div
                        className={cx(
                          "relative px-4 py-2 rounded-2xl shadow-sm transition-all max-w-[75%] break-words whitespace-pre-wrap",
                          isAluno
                            ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-sm"
                            : "bg-gradient-to-br from-[#F87171] to-[#E74C3C] text-white dark:from-[#B91C1C] dark:to-[#7F1D1D] rounded-br-sm"
                        )}
                        style={{ overflowWrap: "break-word", wordBreak: "break-word", overflow: "hidden" }}
                      >
                        <div className="text-xs opacity-80 mb-1">
                          {isAluno ? nomeAutor : "Você"} ·{" "}
                          {new Date(m.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="break-words whitespace-pre-wrap leading-relaxed">{m.conteudo}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t border-[var(--border)]">
              <div className="flex items-end gap-2">
                <textarea
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendMessage(); } }}
                  rows={2}
                  placeholder="Escreva uma mensagem… (Ctrl+Enter para enviar)"
                  className="flex-1 max-h-32 rounded-lg border border-[var(--border)] bg-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !msg.trim()}
                  className="h-[56px] px-3 rounded-lg bg-gradient-to-r from-[#F87171] to-[#E74C3C] text-white dark:from-[#B91C1C] dark:to-[#7F1D1D] hover:brightness-95 disabled:opacity-60 inline-flex items-center justify-center shrink-0"
                  title="Enviar"
                >
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
              </div>
            </div>
          </section>

          {/* CAMPOS ESPECÍFICOS DO SERVIÇO */}
          {camposEspecificosEntries.length > 0 && (
            <section className="rounded-xl border border-[var(--border)] bg-card p-4">
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Tag className="size-4" /> Campos específicos do serviço
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {camposEspecificosEntries.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-muted-foreground mb-0.5">{formatarChave(key)}</dt>
                    <dd className="font-medium">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* DADOS ACADÊIMICOS */}
          {dadosAcademicosEntries.length > 0 && (
            <section className="rounded-xl border border-[var(--border)] bg-card p-4">
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <User className="size-4" /> Dados acadêmicos do aluno
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                {dadosAcademicosEntries.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-muted-foreground mb-0.5">{formatarChave(key)}</dt>
                    <dd className="font-medium">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* ANEXOS */}
          <section className="rounded-xl border border-[var(--border)] bg-card p-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Paperclip className="size-4" /> Anexos ({anexos.length})
            </h2>

            {loadingAnexos ? (
              <div className="text-sm text-muted-foreground">
                <LoadingSpinner label="Carregando anexos..." />
              </div>
            ) : anexos.length === 0 ? (
              <div className="text-sm text-muted-foreground border rounded-md p-3 bg-background">
                Nenhum anexo encontrado.
              </div>
            ) : (
              <ul className="space-y-2 mb-4">
                {anexos.map((a) => (
                  <li
                    key={a.id}
                    className="p-2 border rounded-md bg-background flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-medium truncate block">{a.nomeArquivo}</span>
                      <span className="text-xs text-muted-foreground">
                        {(a.tamanhoBytes / 1024).toFixed(1)} KB —{" "}
                        {new Date(a.enviadoEm).toLocaleDateString("pt-BR")} por {a.enviadoPor?.nome ?? "Usuário"}
                      </span>
                    </div>
                    <a
                      href={`${API}/anexos/${a.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-1 h-8 px-2 rounded-md border hover:bg-[var(--muted)] text-xs shrink-0"
                      title="Baixar anexo"
                    >
                      <Download className="size-3.5" /> Baixar
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 pt-4 border-t">
              <h3 className="text-base font-medium mb-2">Adicionar anexo</h3>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                className="hidden"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-background hover:bg-[var(--muted)] text-sm"
                  disabled={uploading}
                >
                  <Paperclip className="size-4" /> Escolher arquivo...
                </button>
                {selectedFile && (
                  <span className="text-sm text-muted-foreground truncate max-w-xs">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="mt-2 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-60 min-w-[140px]"
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {uploading ? "Enviando..." : "Enviar arquivo"}
                </button>
              )}
              <p className="text-xs text-muted-foreground mt-2">Limite por arquivo: 10MB.</p>
            </div>
          </section>
        </div>

        {/* DIREITA: Gestão + Histórico */}
        <aside className="xl:col-span-4 space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-card">
            <div className="p-3 border-b border-[var(--border)] flex items-center gap-2">
              <Pencil className="size-4" />
              <div className="font-semibold">Atribuição & Status</div>
            </div>
            <div className="p-4 space-y-3">
              <label className="text-sm block">
                <span className="text-muted-foreground">Status</span>
                <select
                  className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3 focus:ring-2 focus:ring-[var(--ring)]"
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
                  className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3 focus:ring-2 focus:ring-[var(--ring)]"
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
                  className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3 focus:ring-2 focus:ring-[var(--ring)]"
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
                  placeholder="cuid_xxx"
                  className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-input px-3 focus:ring-2 focus:ring-[var(--ring)]"
                />
              </label>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => saveEdits("RESOLVIDO")}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-md border hover:bg-[var(--muted)] text-sm"
                >
                  <CheckCircle2 className="size-4" /> Marcar como resolvido
                </button>
                <button
                  onClick={() => saveEdits("ABERTO")}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-md border hover:bg-[var(--muted)] text-sm"
                >
                  <RotateCcw className="size-4" /> Reabrir
                </button>
                <button
                  onClick={() => saveEdits()}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-md bg-gradient-to-r from-[#F87171] to-[#E74C3C] text-white dark:from-[#B91C1C] dark:to-[#7F1D1D] hover:brightness-95 disabled:opacity-60 text-sm"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-card">
            <div className="p-3 border-b font-semibold">Histórico de status</div>
            <div className="p-3 space-y-3 max-h-[360px] overflow-y-auto">
              {(ticket.historico ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">Sem histórico.</div>
              ) : (
                historico.map((h) => (
                  <div key={h.id} className="text-sm">
                    <div className="font-medium flex items-center gap-1">
                      {h.de && <TicketStatusBadge status={h.de} />}
                      <span>→</span>
                      <TicketStatusBadge status={h.para} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(h.criadoEm).toLocaleString("pt-BR")}{" "}
                      {h.porUsuario?.nome && ` · por ${h.porUsuario.nome}`}
                      {h.observacao && ` · ${h.observacao}`}
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
