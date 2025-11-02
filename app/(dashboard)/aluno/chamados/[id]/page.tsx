"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Loader2,
  Send,
  Paperclip,
  Download,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../../../../utils/api";

/* ================= Tipos ================= */
type Chamado = {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  criadoEm: string;
  protocolo?: string | null;
  criadoPorId?: string | null;
};

type Mensagem = {
  id: string;
  conteudo: string;
  criadoEm: string;
  autorId?: string | null;
  autor?: { id: string; nome?: string | null; emailPessoal?: string | null } | null;
};

type AnexoInfo = {
  id: string;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  enviadoEm: string;
  enviadoPor?: { id: string; nome?: string | null } | null;
};

/* ================ Página ================ */
export default function ChamadoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL, []);
  const API = apiBase;

  // Chamado
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);

  // Mensagens
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgLoading, setMsgLoading] = useState(true);

  // WS / UX
  const [socketConnected, setSocketConnected] = useState(false);
  const knownIds = useRef<Set<string>>(new Set()); // evita duplicação
  const endRef = useRef<HTMLDivElement>(null);

  // Anexos
  const [anexos, setAnexos] = useState<AnexoInfo[]>([]);
  const [loadingAnexos, setLoadingAnexos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ============ Helpers ============ */
  function scrollToEnd(smooth = true) {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }, 50);
  }

  /* ============ Fetch Chamado ============ */
  useEffect(() => {
    async function fetchChamado() {
      try {
        if (!API || !id) return;
        setLoading(true);
        const res = await apiFetch(`${API}/tickets/${id}`);
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const data: Chamado = await res.json();
        setChamado(data);
      } catch (err: any) {
        toast.error(err.message || "Erro ao carregar chamado.");
      } finally {
        setLoading(false);
      }
    }
    fetchChamado();
  }, [API, id]);

  /* ============ Fetch Mensagens ============ */
  async function fetchMensagens(ticketId: string) {
    if (!API) return;
    setMsgLoading(true);
    try {
      const res = await apiFetch(
        `${API}/tickets/${ticketId}/mensagens?page=1&pageSize=100&orderDir=asc`
      );
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      const lista: Mensagem[] = data.mensagens || data.items || [];
      // popular knownIds para deduplicar futuras mensagens
      lista.forEach((m) => knownIds.current.add(m.id));
      setMsgs(lista);
      scrollToEnd(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar mensagens.");
    } finally {
      setMsgLoading(false);
    }
  }

  useEffect(() => {
    if (API && id) fetchMensagens(id);
  }, [API, id]);

  /* ============ WebSocket Tempo Real ============ */
  useEffect(() => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId || !API) return;

    const wsUrl = API.replace(/^http/, "ws") + `/ws?userId=${userId}`;
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    function connectWS() {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => setSocketConnected(true);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "connection_ok") return;
          if (data.type === "nova_mensagem" && data.chamadoId === id) {
            const m: Mensagem = data.mensagem;
            if (knownIds.current.has(m.id)) return; // evita duplicação
            knownIds.current.add(m.id);
            setMsgs((prev) => [...prev, m]);
            scrollToEnd();
          }
        } catch (e) {
          console.error("Erro ao processar WS:", e);
        }
      };

      ws.onerror = () => setSocketConnected(false);
      ws.onclose = () => {
        setSocketConnected(false);
        reconnectTimer = setTimeout(connectWS, 4000);
      };
    }

    connectWS();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [API, id]);

  /* ============ Enviar Mensagem ============ */
  async function sendMensagem() {
    if (!msgText.trim() || !chamado?.id || !API) return;
    setMsgSending(true);
    try {
      const res = await apiFetch(`${API}/tickets/${chamado.id}/mensagens`, {
        method: "POST",
        body: JSON.stringify({ conteudo: msgText.trim() }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const novaMsg: Mensagem = await res.json();

      if (!knownIds.current.has(novaMsg.id)) {
        knownIds.current.add(novaMsg.id);
        setMsgs((prev) => [...prev, novaMsg]);
      }

      setMsgText("");
      scrollToEnd();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar mensagem.");
    } finally {
      setMsgSending(false);
    }
  }

  /* ============ Anexos ============ */
  async function fetchAnexos(ticketId: string) {
    if (!API) return;
    setLoadingAnexos(true);
    try {
      const res = await apiFetch(`${API}/tickets/${ticketId}/anexos`);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      setAnexos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar anexos.");
    } finally {
      setLoadingAnexos(false);
    }
  }

  useEffect(() => {
    if (API && id) fetchAnexos(id);
  }, [API, id]);

  async function handleUpload() {
    if (!selectedFile || !chamado?.id || !API) return;
    setUploading(true);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`${API}/tickets/${chamado.id}/anexos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || `Erro HTTP ${res.status}`);
      }

      toast.success(`Arquivo "${selectedFile.name}" enviado!`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchAnexos(chamado.id);
    } catch (err: any) {
      toast.error(err.message || "Falha ao enviar arquivo.");
    } finally {
      setUploading(false);
    }
  }

  /* ============ Render ============ */
  if (loading && !chamado) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Carregando chamado...
      </div>
    );
  }

  if (!chamado) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Chamado não encontrado.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 rounded-xl border border-[var(--border)] bg-card space-y-8">
      {/* Topbar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-background hover:bg-muted text-sm"
        >
          <ChevronLeft className="size-4" /> Voltar
        </button>

        <Link
          href="/aluno/chamados"
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-background hover:bg-muted text-sm"
        >
          Lista de chamados
        </Link>
      </div>

      {/* Cabeçalho */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1">{chamado.titulo}</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Protocolo: {chamado.protocolo ?? `#${chamado.id}`}
        </p>

        <div className="space-y-2 text-sm border-t border-b py-4">
          <p>
            <strong>Descrição:</strong>{" "}
            <span className="whitespace-pre-wrap">{chamado.descricao}</span>
          </p>
          <p>
            <strong>Status:</strong> {chamado.status}
          </p>
          <p>
            <strong>Criado em:</strong>{" "}
            {new Date(chamado.criadoEm).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {/* CHAT – visual igual ao da secretaria */}
      <section className="rounded-xl border border-[var(--border)] bg-card flex flex-col">
        <div className="p-3 border-b border-[var(--border)] flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Chat do chamado</span>
        </div>

        <div
          className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[500px] rounded-b-lg scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
        >
          {msgLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" />
              Carregando mensagens...
            </div>
          ) : msgs.length === 0 ? (
            <div className="text-sm text-muted-foreground border rounded-md p-3 bg-background text-center">
              Nenhuma mensagem por aqui ainda.
            </div>
          ) : (
            msgs.map((m) => {
              const isAluno = m.autorId === chamado.criadoPorId;
              return (
                <div
                  key={`${m.id}-${m.criadoEm}`}
                  className={`flex ${isAluno ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm leading-relaxed transition-all
                      ${isAluno
                        ? "bg-gradient-to-br from-[#F87171] to-[#E74C3C] text-white rounded-br-sm"
                        : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-sm"
                      }`}
                    style={{ overflowWrap: "break-word", wordBreak: "break-word" }}
                  >
                    <div className="text-xs opacity-80 mb-1">
                      <strong>{isAluno ? "Você" : (m.autor?.nome || "Secretaria")}</strong> ·{" "}
                      {new Date(m.criadoEm).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="whitespace-pre-wrap break-words">
                      {m.conteudo}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="flex items-end gap-2">
            <textarea
              className="flex-1 min-h-[90px] rounded-lg border border-[var(--border)] bg-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="Escreva sua mensagem para a secretaria/suporte…"
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              disabled={msgSending}
            />
            <button
              onClick={sendMensagem}
              disabled={msgSending || msgText.trim().length === 0}
              className="h-[90px] px-4 rounded-lg bg-gradient-to-r from-[#F87171] to-[#E74C3C] text-white hover:brightness-95 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              title="Enviar"
            >
              {msgSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Enviar
            </button>
          </div>
        </div>
      </section>

      {/* ANEXOS */}
      <section id="anexos" className="rounded-xl border border-[var(--border)] bg-card p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Paperclip className="size-4" /> Anexos ({anexos.length})
        </h2>

        {loadingAnexos ? (
          <div className="text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin inline mr-1" />
            Carregando anexos...
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
                    {(a.tamanhoBytes / 1024).toFixed(1)} KB · {new Date(a.enviadoEm).toLocaleDateString("pt-BR")}
                    {a.enviadoPor?.nome ? ` · ${a.enviadoPor.nome}` : ""}
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

        {/* Upload */}
        <div className="mt-4 pt-4 border-t">
          <h3 className="text-base font-medium mb-2">Adicionar anexo</h3>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-background hover:bg-[var(--muted)] text-sm"
              disabled={uploading}
            >
              <Paperclip className="size-4" /> Escolher arquivo…
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
              disabled={uploading}
              className="mt-2 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-60 min-w-[140px]"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {uploading ? "Enviando..." : "Enviar arquivo"}
            </button>
          )}
          <p className="text-xs text-muted-foreground mt-2">Limite por arquivo: 10MB (exemplo).</p>
        </div>
      </section>
    </div>
  );
}
