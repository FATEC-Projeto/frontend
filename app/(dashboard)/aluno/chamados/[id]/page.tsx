// app/(dashboard)/aluno/chamados/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
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

// ---------- Tipos ----------
type Chamado = {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  criadoEm: string;
  protocolo?: string | null;
};

type Mensagem = {
  id: string;
  conteudo: string;
  criadoEm: string;
  atualizadoEm?: string | null;
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

type MensagensPage = {
  total: number;
  page: number;
  pageSize: number;
  items: Mensagem[];
};

// ---------- Página Principal ----------
export default function ChamadoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para mensagens
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [msgSending, setMsgSending] = useState(false);
  const [msgText, setMsgText] = useState("");

  // --- Estados para Anexos ---
  const [anexos, setAnexos] = useState<AnexoInfo[]>([]);
  const [loadingAnexos, setLoadingAnexos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // --- Fim Estados para Anexos ---

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL, []);
  const API = apiBase;

  // --- Funções Auxiliares ---

  async function fetchAnexos(ticketId: string) {
    if (!API) return;
    setLoadingAnexos(true);
    try {
      const res = await apiFetch(`${API}/tickets/${ticketId}/anexos`);
      if (!res.ok) throw new Error("Falha ao buscar anexos");
      const data = await res.json();
      setAnexos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Erro ao buscar anexos:", err);
      toast.error("Falha ao carregar anexos.", { description: err.message });
    } finally {
      setLoadingAnexos(false);
    }
  }

  async function fetchMensagens(ticketId: string) {
    if (!API) return;
    setMsgLoading(true);
    try {
      const res = await apiFetch(
        `${API}/tickets/${ticketId}/mensagens?page=1&pageSize=100&orderDir=asc`
      );
      if (!res.ok) throw new Error("Falha ao buscar mensagens");
      const data = await res.json();
      const items = data?.items ?? data ?? [];
      setMsgs(Array.isArray(items) ? items : []);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar mensagens.");
    } finally {
      setMsgLoading(false);
    }
  }

  useEffect(() => {
    async function loadChamadoEAnexos() {
      if (!id || !API) {
          setLoading(false);
          toast.error("ID do chamado ou URL da API não definidos.");
          return;
      };
      setLoading(true);
      setMsgLoading(true);
      setLoadingAnexos(true);
      try {
        const resChamado = await apiFetch(`${API}/tickets/${id}`);
        if (!resChamado.ok) {
            const errData = await resChamado.json().catch(() => ({}));
            throw new Error(errData?.error || `Erro ${resChamado.status} ao carregar chamado.`);
        }
        const dataChamado: Chamado = await resChamado.json();
        setChamado(dataChamado);

        await Promise.all([
          fetchMensagens(dataChamado.id),
          fetchAnexos(dataChamado.id),
        ]);

      } catch (err: any) {
        toast.error(err.message || "Erro ao carregar dados do chamado.");
        setChamado(null);
      } finally {
        setLoading(false);
      }
    }
    loadChamadoEAnexos();
  }, [id, API]);

  async function sendMensagem() {
    if (!msgText.trim() || !chamado?.id || !API) return;
    setMsgSending(true);
    try {
      await apiFetch(`${API}/tickets/${chamado.id}/mensagens`, {
        method: "POST",
        body: JSON.stringify({ conteudo: msgText.trim() }),
      });
      setMsgText("");
      toast.success("Mensagem enviada!");
      await fetchMensagens(chamado.id);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar mensagem.");
    } finally {
      setMsgSending(false);
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !chamado?.id || !API) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const token = localStorage.getItem("accessToken") || "";
      const res = await fetch(`${API}/tickets/${chamado.id}/anexos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({
          error: `Erro HTTP ${res.status}`,
        }));
        throw new Error(errorData.error || `Erro HTTP ${res.status}`);
      }

      toast.success(`Arquivo "${selectedFile.name}" enviado com sucesso!`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchAnexos(chamado.id);
    } catch (err: any) {
      console.error("Erro no upload:", err);
      toast.error("Falha ao enviar arquivo.", { description: err.message });
    } finally {
      setUploading(false);
    }
  };

  // ---------- RENDER ----------

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
        Chamado não encontrado ou falha ao carregar.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 rounded-xl border border-[var(--border)] bg-card space-y-8">
      {/* Topbar local com voltar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] bg-background hover:bg-[var(--muted)] text-sm"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </button>

        <Link
          href="/aluno/chamados"
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] bg-background hover:bg-[var(--muted)] text-sm"
        >
          Lista de chamados
        </Link>
      </div>

      {/* Cabeçalho do Chamado */}
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

      {/* Mensagens */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Mensagens</h2>

        {msgLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin" />
            Carregando mensagens...
          </div>
        ) : msgs.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-3 bg-background">
            Nenhuma mensagem por aqui ainda.
          </div>
        ) : (
          <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {msgs.map((m) => (
              <li key={m.id} className="p-3 border rounded-md bg-background">
                <div className="text-sm text-muted-foreground flex items-center justify-between flex-wrap gap-x-2">
                  <span>{m.autor?.nome ?? "Usuário"}</span>
                  <time className="text-xs">{new Date(m.criadoEm).toLocaleString("pt-BR")}</time>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words">{m.conteudo}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Composer (Enviar Mensagem) */}
      <section id="responder">
        <h3 className="text-lg font-semibold mb-2">Enviar mensagem</h3>
        <div className="flex flex-col gap-2">
          <textarea
            className="min-h-[90px] w-full rounded-md border bg-background p-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="Escreva sua mensagem para a secretaria/suporte…"
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            disabled={msgSending}
          />
          <div className="flex justify-end">
            <button
              onClick={sendMensagem}
              disabled={msgSending || msgText.trim().length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 hover:bg-accent disabled:opacity-60 disabled:cursor-not-allowed min-w-[110px]"
            >
              {msgSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Send className="size-4" /> Enviar
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ao enviar, os responsáveis pelo chamado serão notificados.
          </p>
        </div>
      </section>

      {/* --- Seção de Anexos --- */}
        <section id="anexos" className="rounded-xl border border-[var(--border)] bg-card p-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Paperclip className="size-4" /> Anexos ({anexos.length})
          </h2>

          {loadingAnexos ? (
            <div className="text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin inline mr-1" /> Carregando anexos...</div>
          ) : anexos.length === 0 ? (
            <div className="text-sm text-muted-foreground border rounded-md p-3 bg-background">Nenhum anexo encontrado.</div>
          ) : (
            <ul className="space-y-2 mb-4">
              {anexos.map((a) => (
                <li key={a.id} className="p-2 border rounded-md bg-background flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium truncate block">{a.nomeArquivo}</span>
                    <span className="text-xs text-muted-foreground">
                      {(a.tamanhoBytes / 1024).toFixed(1)} KB - {new Date(a.enviadoEm).toLocaleDateString('pt-BR')} por {a.enviadoPor?.nome ?? 'Usuário'}
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

          {/* Formulário de Upload */}
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
                     <span className="text-sm text-muted-foreground truncate max-w-xs">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                 )}
            </div>

            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="mt-2 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-60 min-w-[140px]"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {uploading ? 'Enviando...' : 'Enviar arquivo'}
              </button>
            )}
            <p className="text-xs text-muted-foreground mt-2">Limite por arquivo: 10MB (exemplo).</p>
          </div>
        </section>
      {/* --- Fim Seção de Anexos --- */}

    </div>
  );
}