"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../../../utils/api";
import Link from "next/link";
import {
  Search, Loader2, MessageSquareText, SendHorizonal, Paperclip, Building2, User, Clock, Info
} from "lucide-react";

import { cx } from '../../../../utils/cx'
import TicketStatusBadge from "../../../components/shared/TicketStatusBadge";

/* =========================
   Tipos (ajuste conforme seu backend)
   ========================= */
type Status = "ABERTO" | "EM_ATENDIMENTO" | "AGUARDANDO_USUARIO" | "RESOLVIDO" | "ENCERRADO";

type ChamadoSummary = {
  id: string;
  protocolo?: string | null;
  titulo: string;
  status: Status;
  setor?: { nome?: string | null } | null;
  mensagensNaoLidas?: number | null;
  ultimoMsgEm?: string | null;
};

type Mensagem = {
  id: string;
  chamadoId: string;
  autorId: string;
  conteudo: string;
  criadoEm: string; // ISO
  autor?: { nome?: string | null; papel?: string | null } | null;
};

type Me = { id: string; nome?: string | null };

/* =========================
   Utils
   ========================= 
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}*/
function shortDateTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " +
         d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/* =========================
   Página
   ========================= */
export default function AdminMensagensPage() {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [me, setMe] = useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [loadingList, setLoadingList] = useState(true);
  const [conversas, setConversas] = useState<ChamadoSummary[]>([]);
  const [q, setQ] = useState("");

  const [currentId, setCurrentId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Mensagem[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const chatRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<any>(null);

  /* ---- Carrega usuário atual ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await apiFetch(`${API}/auth/me`, { cache: "no-store" });
        const d = await r.json();
        if (!alive) return;
        setMe({ id: d?.id, nome: d?.nome });
      } catch {
        setMe(null);
      } finally {
        if (alive) setLoadingMe(false);
      }
    })();
    return () => { alive = false; };
  }, [API]);

  /* ---- Carrega lista de conversas (chamados) ---- */
  const fetchConversas = useCallback(async () => {
    try {
      setLoadingList(true);
      // ✅ endpoint de tickets: inclua o que precisar na lista (setor e último evento)
      const url = `${API}/tickets?include=setor&page=1&pageSize=100&orderBy=criadoEm&orderDir=desc`;
      const res = await apiFetch(url, { cache: "no-store" });
      const data = await res.json();

      const items: ChamadoSummary[] = (data?.items ?? []).map((c: any) => ({
        id: c.id,
        protocolo: c.protocolo,
        titulo: c.titulo,
        status: c.status,
        setor: c.setor ?? null,
        mensagensNaoLidas: c.mensagensNaoLidas ?? 0, // se o backend ainda não envia, ficará 0
        ultimoMsgEm: c.ultimoMsgEm ?? c.criadoEm ?? null,
      }));

      // Ordena por última mensagem desc (se existir)
      items.sort((a, b) => +new Date(b.ultimoMsgEm ?? 0) - +new Date(a.ultimoMsgEm ?? 0));

      setConversas(items);
      // se nada selecionado, seleciona a primeira
      if (!currentId && items.length > 0) setCurrentId(items[0].id);
    } finally {
      setLoadingList(false);
    }
  }, [API, currentId]);

  useEffect(() => {
    fetchConversas();
  }, [fetchConversas]);

  /* ---- Carrega mensagens do chamado selecionado ---- */
  const fetchMessages = useCallback(async (id: string) => {
    try {
      setLoadingMsgs(true);
      // ✅ ajuste a rota para sua API real de mensagens:
      // suposição: GET /tickets/:id/mensagens?order=asc&page=1&pageSize=50
      const res = await apiFetch(`${API}/tickets/${id}/mensagens?order=asc&page=1&pageSize=50`, {
        cache: "no-store",
      });
      const data = await res.json();
      const list: Mensagem[] = (data?.items ?? data ?? []).map((m: any) => ({
        id: m.id,
        chamadoId: m.chamadoId ?? id,
        autorId: m.autorId,
        conteudo: m.conteudo,
        criadoEm: m.criadoEm,
        autor: m.autor ?? null,
      }));
      setMessages(list);
      // marca como lidas (se houver endpoint)
      // try { await apiFetch(`${API}/tickets/${id}/mensagens/lidas`, { method: "POST", body: JSON.stringify({ ateId: list.at(-1)?.id })}); } catch {}
      // scroll ao final
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight }), 0);
    } finally {
      setLoadingMsgs(false);
    }
  }, [API]);

  useEffect(() => {
    if (currentId) fetchMessages(currentId);
  }, [currentId, fetchMessages]);

  /* ---- Polling de novas mensagens ---- */
  useEffect(() => {
    if (!currentId) return;
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchMessages(currentId).catch(() => {});
      fetchConversas().catch(() => {});
    }, 15000);
    return () => clearInterval(pollRef.current);
  }, [currentId, fetchMessages, fetchConversas]);

  /* ---- Enviar mensagem ---- */
  const handleSend = async () => {
    const v = text.trim();
    if (!v || !currentId || sending) return;
    const tempId = `tmp-${Date.now()}`;

    // UI otimista
    const optimistic: Mensagem = {
      id: tempId,
      chamadoId: currentId,
      autorId: me?.id ?? "me",
      conteudo: v,
      criadoEm: new Date().toISOString(),
      autor: { nome: me?.nome ?? "Você" },
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 0);

    try {
      setSending(true);
      // ✅ ajuste a rota real do seu backend:
      // POST /tickets/:id/mensagens { conteudo }
      const res = await apiFetch(`${API}/tickets/${currentId}/mensagens`, {
        method: "POST",
        body: JSON.stringify({ conteudo: v }),
      });
      const saved = await res.json();
      // troca o otimista pelo salvo
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...saved, autor: saved.autor ?? m.autor } : m))
      );
      // atualiza lista
      fetchConversas().catch(() => {});
    } catch {
      // reverte em caso de erro
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(v);
    } finally {
      setSending(false);
    }
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return conversas;
    return conversas.filter((c) => {
      const s = c.setor?.nome?.toLowerCase() ?? "";
      return (
        (c.protocolo ?? "").toLowerCase().includes(t) ||
        c.titulo.toLowerCase().includes(t) ||
        s.includes(t)
      );
    });
  }, [q, conversas]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
      {/* =========== LISTA DE CONVERSAS =========== */}
      <aside className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
        <div className="p-3 border-b border-[var(--border)]">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Buscar por protocolo, título ou setor"
              className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-[calc(100dvh-320px)] lg:max-h-[calc(100dvh-220px)] overflow-auto">
          {loadingList ? (
            <div className="p-6 text-center text-muted-foreground">
              <Loader2 className="size-4 animate-spin inline-block mr-2" />
              Carregando conversas…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              Nenhuma conversa encontrada.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {filtered.map((c) => {
                const active = currentId === c.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setCurrentId(c.id)}
                      className={cx(
                        "w-full text-left px-3 py-3 hover:bg-[var(--muted)]/60 transition",
                        active && "bg-[var(--muted)]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">
                            {c.protocolo ?? `#${c.id}`}
                          </div>
                          <div className="font-medium line-clamp-1">{c.titulo}</div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="size-3" />
                              {c.setor?.nome ?? "—"}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3" />
                              {shortDateTime(c.ultimoMsgEm)}
                            </span>
                          </div>
                        </div>
                        {c.mensagensNaoLidas ? (
                          <span className="rounded-full bg-primary text-primary-foreground h-5 min-w-5 px-1 grid place-items-center text-[11px]">
                            {c.mensagensNaoLidas > 99 ? "99+" : c.mensagensNaoLidas}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* =========== CHAT =========== */}
      <section className="rounded-xl border border-[var(--border)] bg-card flex flex-col min-h-[480px]">
        {/* Cabeçalho do chat */}
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          {!currentId ? (
            <div className="text-muted-foreground text-sm">Selecione uma conversa ao lado</div>
          ) : loadingMsgs ? (
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando mensagens…
            </div>
          ) : (
            <ChatHeader conversas={conversas} currentId={currentId} />
          )}
        </div>

        {/* Lista de mensagens */}
        <div ref={chatRef} className="flex-1 overflow-auto px-3 py-4">
          {!currentId ? (
            <EmptyHint />
          ) : loadingMsgs ? (
            <div className="p-6 text-center text-muted-foreground">
              <Loader2 className="size-4 animate-spin inline-block mr-2" />
              Carregando…
            </div>
          ) : messages.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              Sem mensagens ainda. Envie a primeira abaixo.
            </div>
          ) : (
            <div className="space-y-2">
                {messages.map((m) => (
                <Bubble
                    key={`${m.id}-${m.criadoEm}`} // 🔹 garante unicidade mesmo em mensagens otimizadas
                    isMe={m.autorId === me?.id}
                    nome={m.autor?.nome || (m.autorId === me?.id ? "Você" : "Usuário")}
                    conteudo={m.conteudo}
                    quando={shortDateTime(m.criadoEm)}
                />
                ))}

            </div>
          )}
        </div>

        {/* Composer */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="flex items-end gap-2">
            <button
              type="button"
              title="Anexar arquivo (em breve)"
              className="h-10 w-10 inline-grid place-items-center rounded-lg border border-[var(--border)] bg-background text-muted-foreground"
              disabled
            >
              <Paperclip className="size-4" />
            </button>

            <textarea
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={currentId ? "Escreva uma mensagem…" : "Selecione uma conversa para escrever…"}
              disabled={!currentId || sending}
              className="flex-1 resize-none h-10 max-h-36 px-3 py-2 rounded-lg border border-[var(--border)] bg-input focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!currentId || !text.trim() || sending}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-60"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizonal className="size-4" />}
              Enviar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================
   Subcomponentes
   ========================= */
function ChatHeader({ conversas, currentId }: { conversas: ChamadoSummary[]; currentId: string }) {
  const c = useMemo(() => conversas.find((x) => x.id === currentId), [conversas, currentId]);
  if (!c) return null;
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{c.protocolo ?? `#${c.id}`}</div>
      <div className="font-medium leading-tight line-clamp-1">{c.titulo}</div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MessageSquareText className="size-3" />
          Conversa do chamado
        </span>
        <span>•</span>
        <span className="inline-flex items-center gap-1">
          <Building2 className="size-3" />
          {c.setor?.nome ?? "—"}
        </span>
        <span>•</span>
        <TicketStatusBadge status={c.status} />
      </div>
    </div>
  );
}

function Bubble({
  isMe,
  nome,
  conteudo,
  quando,
}: {
  isMe?: boolean;
  nome: string;
  conteudo: string;
  quando: string;
}) {
  return (
    <div className={cx("flex", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm border",
          isMe
            ? "bg-primary text-primary-foreground border-transparent"
            : "bg-background border-[var(--border)]"
        )}
      >
        <div className={cx("text-[11px] mb-0.5", isMe ? "opacity-85" : "text-muted-foreground")}>{nome}</div>
        <div className="whitespace-pre-wrap break-words">{conteudo}</div>
        <div className={cx("text-[10px] mt-1", isMe ? "opacity-85" : "text-muted-foreground")}>{quando}</div>
      </div>
    </div>
  );
}

/*function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string }> = {
    ABERTO: { label: "Aberto", cls: "bg-[var(--brand-cyan)]/12 text-[var(--brand-cyan)] border-[var(--brand-cyan)]/30" },
    EM_ATENDIMENTO: { label: "Em atendimento", cls: "bg-[var(--brand-teal)]/12 text-[var(--brand-teal)] border-[var(--brand-teal)]/30" },
    AGUARDANDO_USUARIO: { label: "Aguardando usuário", cls: "bg-[var(--warning)]/12 text-[var(--warning)] border-[var(--warning)]/30" },
    RESOLVIDO: { label: "Resolvido", cls: "bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/30" },
    ENCERRADO: { label: "Encerrado", cls: "bg-[var(--muted)] text-muted-foreground border-[var(--border)]" },
  };
  const v = map[status];
  return (
    <span className={cx("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border", v.cls)}>
      {v.label}
    </span>
  );
}*/

function EmptyHint() {
  return (
    <div className="p-6 border border-dashed border-[var(--border)] rounded-xl text-center text-sm text-muted-foreground">
      <div className="inline-flex items-center gap-2 mb-1">
        <Info className="size-4" /> Nenhuma conversa selecionada
      </div>
      <div>Escolha um chamado ao lado para ver e enviar mensagens.</div>
    </div>
  );
}
