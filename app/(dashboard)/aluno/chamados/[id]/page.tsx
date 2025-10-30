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
};

type Mensagem = {
  id: string;
  conteudo: string;
  criadoEm: string;
  atualizadoEm?: string | null;
  autor?: { id: string; nome: string; emailPessoal?: string | null } | null;
};

export default function ChamadoDetalhePage() {
  const { id } = useParams();
  const router = useRouter();

  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgLoading, setMsgLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL, []);

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

  /** 🔹 Carrega o chamado */
  useEffect(() => {
    async function fetchChamado() {
      try {
        setLoading(true);
        const res = await authedFetch(`${apiBase}/tickets/${id}`);
        const data = await res.json();
        setChamado(data);
      } catch (err: any) {
        toast.error(err.message || "Erro ao carregar chamado.");
      } finally {
        setLoading(false);
      }
    }
    if (id && apiBase) fetchChamado();
  }, [id, apiBase]);

  /** 🔹 Carrega mensagens */
  async function fetchMensagens() {
    if (!id) return;
    setMsgLoading(true);
    try {
      const res = await authedFetch(`${apiBase}/tickets/${id}/mensagens?page=1&pageSize=100&orderDir=asc`);
      const data = await res.json();
      setMsgs(data.mensagens || data.items || []);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar mensagens.");
    } finally {
      setMsgLoading(false);
    }
  }

  useEffect(() => {
    if (id && apiBase) fetchMensagens();
  }, [id, apiBase]);

  /** 🔹 WebSocket (tempo real + reconexão automática) */
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId || !apiBase) return;

    const wsUrl = (apiBase ?? "http://localhost:3333")
      .replace(/^http/, "ws") + `/ws?userId=${userId}`;
    
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    function connectWS() {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("🟢 WS conectado");
        setSocketConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "nova_mensagem" && data.chamadoId === id) {
            setMsgs((prev) => [...prev, data.mensagem]);
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          }
        } catch (e) {
          console.error("Erro ao processar mensagem WS:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("💥 Erro WS:", err);
        setSocketConnected(false);
      };

      ws.onclose = () => {
        console.warn("🔴 WS desconectado, tentando reconectar em 5s...");
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

  /** 🔹 Envia mensagem */
  async function sendMensagem() {
    if (!msgText.trim()) return;
    setMsgSending(true);
    try {
      const res = await authedFetch(`${apiBase}/tickets/${id}/mensagens`, {
        method: "POST",
        body: JSON.stringify({ conteudo: msgText.trim() }),
      });
      const novaMsg = await res.json();
      setMsgs((prev) => [...prev, novaMsg]);
      setMsgText("");
      toast.success("Mensagem enviada!");
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar mensagem.");
    } finally {
      setMsgSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Carregando chamado...
      </div>
    );
  }

  if (!chamado) {
    return <div className="text-center py-16 text-muted-foreground">Chamado não encontrado.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 rounded-xl border bg-card space-y-8">
      {/* Indicador de status WebSocket */}
      <div className="text-sm text-muted-foreground">
        {socketConnected ? "🟢 Conectado em tempo real" : "🔴 Sem conexão em tempo real"}
      </div>

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
        <h1 className="text-2xl font-bold mb-2">{chamado.titulo}</h1>
        <p className="text-sm text-muted-foreground mb-4">ID: {chamado.id}</p>
        <div className="space-y-2">
          <p><strong>Descrição:</strong> {chamado.descricao}</p>
          <p><strong>Status:</strong> {chamado.status}</p>
          <p><strong>Criado em:</strong> {new Date(chamado.criadoEm).toLocaleString("pt-BR")}</p>
        </div>
      </div>

      {/* Mensagens */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Mensagens</h2>
        {msgLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando mensagens...
          </div>
        ) : msgs.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-3">
            Nenhuma mensagem por aqui ainda.
          </div>
        ) : (
          <ul className="space-y-3 max-h-[500px] overflow-y-auto">
            {msgs.map((m) => (
              <li key={m.id} className="p-3 border rounded-md bg-background">
                <div className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>{m.autor?.nome ?? "Usuário"}</span>
                  <time>{new Date(m.criadoEm).toLocaleString("pt-BR")}</time>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{m.conteudo}</p>
              </li>
            ))}
            <div ref={endRef} />
          </ul>
        )}
      </section>

      {/* Composer */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Enviar mensagem</h3>
        <div className="flex flex-col gap-2">
          <textarea
            className="min-h-[90px] w-full rounded-md border bg-background p-2"
            placeholder="Escreva sua mensagem para a secretaria/suporte…"
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={sendMensagem}
              disabled={msgSending || msgText.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 hover:bg-accent disabled:opacity-60"
            >
              {msgSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Enviar
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ao enviar, os responsáveis pelo chamado serão notificados.
            {socketConnected ? " 🟢 Conectado em tempo real" : " 🔴 Sem conexão em tempo real"}
          </p>
        </div>
      </section>
    </div>
  );
}
