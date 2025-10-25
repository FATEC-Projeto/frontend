"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Ticket,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  MessageSquareText,
  ChevronRight,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";

// Tipos
type Status = "ABERTO" | "EM_ATENDIMENTO" | "AGUARDANDO_USUARIO" | "RESOLVIDO" | "ENCERRADO";

type Chamado = {
  id: string;
  protocolo?: string;
  titulo: string;
  criadoEm: string;
  status: Status;
  setor?: { nome?: string };
  precisaAcaoDoAluno?: boolean;
  mensagensNaoLidas?: number;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// Badges
function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string }> = {
    ABERTO: { label: "Aberto", cls: "bg-[var(--brand-cyan)]/12 text-[var(--brand-cyan)] border-[var(--brand-cyan)]/30" },
    EM_ATENDIMENTO: { label: "Em atendimento", cls: "bg-[var(--brand-teal)]/12 text-[var(--brand-teal)] border-[var(--brand-teal)]/30" },
    AGUARDANDO_USUARIO: { label: "Aguardando você", cls: "bg-[var(--warning)]/12 text-[var(--warning)] border-[var(--warning)]/30" },
    RESOLVIDO: { label: "Resolvido", cls: "bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/30" },
    ENCERRADO: { label: "Encerrado", cls: "bg-[var(--muted)] text-muted-foreground border-[var(--border)]" },
  };
  const v = map[status];
  return (
    <span className={cx("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border", v.cls)}>
      {v.label}
    </span>
  );
}

function AcoesChamado({ c }: { c: Chamado }) {
  const base =
    "inline-flex items-center h-9 px-3 rounded-md border border-[var(--border)] bg-background hover:bg-[var(--muted)] text-sm";

  return (
    <div className="flex gap-2 justify-end">
      <Link href={`/aluno/chamados/${c.id}`} className={base}>
        Detalhes <ChevronRight className="size-4 ml-1" />
      </Link>

      {["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_USUARIO"].includes(c.status) && (
        <Link
          href={`/aluno/chamados/${c.id}#responder`}
          className={cx(base, "text-[var(--brand-teal)] border-[var(--brand-teal)]/40")}
        >
          Responder
        </Link>
      )}

      {c.precisaAcaoDoAluno && (
        <Link
          href={`/aluno/chamados/${c.id}#anexos`}
          className={cx(base, "border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10")}
        >
          <Paperclip className="size-4 mr-1" /> Enviar arquivo
        </Link>
      )}
    </div>
  );
}

