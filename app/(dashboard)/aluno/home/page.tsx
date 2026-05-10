"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { Ticket, Plus, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";
import TicketStatusBadge from "../../../components/shared/TicketStatusBadge";
import KpiCard from "../../../components/shared/KpiCard";
import { SkeletonKpi, SkeletonTable } from "../../../components/ui/Skeleton";
import EmptyState from "../../../components/ui/EmptyState";
import Button from "../../../components/ui/Button";

type Status = "ABERTO" | "EM_ATENDIMENTO" | "AGUARDANDO_USUARIO" | "RESOLVIDO" | "ENCERRADO";
type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

type Chamado = {
  id: string;
  protocolo?: string | null;
  titulo: string;
  criadoEm: string;
  status: Status;
  prioridade: Prioridade;
  setor?: { nome?: string } | null;
};

export default function AlunoHomePage() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [limite, setLimite] = useState(20);

  useEffect(() => {
    async function fetchChamados() {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Token não encontrado");

        const base = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets?include=setor`;
        const pageSize = 100;
        let page = 1;
        let total = 0;
        const all: Chamado[] = [];

        while (true) {
          const res = await fetch(`${base}&page=${page}&pageSize=${pageSize}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Erro ao buscar solicitações");
          const data = await res.json();
          if (page === 1) total = data.total ?? 0;
          const items: Chamado[] = Array.isArray(data.items) ? data.items : [];
          all.push(...items);
          if (all.length >= total || items.length < pageSize) break;
          page += 1;
        }

        setChamados(all);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar solicitações");
      } finally {
        setLoading(false);
      }
    }

    fetchChamados();
    const interval = setInterval(fetchChamados, 60_000);
    return () => clearInterval(interval);
  }, []);

  const kpi = useMemo(() => ({
    abertos:      chamados.filter((d) => ["ABERTO", "EM_ATENDIMENTO"].includes(d.status)).length,
    aguardandoEu: chamados.filter((d) => d.status === "AGUARDANDO_USUARIO").length,
    emAtendimento:chamados.filter((d) => d.status === "EM_ATENDIMENTO").length,
    resolvidos:   chamados.filter((d) => d.status === "RESOLVIDO").length,
  }), [chamados]);

  const chamadosAtivos = chamados.filter((d) =>
    ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_USUARIO"].includes(d.status)
  );
  const chamadosVisiveis = chamadosAtivos.slice(0, limite);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <MobileSidebarTriggerAluno />
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={<Ticket className="size-5" />} label="Recebidas" value={kpi.abertos} tone="brand-cyan" hint="Solicitações recebidas pela Fatec" />
          <KpiCard icon={<AlertTriangle className="size-5" />} label="Aguardando minha ação" value={kpi.aguardandoEu} tone="warning" hint="Responda ou anexe arquivos" />
          <KpiCard icon={<Clock className="size-5" />} label="Em análise" value={kpi.emAtendimento} tone="brand-teal" />
          <KpiCard icon={<CheckCircle2 className="size-5" />} label="Respondidas" value={kpi.resolvidos} tone="success" />
        </div>
      )}

      {/* Lista */}
      <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
        {/* Cabeçalho da seção */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/40">
          <h2 className="text-sm font-semibold">Solicitações em aberto</h2>
          <Link href="/aluno/chamados">
            <Button variant="secondary" size="sm">Ver todas</Button>
          </Link>
        </div>

        {loading ? (
          <SkeletonTable rows={4} cols={5} />
        ) : chamadosVisiveis.length === 0 ? (
          <EmptyState
            icon={<Ticket className="size-6" />}
            title="Nenhuma solicitação em aberto"
            description="Acesse o catálogo de serviços para abrir uma nova solicitação."
            action={
              <Link href="/aluno/catalogo">
                <Button size="sm" icon={<Plus className="size-4" />}>Abrir solicitação</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--muted)]/60">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Protocolo</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Título</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Setor</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Criado em</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {chamadosVisiveis.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--muted)]/30 transition">
                    <td className="px-4 py-3 font-medium text-xs text-muted-foreground">{c.protocolo ?? `#${c.id.slice(0, 8)}`}</td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <span className="line-clamp-1">{c.titulo}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.setor?.nome ?? "—"}</td>
                    <td className="px-4 py-3"><TicketStatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(c.criadoEm).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/aluno/chamados/${c.id}`}>
                        <Button variant="outline" size="sm">Ver detalhes</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {chamadosAtivos.length > limite && (
              <div className="px-4 py-3 border-t border-[var(--border)]">
                <button
                  onClick={() => setLimite(chamadosAtivos.length)}
                  className="text-sm text-[var(--brand-red)] hover:underline font-medium"
                >
                  Ver todas as {chamadosAtivos.length} solicitações em aberto
                </button>
              </div>
            )}
            {limite > 20 && chamadosAtivos.length > 20 && (
              <div className="px-4 py-3 border-t border-[var(--border)]">
                <button
                  onClick={() => setLimite(20)}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Mostrar menos
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
