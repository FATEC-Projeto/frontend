"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

type Chamado = {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  criadoEm: string;
  criadoPorId?: string | null;
};

type Mensagem = {
  id: string;
  conteudo: string;
  criadoEm: string;
  autorId?: string | null;
  autor?: { id: string; nome: string | null } | null;
};

export default function ChamadoDetalhePage() {
  const { id } = useParams();
  const router = useRouter();

  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgLoading, setMsgLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL, []);
  const knownIds = useRef<Set<string>>(new Set()); // evita mensagens duplicadas

  async function authedFetch(input: string, init?: RequestInit) {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) throw new Error("Sessão expirada.");
    const res = await fetch(input, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || `Erro ${res.status}`);
    }
    return res;
  }

  // Buscar informações do chamado
  useEffect(() => {
    async function fetchChamado() {
      try {
        const res = await authedFetch(`${apiBase}/tickets/${id}`);
        const data = await res.json();
        setChamado(data);
      } catch (err: any) {
        toast.error(err.message || "Erro ao carregar chamado.");
      }
    }
    if (id && apiBase) fetchChamado();
  }, [id, apiBase]);

  // Buscar mensagens iniciais
  async function fetchMensagens() {
    if (!id) return;
    try {
      const res = await authedFetch(`${apiBase}/tickets/${id}/mensagens?page=1&pageSize=100&orderDir=asc`);
      const data = await res.json();
      const lista = data.mensagens || data.items || [];
      lista.forEach((m: Mensagem) => knownIds.current.add(m.id));
      setMsgs(lista);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar mensagens.");
    } finally {
      setMsgLoading(false);
    }
  }

  useEffect(() => {
    if (id && apiBase) fetchMensagens();
  }, [id, apiBase]);

  // WebSocket em tempo real
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId || !apiBase) return;

    const wsUrl = (apiBase ?? "http://localhost:3333")
      .replace(/^http/, "ws") + `/ws?userId=${userId}`;

    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    function connectWS() {
      console.log("🌍 Tentando conectar ao WebSocket:", wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("🟢 WS conectado com sucesso!");
        setSocketConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "connection_ok") return;

          if (data.type === "nova_mensagem" && data.chamadoId === id) {
            // evita mensagens duplicadas
            if (knownIds.current.has(data.mensagem.id)) return;
            knownIds.current.add(data.mensagem.id);

            setMsgs((prev) => [...prev, data.mensagem]);
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          }
        } catch (e) {
          console.error("Erro ao processar mensagem WS:", e);
        }
      };

      ws.onerror = () => setSocketConnected(false);

      ws.onclose = () => {
        setSocketConnected(false);
        reconnectTimer = setTimeout(connectWS, 5000);
      };
    }

    connectWS();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [apiBase, id]);

  async function sendMensagem() {
    if (!msgText.trim()) return;
    setMsgSending(true);
    try {
      const res = await authedFetch(`${apiBase}/tickets/${id}/mensagens`, {
        method: "POST",
        body: JSON.stringify({ conteudo: msgText.trim() }),
      });
      const novaMsg = await res.json();

      // evita duplicar localmente
      if (!knownIds.current.has(novaMsg.id)) {
        knownIds.current.add(novaMsg.id);
        setMsgs((prev) => [...prev, novaMsg]);
      }

      setMsgText("");
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar mensagem.");
    } finally {
      setMsgSending(false);
    }
  }

  if (!chamado)
    return <div className="text-center py-16 text-muted-foreground">Chamado não encontrado.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 rounded-xl border bg-gradient-to-b from-rose-50 to-white dark:from-gray-900 dark:to-gray-950 space-y-8 shadow-md transition-all">
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
        <h1 className="text-2xl font-bold mb-2 text-rose-700 dark:text-rose-400">{chamado.titulo}</h1>
        <p className="text-sm text-muted-foreground mb-4">ID: {chamado.id}</p>
        <div className="space-y-2">
          <p><strong>Descrição:</strong> {chamado.descricao}</p>
          <p><strong>Status:</strong> {chamado.status}</p>
          <p><strong>Criado em:</strong> {new Date(chamado.criadoEm).toLocaleString("pt-BR")}</p>
        </div>
      </div>

      {/* Mensagens */}
      <section className="border rounded-xl bg-white/90 dark:bg-gray-900/60 p-4 shadow-inner max-h-[500px] overflow-y-auto space-y-3 scrollbar-thin">
        {msgLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando mensagens...
          </div>
        ) : msgs.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-3 text-center">
            Nenhuma mensagem por aqui ainda.
          </div>
        ) : (
          msgs.map((m) => {
            const isAluno = m.autorId === chamado.criadoPorId;
            return (
              <div
                key={`${m.id}-${m.criadoEm}`} // garante unicidade
                className={`flex ${isAluno ? "justify-end" : "justify-start"} animate-fadeIn`}
              >
                <div
                  className={`relative px-4 py-2 rounded-2xl shadow-sm transition-all max-w-[75%] break-words whitespace-pre-wrap
                  ${isAluno
                    ? "bg-gradient-to-br from-[#F87171] to-[#E74C3C] text-white dark:from-[#B91C1C] dark:to-[#7F1D1D] rounded-br-sm"
                    : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-sm"
                  }`}
                >
                  <div className="text-xs opacity-80 mb-1">
                    {isAluno ? "Você" : m.autor?.nome || "Secretaria"} ·{" "}
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
          })
        )}
        <div ref={endRef} />
      </section>

      {/* Envio de mensagem */}
      <section className="bg-white/95 dark:bg-gray-900/70 rounded-xl border p-3 shadow-sm">
        <div className="flex flex-col gap-2">
          <textarea
            className="min-h-[90px] w-full rounded-md border bg-background p-2 focus:ring-2 focus:ring-[#E74C3C]"
            placeholder="Escreva sua mensagem para a secretaria/suporte…"
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={sendMensagem}
              disabled={msgSending || msgText.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 
                         bg-gradient-to-br from-[#E74C3C] to-[#F87171] 
                         hover:from-[#DC2626] hover:to-[#B91C1C] 
                         dark:from-[#B91C1C] dark:to-[#7F1D1D] 
                         dark:hover:from-[#DC2626] dark:hover:to-[#991B1B]
                         text-white disabled:opacity-60 transition-all"
            >
              {msgSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Enviar
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-right">
          Ao enviar, os responsáveis pelo chamado serão notificados.
          </p>
        </div>
      </section>
    </div>
  );
}
