"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
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
import type { Chamado, Status } from "../../../../../utils/types";

/* ================= Constantes ================= */

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

const STATUS_LABELS: Record<Status, string> = {
  ABERTO: "Solicitação recebida pela Fatec.",
  EM_ATENDIMENTO: "Em análise pelo setor responsável.",
  AGUARDANDO_USUARIO: "Aguardando documento ou resposta do aluno.",
  RESOLVIDO: "Solicitação respondida.",
  ENCERRADO: "Atendimento finalizado.",
};

/* ================= Tipos ================= */

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

  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);

  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgLoading, setMsgLoading] = useState(true);

  const knownIds = useRef<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  const [anexos, setAnexos] = useState<AnexoInfo[]>([]);
  const [loadingAnexos, setLoadingAnexos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ===== Scroll ===== */
  function scrollToEnd(smooth = true) {
    setTimeout(
      () => endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" }),
      50,
    );
  }

  /* ===== Fetch Chamado ===== */
  const fetchChamado = useCallback(async () => {
    if (!API || !id) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${API}/tickets/${id}`);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      setChamado(await res.json());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar solicitação.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchChamado(); }, [fetchChamado]);

  /* ===== Fetch Mensagens ===== */
  const fetchMensagens = useCallback(async () => {
    if (!API || !id) return;
    setMsgLoading(true);
    try {
      const res = await apiFetch(
        `${API}/tickets/${id}/mensagens?page=1&pageSize=100&orderDir=asc`,
      );
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      const lista: Mensagem[] = data.mensagens || data.items || [];
      lista.forEach((m) => knownIds.current.add(m.id));
      setMsgs(lista);
      scrollToEnd(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar mensagens.");
    } finally {
      setMsgLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMensagens(); }, [fetchMensagens]);

  /* ===== WebSocket — JWT via ?token= + exponential backoff ===== */
  useEffect(() => {
    if (!API || !id) return;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;

    const wsBase = API.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/ws?token=${encodeURIComponent(token)}`;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => { attempt = 0; };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "nova_mensagem" && data.chamadoId === id) {
            const m: Mensagem = data.mensagem;
            if (knownIds.current.has(m.id)) return;
            knownIds.current.add(m.id);
            setMsgs((prev) => [...prev, m]);
            scrollToEnd();
          }
        } catch {}
      };

      ws.onclose = () => {
        if (destroyed) return;
        // Backoff: 1s, 2s, 4s, 8s … máximo 30s
        const delay = Math.min(1_000 * 2 ** attempt, 30_000);
        attempt++;
        reconnectTimer = setTimeout(connect, delay);
      };
    }

    connect();
    return () => {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [API, id]);

  /* ===== Enviar Mensagem ===== */
  const sendMensagem = useCallback(async () => {
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar mensagem.");
    } finally {
      setMsgSending(false);
    }
  }, [msgText, chamado?.id]);

  /* ===== Fetch Anexos ===== */
  const fetchAnexos = useCallback(async () => {
    if (!API || !id) return;
    setLoadingAnexos(true);
    try {
      const res = await apiFetch(`${API}/tickets/${id}/anexos`);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      setAnexos(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar anexos.");
    } finally {
      setLoadingAnexos(false);
    }
  }, [id]);

  useEffect(() => { fetchAnexos(); }, [fetchAnexos]);

  /* ===== Upload — usa apiFetch (auto-refresh) + validação ===== */
  const handleUpload = useCallback(async () => {
    if (!selectedFile || !chamado?.id || !API) return;

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Arquivo muito grande. Máximo permitido: 10 MB.");
      return;
    }
    if (!ALLOWED_MIME_TYPES.has(selectedFile.type)) {
      toast.error("Tipo de arquivo não permitido.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await apiFetch(`${API}/tickets/${chamado.id}/anexos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      toast.success(`"${selectedFile.name}" enviado com sucesso.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchAnexos();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar arquivo.");
    } finally {
      setUploading(false);
    }
  }, [selectedFile, chamado?.id, fetchAnexos]);

  /* ===== Alterar status — retorna boolean, sem toast de sucesso (caller decide) ===== */
  const atualizarStatus = useCallback(
    async (novoStatus: Status): Promise<boolean> => {
      if (!chamado?.id || !API) return false;
      try {
        const res = await apiFetch(`${API}/tickets/${chamado.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: novoStatus }),
        });
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        await fetchChamado();
        return true;
      } catch (err: unknown) {
        toast.error("Erro ao atualizar status", {
          description: err instanceof Error ? err.message : "Erro desconhecido",
        });
        return false;
      }
    },
    [chamado?.id, fetchChamado],
  );

  /* ===== Confirmação encerramento ===== */
  function confirmarEncerramento() {
    toast.custom((t) => (
      <div className="bg-card border border-[var(--border)] rounded-xl shadow-lg p-4 w-[360px] animate-in fade-in-50">
        <div className="flex items-start gap-3">
          <div className="bg-[#B91C1C]/10 text-[#B91C1C] rounded-full p-2">
            <AlertTriangle className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Deseja finalizar esta solicitação acadêmica?
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-snug">
              Após finalizar, ficará <b>apenas para consulta</b> e{" "}
              <b>não poderá ser reaberta</b>.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => toast.dismiss(t)}
                className="px-3 py-1.5 rounded-md text-sm border border-[var(--border)] hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  toast.dismiss(t);
                  const ok = await atualizarStatus("ENCERRADO");
                  if (ok)
                    toast.success("Solicitação finalizada.", {
                      description: "Disponível apenas para consulta no histórico.",
                    });
                }}
                className="px-3 py-1.5 rounded-md text-sm bg-[#B91C1C] text-white hover:bg-[#991B1B] transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    ));
  }

  /* ===== Confirmação reabertura ===== */
  function confirmarReabertura() {
    toast.custom((t) => (
      <div className="bg-card border border-[var(--border)] rounded-xl shadow-lg p-4 w-[360px] animate-in fade-in-50">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full p-2">
            <RotateCcw className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Reabrir solicitação?</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-snug">
              Voltará para <b>"Em análise pelo setor responsável"</b> e poderá ser
              atualizada novamente.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => toast.dismiss(t)}
                className="px-3 py-1.5 rounded-md text-sm border border-[var(--border)] hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  toast.dismiss(t);
                  const ok = await atualizarStatus("EM_ATENDIMENTO");
                  if (ok)
                    toast.success("Solicitação reaberta.", {
                      description: "Em análise pelo setor responsável.",
                    });
                }}
                className="px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    ));
  }

  /* ===== Render ===== */
  if (loading && !chamado)
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Carregando solicitação acadêmica...
      </div>
    );

  if (!chamado)
    return (
      <div className="text-center py-16 text-muted-foreground">
        Solicitação acadêmica não encontrada.
      </div>
    );

  const isEncerrado = chamado.status === "ENCERRADO";

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
          Minhas solicitações
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
            <span className="whitespace-pre-wrap">{chamado.descricao || "—"}</span>
          </p>
          <p>
            <strong>Status:</strong> {STATUS_LABELS[chamado.status] ?? chamado.status}
          </p>
          <p>
            <strong>Criado em:</strong>{" "}
            {new Date(chamado.criadoEm).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Aviso solicitação respondida */}
      {chamado.status === "RESOLVIDO" && (
        <div className="mt-4 rounded-lg border border-yellow-400/30 bg-yellow-100/20 text-yellow-700 dark:text-yellow-300 dark:bg-yellow-900/20 px-4 py-3 text-sm flex items-start gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4 mt-0.5 shrink-0 text-yellow-500 dark:text-yellow-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M4.93 4.93a10 10 0 1114.14 14.14A10 10 0 014.93 4.93z"
            />
          </svg>
          <div>
            Esta solicitação foi marcada como <b>respondida.</b> <br />
            Você pode <b>reabrir</b> se o problema não foi solucionado ou{" "}
            <b>encerrar</b> definitivamente se estiver tudo certo.
          </div>
        </div>
      )}

      {/* Botões de ação */}
      {chamado.status === "RESOLVIDO" && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={confirmarEncerramento}
            className="px-4 py-2 rounded-md bg-[#B91C1C] text-white text-sm font-medium hover:bg-[#991B1B] transition"
          >
            Finalizar atendimento
          </button>
          <button
            onClick={confirmarReabertura}
            className="px-4 py-2 rounded-md bg-[#374151] text-white text-sm font-medium hover:bg-[#111827] transition"
          >
            Reabrir solicitação
          </button>
        </div>
      )}

      {/* Chat */}
      <section className="rounded-xl border border-[var(--border)] bg-card flex flex-col">
        <div className="p-3 border-b border-[var(--border)] text-xs text-muted-foreground">
          Conversa sobre a solicitação
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[500px] rounded-b-lg scrollbar-thin">
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
                    className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm leading-relaxed transition-all ${
                      isAluno
                        ? "bg-gradient-to-br from-[#F87171] to-[#E74C3C] text-white rounded-br-sm"
                        : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-sm"
                    }`}
                  >
                    <div className="text-xs opacity-80 mb-1">
                      <strong>{isAluno ? "Você" : m.autor?.nome || "Secretaria"}</strong> ·{" "}
                      {new Date(m.criadoEm).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="whitespace-pre-wrap break-words">{m.conteudo}</div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        {!isEncerrado ? (
          <div className="p-3 border-t border-[var(--border)]">
            <div className="flex items-end gap-2">
              <textarea
                className="flex-1 min-h-[90px] rounded-lg border border-[var(--border)] bg-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                placeholder="Escreva sua mensagem para a secretaria/suporte…"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendMensagem();
                }}
                disabled={msgSending}
              />
              <button
                onClick={sendMensagem}
                disabled={msgSending || msgText.trim().length === 0}
                className="h-[90px] px-4 rounded-lg bg-gradient-to-r from-[#F87171] to-[#E74C3C] text-white hover:brightness-95 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {msgSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Enviar
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t text-center text-sm text-muted-foreground">
            🔒 Atendimento finalizado. Solicitação disponível apenas para consulta.
          </div>
        )}
      </section>

      {/* Anexos */}
      <section id="anexos" className="rounded-xl border border-[var(--border)] bg-card p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Paperclip className="size-4" /> Anexos ({anexos.length})
        </h2>

        {loadingAnexos ? (
          <div className="text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin inline mr-1" /> Carregando anexos...
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
                    {(a.tamanhoBytes / 1024).toFixed(1)} KB ·{" "}
                    {new Date(a.enviadoEm).toLocaleDateString("pt-BR")}
                    {a.enviadoPor?.nome ? ` · ${a.enviadoPor.nome}` : ""}
                  </span>
                </div>
                <a
                  href={`${API}/anexos/${a.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1 h-8 px-2 rounded-md border hover:bg-[var(--muted)] text-xs shrink-0"
                >
                  <Download className="size-3.5" /> Baixar
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Upload */}
        {!isEncerrado && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-base font-medium mb-2">Adicionar anexo</h3>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={Array.from(ALLOWED_MIME_TYPES).join(",")}
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
            <p className="text-xs text-muted-foreground mt-2">
              Máximo 10 MB · PDF, Word, Excel, imagens, TXT
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
