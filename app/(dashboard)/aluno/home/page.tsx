"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, ReactNode } from "react";
import {
  Ticket,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";

/* ------------------------- TIPOS ------------------------- */
type Status =
  | "ABERTO"
  | "EM_ATENDIMENTO"
  | "AGUARDANDO_USUARIO"
  | "RESOLVIDO"
  | "ENCERRADO";
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

/* ------------------------- UTIL ------------------------- */
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* ------------------------- COMPONENTES ------------------------- */
function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string }> = {
    ABERTO: {
      label: "Aberto",
      cls: "bg-[var(--brand-cyan)]/12 text-[var(--brand-cyan)] border-[var(--brand-cyan)]/30",
    },
    EM_ATENDIMENTO: {
      label: "Em atendimento",
      cls: "bg-[var(--brand-teal)]/12 text-[var(--brand-teal)] border-[var(--brand-teal)]/30",
    },
    AGUARDANDO_USUARIO: {
      label: "Aguardando você",
      cls: "bg-[var(--warning)]/12 text-[var(--warning)] border-[var(--warning)]/30",
    },
    RESOLVIDO: {
      label: "Resolvido",
      cls: "bg-[var(--success)]/12 text-[var(--success)] border-[var(--success)]/30",
    },
    ENCERRADO: {
      label: "Encerrado",
      cls: "bg-[var(--muted)] text-muted-foreground border-[var(--border)]",
    },
  };
  const v = map[status];
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border",
        v.cls
      )}
    >
      {v.label}
    </span>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  tone?: "brand-cyan" | "brand-teal" | "warning" | "success";
  hint?: string;
}) {
  const bgMap: Record<string, string> = {
    "brand-cyan": "bg-[var(--brand-cyan)]/10",
    "brand-teal": "bg-[var(--brand-teal)]/10",
    warning: "bg-[var(--warning)]/10",
    success: "bg-[var(--success)]/10",
  };
  const textMap: Record<string, string> = {
    "brand-cyan": "text-[var(--brand-cyan)]",
    "brand-teal": "text-[var(--brand-teal)]",
    warning: "text-[var(--warning)]",
    success: "text-[var(--success)]",
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
          {hint && <div className="text-xs text-muted-foreground/80">{hint}</div>}
        </div>
        <div
          className={cx(
            "size-10 rounded-lg grid place-items-center",
            tone ? bgMap[tone] : "bg-[var(--muted)]"
          )}
        >
          <div
            className={cx(
              "opacity-90",
              tone ? textMap[tone] : "text-muted-foreground"
            )}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- PÁGINA ------------------------- */
export default function AlunoHomePage() {
  const [alunoNome, setAlunoNome] = useState<string>("Olá 👋");
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [limite, setLimite] = useState(20);

  // Buscar nome do aluno
  useEffect(() => {
    async function fetchUsuario() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.nome) {
          const primeiroNome = data.nome.split(" ")[0];
          setAlunoNome(`Olá, ${primeiroNome} 👋`);
        }
      } catch {
        setAlunoNome("Olá 👋");
      }
    }
    fetchUsuario();
  }, []);

  // Buscar chamados e atualizar a cada 60s
  useEffect(() => {
    async function fetchChamados() {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Token não encontrado");
    
        const base = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets?include=setor`;
        const pageSize = 100; // limite do backend
        let page = 1;
        let total = 0;
        const all: any[] = [];
    
        while (true) {
          const res = await fetch(`${base}&page=${page}&pageSize=${pageSize}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Erro ao buscar chamados");
          const data = await res.json(); // { total, page, pageSize, items }
          if (page === 1) total = data.total ?? 0;
    
          const items = Array.isArray(data.items) ? data.items : [];
          all.push(...items);
    
          const fetched = all.length;
          if (fetched >= total || items.length < pageSize) break; 
          page += 1;
        }
    
        setChamados(all);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar chamados");
      } finally {
        setLoading(false);
      }
    }
    

    fetchChamados();
    const interval = setInterval(fetchChamados, 60000);
    return () => clearInterval(interval);
  }, []);

  // KPIs
  const kpi = useMemo(() => {
    const abertos = chamados.filter((d) =>
      ["ABERTO", "EM_ATENDIMENTO"].includes(d.status)
    ).length;
    const aguardandoEu = chamados.filter(
      (d) => d.status === "AGUARDANDO_USUARIO"
    ).length;
    const emAtendimento = chamados.filter(
      (d) => d.status === "EM_ATENDIMENTO"
    ).length;
    const resolvidos = chamados.filter((d) => d.status === "RESOLVIDO").length;
    return { abertos, aguardandoEu, emAtendimento, resolvidos };
  }, [chamados]);

  // Chamados visíveis (somente os ativos)
  const chamadosAtivos = chamados.filter(
    (d) =>
      d.status === "ABERTO" ||
      d.status === "EM_ATENDIMENTO" ||
      d.status === "AGUARDANDO_USUARIO"
  );
  const chamadosVisiveis = chamadosAtivos.slice(0, limite);

  /* ------------------------- RENDER ------------------------- */
  return (
    <>
      {/* Topbar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-grotesk text-2xl sm:text-3xl font-semibold tracking-tight">
            {alunoNome}
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seus chamados e ações pendentes.
          </p>
        </div>
        <MobileSidebarTriggerAluno />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi
          icon={<Ticket className="size-4" />}
          label="Abertos"
          value={kpi.abertos}
          tone="brand-cyan"
          hint="Chamados em aberto"
        />
        <Kpi
          icon={<AlertTriangle className="size-4" />}
          label="Aguardando minha ação"
          value={kpi.aguardandoEu}
          tone="warning"
          hint="Responda ou anexe arquivos"
        />
        <Kpi
          icon={<Clock className="size-4" />}
          label="Em atendimento"
          value={kpi.emAtendimento}
          tone="brand-teal"
        />
        <Kpi
          icon={<CheckCircle2 className="size-4" />}
          label="Resolvidos"
          value={kpi.resolvidos}
          tone="success"
        />
      </div>

      {/* Lista de chamados */}
      <div className="rounded-xl border border-[var(--border)] bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Carregando chamados...
          </div>
        ) : chamadosVisiveis.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum chamado encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--muted)] text-foreground/90">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Protocolo</th>
                  <th className="text-left font-medium px-4 py-3">Título</th>
                  <th className="text-left font-medium px-4 py-3">Setor</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {chamadosVisiveis.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-[var(--border)] hover:bg-[var(--muted)]/40"
                  >
                    <td className="px-4 py-3 font-medium">
                      {c.protocolo ?? `#${c.id}`}
                    </td>
                    <td className="px-4 py-3">{c.titulo}</td>
                    <td className="px-4 py-3">{c.setor?.nome ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3">
                      {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Botões Ver mais / Mostrar menos */}
            {chamadosAtivos.length > limite && (
              <div className="p-4 text-center">
                <button
                  onClick={() => setLimite(chamadosAtivos.length)}
                  className="text-sm font-medium text-[var(--brand-red)] hover:underline"
                  >
                  Ver todos os {chamadosAtivos.length} chamados
                </button>
              </div>
            )}
            {limite > 20 && (
              <div className="p-4 text-center">
                <button
                  onClick={() => setLimite(20)}
                  className="text-sm font-medium text-[var(--brand-red)] hover:underline"
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
