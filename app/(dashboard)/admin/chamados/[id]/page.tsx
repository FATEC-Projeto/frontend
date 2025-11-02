"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Send, CheckCircle2, RotateCcw, Pencil, Save, MessageSquareText,
} from "lucide-react";
import { apiFetch } from "../../../../../utils/api";

/* ===== Tipos ===== */
type Nivel = "N1" | "N2" | "N3";
type Status = "ABERTO" | "EM_ATENDIMENTO" | "AGUARDANDO_USUARIO" | "RESOLVIDO" | "ENCERRADO";
type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

type UsuarioMin = { id: string; nome?: string | null; emailPessoal?: string | null };
type Chamado = {
  id: string;
  protocolo?: string | null;
  titulo: string;
  descricao: string;
  nivel: Nivel;
  status: Status;
  prioridade: Prioridade;
  criadoPorId: string;
  criadoEm: string;
  responsavelId?: string | null;
  mensagens?: {
    id: string;
    conteudo: string;
    criadoEm: string;
    autorId: string;
    autor?: UsuarioMin | null;
  }[];
  historico?: {
    id: string;
    de: Status | null;
    para: Status;
    criadoEm: string;
    porUsuario?: UsuarioMin | null;
    observacao?: string | null;
  }[];
};

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

/* ===== Página ===== */
export default function AdminChamadoPage() {
  const { id } = useParams<{ id: string }>();
  const API = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [ticket, setTicket] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<Status>("ABERTO");
  const [prioridade, setPrioridade] = useState<Prioridade>("MEDIA");
  const [nivel, setNivel] = useState<Nivel>("N1");
  const [responsavelId, setResponsavelId] = useState<string>("");

  const knownIds = useRef<Set<string>>(new Set());

  async function load() {
    try {
      setLoading(true);
      const res = await apiFetch(`${API}/tickets/${id}?include=mensagens,historico,criadoPor,responsavel`);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      (data.mensagens ?? []).forEach((m: any) => knownIds.current.add(m.id));
      setTicket(data);
      setStatus(data.status);
      setPrioridade(data.prioridade);
      setNivel(data.nivel);
      setResponsavelId(data.responsavelId ?? "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight }); }, [ticket?.mensagens?.length]);

  // === WebSocket em tempo real ===
  useEffect(() => {
    if (!id || !API) return;
    const userId = localStorage.getItem("userId") || "secretaria";
    const wsUrl = API.replace(/^http/, "ws") + `/ws?userId=${userId}`;
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    function connect() {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => ws?.send(JSON.stringify({ type: "hello", chamadoId: id }));
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "nova_mensagem" && data.chamadoId === id) {
            if (knownIds.current.has(data.mensagem.id)) return;
            knownIds.current.add(data.mensagem.id);
            setTicket((prev) =>
              prev ? { ...prev, mensagens: [...(prev.mensagens ?? []), data.mensagem] } : prev
            );
            chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
          }
        } catch (err) {
          console.error("Erro WS:", err);
        }
      };
      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 4000);
      };
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [id, API]);

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
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      await load();
      setFeedback("✅ Alterações salvas com sucesso!");
      setTimeout(() => setFeedback(null), 2000);
    } catch (e) {
      console.error(e);
      setFeedback("❌ Falha ao salvar alterações.");
      setTimeout(() => setFeedback(null), 2000);
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
      const nova = await res.json();
      knownIds.current.add(nova.id);
      setTicket((prev) =>
        prev ? { ...prev, mensagens: [...(prev.mensagens ?? []), nova] } : prev
      );
      setMsg("");
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  

  if (loading)
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando chamado…
      </div>
    );

  if (!ticket)
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Chamado não encontrado.
      </div>
    );

  const mensagens = (ticket.mensagens ?? []).slice().sort((a, b) => +new Date(a.criadoEm) - +new Date(b.criadoEm));
  const historico = (ticket.historico ?? []).slice().sort((a, b) => +new Date(b.criadoEm) - +new Date(a.criadoEm));

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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* CHAT */}
<section className="xl:col-span-8 rounded-xl border border-[var(--border)] bg-card flex flex-col">
  {/* Cabeçalho */}
  <div className="p-3 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <div className="flex items-center gap-2">
      <MessageSquareText className="size-4 text-[var(--brand-red)]" />
      <div className="font-semibold truncate">Chat do Chamado</div>
    </div>
    <div className="text-xs text-muted-foreground text-right sm:text-left">
      <span className="font-medium text-foreground">
        {ticket.protocolo ? `Protocolo #${ticket.protocolo}` : `#${ticket.id}`}
      </span>{" "}
      — {ticket.titulo}
    </div>
  </div>

  <div
    ref={chatRef}
    className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[500px] rounded-b-lg 
               scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent 
               bg-white/90 dark:bg-gray-900/60 shadow-inner"
  >
    {(() => {
      const mensagensUnicas = Array.from(
        new Map(
          (mensagens ?? []).map((m) => [`${m.id}-${m.criadoEm}`, m])
        ).values()
      );

      if (mensagensUnicas.length === 0) {
        return (
          <div className="text-sm text-muted-foreground border rounded-md p-3 text-center">
            Nenhuma mensagem por aqui ainda.
          </div>
        );
      }
      return mensagensUnicas.map((m) => {
        const currentUserId =
          typeof window !== "undefined" ? localStorage.getItem("userId") : null;
        const isAutor = m.autorId === currentUserId;
        const nomeAutor = isAutor
          ? "Você"
          : m.autor?.nome || m.autor?.emailPessoal || `ID: ${m.autorId}`;
      
        return (
          <div
            key={`${m.id}-${m.criadoEm}`}
            className={`flex ${isAutor ? "justify-end" : "justify-start"} animate-fadeIn`}
          >
            <div
              className={`relative px-4 py-2 rounded-2xl shadow-sm transition-all max-w-[75%] 
                          break-words whitespace-pre-wrap
                ${
                  isAutor
                    ? "bg-gradient-to-br from-[#F87171] to-[#E74C3C] text-white dark:from-[#B91C1C] dark:to-[#7F1D1D] rounded-br-sm"
                    : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-sm"
                }`}
            >
              <div className="text-xs opacity-80 mb-1">
                <strong>{nomeAutor}</strong> ·{" "}
                {new Date(m.criadoEm).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="break-words whitespace-pre-wrap leading-relaxed">
                {m.conteudo}
              </div>
            </div>
          </div>
        );
      });
    })()}
  </div>

  {/* Campo de envio */}
  <div className="flex flex-col">
    <textarea
      className="min-h-[90px] w-full rounded-md border bg-background p-2 focus:ring-2 focus:ring-[#E74C3C]"
      placeholder="Escreva sua mensagem para o solicitante do chamado"
      value={msg}
      onChange={(e) => setMsg(e.target.value)}
    />
    <div className="flex justify-end mt-2">
      <button
        onClick={sendMessage}
        disabled={sending || msg.trim().length === 0}
        className="inline-flex items-center gap-2 rounded-md px-4 py-2 
                         bg-gradient-to-br from-[#E74C3C] to-[#F87171] 
                         hover:from-[#DC2626] hover:to-[#B91C1C] 
                         dark:from-[#B91C1C] dark:to-[#7F1D1D] 
                         dark:hover:from-[#DC2626] dark:hover:to-[#991B1B]
                         text-white disabled:opacity-60 transition-all"
            >
        {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Enviar
      </button>
    </div>
    <p className="text-xs text-muted-foreground text-right mt-1">
    </p>
  </div>
</section>

      {/* GESTÃO */}
                <aside className="xl:col-span-4 space-y-6">
          {feedback && (
            <div
              className={cx(
                "p-2 rounded-md text-sm text-center",
                feedback.startsWith("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              )}
            >
              {feedback}
            </div>
          )}

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
                (ticket.historico ?? [])
                  .slice()
                  .sort((a, b) => +new Date(b.criadoEm) - +new Date(a.criadoEm))
                  .map((h) => (
                    <div key={h.id} className="text-sm">
                      <div className="font-medium flex items-center gap-1">
                        {h.de && <BadgeStatus s={h.de} />}
                        <span>→</span>
                        <BadgeStatus s={h.para} />
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
