"use client";

import { useEffect, useMemo, useState } from "react";
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

type MensagensPage = {
  total: number;
  page: number;
  pageSize: number;
  items: Mensagem[];
};

export default function ChamadoDetalhePage() {
  const { id } = useParams();
  const router = useRouter();

  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);

  // mensagens
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [msgSending, setMsgSending] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

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

  // Carrega dados do chamado
  useEffect(() => {
    async function fetchChamado() {
      setLoading(true);
      try {
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

  // Carrega mensagens
  async function fetchMensagens(p = page) {
    if (!id) return;
    setMsgLoading(true);
    try {
      const res = await authedFetch(
        `${apiBase}/tickets/${id}/mensagens?page=${p}&pageSize=${pageSize}&orderDir=asc`
      );
      const data: MensagensPage = await res.json();
      setMsgs(data.items);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar mensagens.");
    } finally {
      setMsgLoading(false);
    }
  }

  useEffect(() => {
    if (id && apiBase) fetchMensagens(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, apiBase]);

  // Envia mensagem (dispara notificação no backend)
  async function sendMensagem() {
    if (!msgText.trim()) return;
    setMsgSending(true);
    try {
      await authedFetch(`${apiBase}/tickets/${id}/mensagens`, {
        method: "POST",
        body: JSON.stringify({ conteudo: msgText.trim() }),
      });
      setMsgText("");
      toast.success("Mensagem enviada!");
      await fetchMensagens(1);
      setPage(1);
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
    return (
      <div className="text-center py-16 text-muted-foreground">
        Chamado não encontrado.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 rounded-xl border border-[var(--border)] bg-card space-y-8">
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

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold mb-2">{chamado.titulo}</h1>
        <p className="text-sm text-muted-foreground mb-4">ID: {chamado.id}</p>

        <div className="space-y-2">
          <p><strong>Descrição:</strong> {chamado.descricao}</p>
          <p><strong>Status:</strong> {chamado.status}</p>
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
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando mensagens...
          </div>
        ) : msgs.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-md p-3">
            Nenhuma mensagem por aqui ainda.
          </div>
        ) : (
          <ul className="space-y-3">
            {msgs.map((m) => (
              <li key={m.id} className="p-3 border rounded-md bg-background">
                <div className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>{m.autor?.nome ?? "Usuário"}</span>
                  <time>{new Date(m.criadoEm).toLocaleString("pt-BR")}</time>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{m.conteudo}</p>
              </li>
            ))}
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
          </p>
        </div>
      </section>
    </div>
  );
}
