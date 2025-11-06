"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

/* ================= Tipos ================= */
type Status = "ABERTO" | "EM_ATENDIMENTO" | "AGUARDANDO_USUARIO" | "RESOLVIDO" | "ENCERRADO";

type Chamado = {
  id: string;
  titulo: string;
  descricao: string;
  status: Status;
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

  const API = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL, []);

  // Chamado
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);

  // Mensagens
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgLoading, setMsgLoading] = useState(true);

  // WS / UX
  const knownIds = useRef<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  // Anexos
  const [anexos, setAnexos] = useState<AnexoInfo[]>([]);
  const [loadingAnexos, setLoadingAnexos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
function confirmarEncerramento() {
  toast.custom((t) => (
    <div className="bg-card border border-[var(--border)] rounded-xl shadow-lg p-4 w-[360px] animate-in fade-in-50">
      <div className="flex items-start gap-3">
        <div className="bg-[#B91C1C]/10 text-[#B91C1C] rounded-full p-2">
          <AlertTriangle className="size-5" />
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            Deseja encerrar este chamado?
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-snug">
            Após encerrar, o chamado ficará <b>apenas para consulta</b> e{" "}
            <b>não poderá ser reaberto</b>.
          </p>

          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t)}
              className="px-3 py-1.5 rounded-md text-sm border border-[var(--border)] hover:bg-muted transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                atualizarStatus("ENCERRADO");
                toast.dismiss(t);
                toast.success("Chamado encerrado com sucesso!", {
                  description:
                    "Agora ele está disponível apenas para consulta no histórico.",
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

/* Função de confirmação para REABRIR */
function confirmarReabertura() {
  toast.custom((t) => (
    <div className="bg-card border border-[var(--border)] rounded-xl shadow-lg p-4 w-[360px] animate-in fade-in-50">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full p-2">
          <RotateCcw className="size-5" />
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            Reabrir chamado?
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-snug">
            O chamado voltará para o status <b>“Em atendimento”</b> e poderá
            ser atualizado novamente pela secretaria.
          </p>

          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t)}
              className="px-3 py-1.5 rounded-md text-sm border border-[var(--border)] hover:bg-muted transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                atualizarStatus("EM_ATENDIMENTO");
                toast.dismiss(t);
                toast.success("Chamado reaberto com sucesso!", {
                  description: "Agora ele está novamente em atendimento.",
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

  /* ===== Scroll ===== */
  function scrollToEnd(smooth = true) {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" }), 50);
  }

  /* ===== Fetch Chamado ===== */
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

  useEffect(() => {
    fetchChamado();
  }, [API, id]);

  /* ===== Fetch Mensagens ===== */
  async function fetchMensagens(ticketId: string) {
    if (!API) return;
    setMsgLoading(true);
    try {
      const res = await apiFetch(`${API}/tickets/${ticketId}/mensagens?page=1&pageSize=100&orderDir=asc`);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      const lista: Mensagem[] = data.mensagens || data.items || [];
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

  /* ===== WebSocket ===== */
  useEffect(() => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId || !API) return;

    const wsUrl = API.replace(/^http/, "ws") + `/ws?userId=${userId}`;
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    function connectWS() {
      ws = new WebSocket(wsUrl);

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
        reconnectTimer = setTimeout(connectWS, 4000);
      };
    }

    connectWS();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [API, id]);

  /* ===== Enviar Mensagem ===== */
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

  /* ===== Anexos ===== */
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
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
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

  /* ===== Alterar status ===== */
  async function atualizarStatus(novoStatus: Status) {
    if (!chamado?.id || !API) return;
    try {
      const res = await apiFetch(`${API}/tickets/${chamado.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      toast.success(
        novoStatus === "EM_ATENDIMENTO"
          ? "Chamado reaberto com sucesso!"
          : "Chamado encerrado com sucesso."
      );
      await fetchChamado();
    } catch (err: any) {
      toast.error("Erro ao atualizar status", { description: err.message });
    }
  }

  /* ===== Render ===== */
  if (loading && !chamado)
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Carregando chamado...
      </div>
    );

  if (!chamado)
    return (
      <div className="text-center py-16 text-muted-foreground">
        Chamado não encontrado.
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

{/* Aviso para o aluno quando o chamado estiver resolvido */}
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
      Este chamado foi marcado como <b>resolvido.</b> <br />
      Você pode <b>reabrir</b> caso o problema não tenha sido solucionado ou{" "}
      <b>encerrar</b> definitivamente se estiver tudo certo.
    </div>
  </div>
)}



 


  {/* Botões de ação — Encerrar ou Reabrir */}
{chamado.status === "RESOLVIDO" && (
  <div className="mt-4 flex gap-3">
    <button
      onClick={confirmarEncerramento}
      className="px-4 py-2 rounded-md bg-[#B91C1C] text-white text-sm font-medium hover:bg-[#991B1B] transition"
    >
      Encerrar chamado
    </button>

    <button
      onClick={() => confirmarReabertura()}
      className="px-4 py-2 rounded-md bg-[#374151] text-white text-sm font-medium hover:bg-[#111827] transition"
    >
      Reabrir chamado
    </button>
  </div>
)}



      {/* Chat */}
      <section className="rounded-xl border border-[var(--border)] bg-card flex flex-col">
        <div className="p-3 border-b border-[var(--border)] text-xs text-muted-foreground">
          Chat do chamado
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
                <div key={`${m.id}-${m.criadoEm}`} className={`flex ${isAluno ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm leading-relaxed transition-all ${
                      isAluno
                        ? "bg-gradient-to-br from-[#F87171] to-[#E74C3C] text-white rounded-br-sm"
                        : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-sm"
                    }`}
                  >
                    <div className="text-xs opacity-80 mb-1">
                      <strong>{isAluno ? "Você" : (m.autor?.nome || "Secretaria")}</strong> ·{" "}
                      {new Date(m.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
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
            🔒 Chamado encerrado. Disponível apenas para consulta.
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
              <li key={a.id} className="p-2 border rounded-md bg-background flex items-center justify-between gap-2 text-sm">
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
        )}
      </section>
    </div>
  );
}
