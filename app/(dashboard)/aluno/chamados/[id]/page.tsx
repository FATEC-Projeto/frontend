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
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, downloadAnexo, fetchAnexoImageUrl } from "../../../../../utils/api";
import type { Chamado, Status } from "../../../../../utils/types";

/* ================= Constantes ================= */

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
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

type DadosAcademicosUser = {
  ra?: string | null;
  unidadeFatec?: string | null;
  curso?: string | null;
  turno?: string | null;
  turma?: string | null;
  semestreAtual?: string | number | null;
  situacaoAcademica?: string | null;
  coordenadorCurso?: string | null;
};

/** Imagem de anexo com download autenticado */
function AnexoImagem({ anexoId, alt }: { anexoId: string; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    fetchAnexoImageUrl(anexoId).then((u) => {
      url = u;
      if (u) setSrc(u);
    });
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [anexoId]);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className="w-full max-h-48 object-contain bg-[var(--muted)]"
      loading="lazy"
    />
  );
}

type MensagemGroup = {
  autorId: string | null;
  isAluno: boolean;
  nomeAutor: string;
  msgs: Mensagem[];
};

/* ================= Helpers ================= */

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1_000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ontem";
  if (d < 7) return `há ${d} dias`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function groupMensagens(msgs: Mensagem[], criadoPorId?: string): MensagemGroup[] {
  const groups: MensagemGroup[] = [];
  for (const m of msgs) {
    const autorId = m.autorId ?? null;
    const isAluno = autorId === criadoPorId;
    const nomeAutor = isAluno ? "Você" : (m.autor?.nome ?? "Secretaria");
    const last = groups[groups.length - 1];
    if (last && last.autorId === autorId) {
      last.msgs.push(m);
    } else {
      groups.push({ autorId, isAluno, nomeAutor, msgs: [m] });
    }
  }
  return groups;
}

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

  const [isDragging, setIsDragging] = useState(false);
  const [dadosAcademicos, setDadosAcademicos] = useState<DadosAcademicosUser | null>(null);

  /* ===== Scroll ===== */
  function scrollToEnd(smooth = true) {
    setTimeout(
      () => endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" }),
      50,
    );
  }

  /* ===== Fetch Chamado ===== */
  const fetchChamado = useCallback(async () => {
    if (!id) { setLoading(false); return; }
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

  /* ===== Dados acadêmicos básicos do aluno ===== */
  useEffect(() => {
    apiFetch(`${API}/auth/me`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: DadosAcademicosUser | null) => {
        if (data) setDadosAcademicos(data);
      })
      .catch(() => {});
  }, []);

  /* ===== Fetch Mensagens ===== */
  const fetchMensagens = useCallback(async () => {
    if (!id) { setMsgLoading(false); return; }
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

  /* ===== WebSocket — auth por handshake no 1º frame + backoff ===== */
  useEffect(() => {
    if (!id) return;
    // Com API vazio (modo proxy), conecta na mesma origem — funciona quando o
    // reverse proxy encaminha /ws; o backoff cobre o caso de não encaminhar.
    const wsBase = (API || window.location.origin).replace(/^http/, "ws");

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      // Lê token fresco a cada reconexão (cobre renovações via apiFetch)
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) return;
      // Token NÃO vai na URL (evita vazamento em logs); é enviado no 1º frame.
      ws = new WebSocket(`${wsBase}/ws`);
      ws.onopen = () => {
        attempt = 0;
        ws?.send(JSON.stringify({ type: "auth", token }));
      };
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
  }, [id]);

  /* ===== Enviar Mensagem ===== */
  const sendMensagem = useCallback(async () => {
    if (!msgText.trim() || !chamado?.id) return;
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
    if (!id) { setLoadingAnexos(false); return; }
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

  /* ===== Upload via apiFetch + validação ===== */
  const handleUpload = useCallback(async () => {
    if (!selectedFile || !chamado?.id) return;
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

  /* ===== Alterar status ===== */
  const atualizarStatus = useCallback(
    async (novoStatus: Status): Promise<boolean> => {
      if (!chamado?.id) return false;
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

  /* ===== Drag-drop ===== */
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  }

  /* ===== Confirm dialogs ===== */
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
  const groups = groupMensagens(msgs, chamado.criadoPorId ?? undefined);

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

      {/* Dados acadêmicos básicos */}
      {dadosAcademicos && (dadosAcademicos.ra || dadosAcademicos.curso) && (
        <div className="rounded-lg border border-[var(--border)] bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-2">
            <GraduationCap className="size-3.5" /> Seus dados acadêmicos
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs">
            {dadosAcademicos.ra && (
              <div><span className="text-muted-foreground">RA:</span>{" "}<span className="font-medium">{dadosAcademicos.ra}</span></div>
            )}
            {dadosAcademicos.unidadeFatec && (
              <div><span className="text-muted-foreground">Unidade:</span>{" "}<span className="font-medium">{dadosAcademicos.unidadeFatec}</span></div>
            )}
            {dadosAcademicos.curso && (
              <div><span className="text-muted-foreground">Curso:</span>{" "}<span className="font-medium">{dadosAcademicos.curso}</span></div>
            )}
            {dadosAcademicos.turno && (
              <div><span className="text-muted-foreground">Turno:</span>{" "}<span className="font-medium">{dadosAcademicos.turno}</span></div>
            )}
            {dadosAcademicos.turma && (
              <div><span className="text-muted-foreground">Turma:</span>{" "}<span className="font-medium">{dadosAcademicos.turma}</span></div>
            )}
            {dadosAcademicos.semestreAtual && (
              <div><span className="text-muted-foreground">Semestre:</span>{" "}<span className="font-medium">{dadosAcademicos.semestreAtual}</span></div>
            )}
          </div>
        </div>
      )}

      {/* Aviso solicitação respondida */}
      {chamado.status === "RESOLVIDO" && (
        <div className="rounded-lg border border-yellow-400/30 bg-yellow-100/20 text-yellow-700 dark:text-yellow-300 dark:bg-yellow-900/20 px-4 py-3 text-sm flex items-start gap-2">
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
        <div className="flex gap-3">
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
      <section
        className="rounded-xl border border-[var(--border)] bg-card flex flex-col"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-3 border-b border-[var(--border)] text-xs text-muted-foreground">
          Conversa sobre a solicitação
        </div>

        <div
          className={`flex-1 p-4 space-y-3 overflow-y-auto max-h-[500px] rounded-b-lg scrollbar-thin transition-colors ${
            isDragging ? "bg-primary/5 border-2 border-dashed border-primary/40" : ""
          }`}
        >
          {isDragging && (
            <div className="flex items-center justify-center h-full text-primary text-sm font-medium py-8">
              Solte o arquivo aqui para anexar
            </div>
          )}

          {!isDragging && (
            <>
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
                groups.map((group, gi) => (
                  <div
                    key={`group-${gi}`}
                    className={`flex flex-col gap-0.5 ${
                      group.isAluno ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="text-[11px] text-muted-foreground px-1 mb-0.5">
                      {group.nomeAutor}
                    </span>

                    {group.msgs.map((m, mi) => {
                      const isLast = mi === group.msgs.length - 1;
                      return (
                        <div
                          key={`${m.id}-${m.criadoEm}`}
                          className={`max-w-[75%] px-4 py-2 shadow-sm leading-relaxed ${
                            group.isAluno
                              ? "bg-gradient-to-br from-[#F87171] to-[#E74C3C] text-white rounded-2xl rounded-br-sm"
                              : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-2xl rounded-bl-sm"
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">{m.conteudo}</div>
                          {isLast && (
                            <div
                              className="text-[10px] opacity-60 mt-1 text-right"
                              title={new Date(m.criadoEm).toLocaleString("pt-BR")}
                            >
                              {relativeTime(m.criadoEm)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </>
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        {!isEncerrado ? (
          <div className="p-3 border-t border-[var(--border)]">
            <div className="flex items-end gap-2">
              <textarea
                className="flex-1 min-h-[90px] rounded-lg border border-[var(--border)] bg-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                placeholder="Escreva sua mensagem… (Ctrl+Enter para enviar)"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    sendMensagem();
                  }
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
          <ul className="space-y-3 mb-4">
            {anexos.map((a) => (
              <li key={a.id} className="border rounded-md bg-background overflow-hidden">
                {a.mimeType.startsWith("image/") && (
                  <AnexoImagem anexoId={a.id} alt={a.nomeArquivo} />
                )}
                <div className="flex items-center justify-between gap-2 p-2 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium truncate block">{a.nomeArquivo}</span>
                    <span className="text-xs text-muted-foreground">
                      {(a.tamanhoBytes / 1024).toFixed(1)} KB ·{" "}
                      {new Date(a.enviadoEm).toLocaleDateString("pt-BR")}
                      {a.enviadoPor?.nome ? ` · ${a.enviadoPor.nome}` : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await downloadAnexo(a.id, a.nomeArquivo);
                      } catch {
                        toast.error("Não foi possível baixar o arquivo.");
                      }
                    }}
                    className="inline-flex items-center gap-1 h-8 px-2 rounded-md border hover:bg-[var(--muted)] text-xs shrink-0"
                  >
                    <Download className="size-3.5" /> Baixar
                  </button>
                </div>
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
              Máximo 10 MB · PDF, Word, Excel, imagens, TXT · ou arraste o arquivo para a área de conversa
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