export default function MeusChamadosPage() {
  const [alunoNome, setAlunoNome] = useState<string>("Olá 👋");
  const [dados, setDados] = useState<Chamado[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  // Cabeçalho com nome (mesma lógica da home)
  useEffect(() => {
    async function fetchUsuario() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data?.nome) {
          const primeiroNome = data.nome.split(" ")[0];
          setAlunoNome(`Olá, ${primeiroNome} 👋`);
        } else {
          setAlunoNome("Olá 👋");
        }
      } catch {
        setAlunoNome("Olá 👋");
      }
    }
    fetchUsuario();
  }, []);

  useEffect(() => {
    async function fetchChamados() {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.sub;

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets?include=setor,criadoPor&feitoPorId=${userId}`;
        console.log("🔍 URL chamada:", url);

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const text = await res.text(); // força ler texto cru para inspecionar
        console.log("🔍 Status:", res.status);
        console.log("🔍 Resposta:", text);

        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

        const data = JSON.parse(text);
        setDados(data.items ?? []);
      } catch (err) {
        console.error("💥 Erro ao buscar chamados:", err);
        toast.error("Erro ao carregar chamados");
      } finally {
        setLoading(false);
      }
    }

    fetchChamados();
  }, []);

  const filtrados = useMemo(() => {
    return dados.filter((c) => {
      const qOk =
        !q ||
        c.titulo.toLowerCase().includes(q.toLowerCase()) ||
        c.protocolo?.toLowerCase().includes(q.toLowerCase());
      const sOk = status === "ALL" || c.status === status;
      return qOk && sOk;
    });
  }, [dados, q, status]);

  const aguardandoCount = filtrados.filter((d) => d.status === "AGUARDANDO_USUARIO").length;

  return (
    <>
      {/* Topbar (igual à home) */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-grotesk text-2xl sm:text-3xl font-semibold tracking-tight">{alunoNome}</h1>
          <p className="text-muted-foreground">Acompanhe e gerencie seus chamados abertos por você.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <div className="text-sm font-medium">Aluno(a)</div>
            <div className="text-xs text-muted-foreground">aluno@fatec.sp.gov.br</div>
          </div>
          <MobileSidebarTriggerAluno />
        </div>
      </div>

      {/* Banner aguardando ação (se houver) */}
      {aguardandoCount > 0 && (
        <div className="mb-4 rounded-xl border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-[var(--warning)] mt-0.5" />
              <div>
                <div className="font-medium">Você tem {aguardandoCount} chamado(s) aguardando sua ação.</div>
                <div className="text-sm text-muted-foreground">Envie documentos, responda mensagens ou conclua a tarefa.</div>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center h-9 px-3 rounded-md border border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10"
              onClick={() => setStatus("AGUARDANDO_USUARIO")}
            >
              Filtrar por “Aguardando você”
            </button>
          </div>
        </div>
      )}

      {/* Ações rápidas + Filtros (igual vibe da home) */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
        <Link
           href="/aluno/catalogo"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-90">
          <Plus className="size-4" /> Abrir novo chamado
        </Link>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-[320px]">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Buscar por protocolo ou título"
              aria-label="Buscar por protocolo ou título"
              className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select
            className="h-10 w-full sm:w-[200px] px-3 rounded-lg border border-[var(--border)] bg-background focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="ALL">Todos os status</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM_ATENDIMENTO">Em atendimento</option>
            <option value="AGUARDANDO_USUARIO">Aguardando você</option>
            <option value="RESOLVIDO">Resolvido</option>
            <option value="ENCERRADO">Encerrado</option>
          </select>

          
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum chamado encontrado com os filtros atuais.
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--muted)] text-foreground/90">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Protocolo</th>
                    <th className="text-left font-medium px-4 py-3">Título</th>
                    <th className="text-left font-medium px-4 py-3">Setor</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-left font-medium px-4 py-3">Criado em</th>
                    <th className="text-right font-medium px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((c) => (
                    <tr key={c.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-3 font-medium">{c.protocolo ?? `#${c.id}`}</td>
                      <td className="px-4 py-3 max-w-[420px]">
                        <div className="line-clamp-1">{c.titulo}</div>
                        {!!c.mensagensNaoLidas && (
                          <span className="ml-2 align-middle text-xs rounded-md px-1.5 py-0.5 bg-[var(--brand-cyan)]/15 text-[var(--brand-cyan)] border border-[var(--brand-cyan)]/30">
                            {c.mensagensNaoLidas} nova(s)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{c.setor?.nome ?? "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AcoesChamado c={c} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-[var(--border)]">
              {filtrados.map((c) => (
                <div key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">{c.protocolo ?? `#${c.id}`}</div>
                      <div className="font-medium">{c.titulo}</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Setor</div>
                    <div>{c.setor?.nome ?? "—"}</div>
                    <div className="text-muted-foreground">Criado em</div>
                    <div>{new Date(c.criadoEm).toLocaleDateString("pt-BR")}</div>
                  </div>

                  {!!c.mensagensNaoLidas && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs rounded-md px-1.5 py-0.5 bg-[var(--brand-cyan)]/15 text-[var(--brand-cyan)] border border-[var(--brand-cyan)]/30">
                      <MessageSquareText className="size-3.5" />
                      {c.mensagensNaoLidas} nova(s) mensagem(ns)
                    </div>
                  )}

                  <div className="mt-3">
                    <AcoesChamado c={c} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
