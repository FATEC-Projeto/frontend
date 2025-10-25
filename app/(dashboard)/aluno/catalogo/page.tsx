"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Layers, BookOpen, Plus, Loader2 } from "lucide-react";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";
import { apiFetch } from "../../../../utils/api";

/* ----------------------------- Tipos ----------------------------- */
type Servico = {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  categoriaId?: string | null;
};

type Categoria = {
  id: string;
  nome: string;
  descricao?: string | null;
  servicos: Servico[];
};

type CatalogResponse = {
  categorias: Categoria[];
};

/* ----------------------------- Utils ----------------------------- */
function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* ----------------------------- MOCK (fallback) ----------------------------- */
const MOCK: CatalogResponse = {
  categorias: [
    {
      id: "cat-secretaria",
      nome: "Secretaria",
      descricao: "Atendimentos acadêmicos e documentação",
      servicos: [
        { id: "s1", nome: "Revisão de nota", descricao: "Solicite revisão da avaliação", ativo: true },
        { id: "s2", nome: "Histórico escolar", descricao: "Gere histórico/declarações", ativo: true },
        { id: "s3", nome: "Aproveitamento de estudos", descricao: "Solicite análise de equivalência curricular", ativo: false },
      ],
    },
    {
      id: "cat-financeiro",
      nome: "Financeiro",
      descricao: "Pagamentos e documentos financeiros",
      servicos: [
        { id: "s4", nome: "2ª via de boleto", descricao: "Emissão de boleto atualizado", ativo: true },
        { id: "s5", nome: "Negociação de débito", descricao: "Abra uma negociação financeira", ativo: true },
      ],
    },
    {
      id: "cat-ti",
      nome: "TI Acadêmica",
      descricao: "Acesso, e-mail e sistemas",
      servicos: [
        { id: "s6", nome: "Problemas no e-mail educacional", descricao: "Criação, acesso e ajustes", ativo: true },
        { id: "s7", nome: "Troca de senha", descricao: "Redefinição de senha institucional", ativo: true },
      ],
    },
  ],
};

/* ----------------------------- Componentes ----------------------------- */
function CategoriaPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cx(
        "h-9 px-3 rounded-lg border text-sm transition",
        active
          ? "bg-primary text-primary-foreground border-transparent"
          : "bg-background hover:bg-[var(--muted)] border-[var(--border)]"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/* ----------------------------- Card de Serviço ----------------------------- */
function ServicoCard({ s }: { s: Servico }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAbrirChamado() {
    if (!s.ativo) return;
    try {
      setLoading(true);

      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tickets`, {
        method: "POST",
        body: JSON.stringify({
          titulo: s.nome,
          descricao: s.descricao || "Solicitação aberta via catálogo",
          servicoId: s.id,
          nivel: "N1",
          prioridade: "MEDIA",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao criar chamado");
      }

      const data = await res.json();
      toast.success("Chamado criado com sucesso!");
      router.push(`/aluno/chamados/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || "Falha ao criar chamado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-4 flex flex-col justify-between">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium leading-tight">{s.nome}</h3>
          {!s.ativo && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--muted)] text-muted-foreground">
              Indisponível
            </span>
          )}
        </div>
        {s.descricao && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.descricao}</p>}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">ID: {s.id}</div>
        <button
          disabled={!s.ativo || loading}
          onClick={handleAbrirChamado}
          className={cx(
            "inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm transition",
            s.ativo
              ? "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
              : "bg-[var(--muted)] text-muted-foreground cursor-not-allowed"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Abrindo...
            </>
          ) : (
            <>
              <Plus className="size-4" /> Abrir chamado
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- Página Principal ----------------------------- */
export default function CatalogoAlunoPage() {
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<CatalogResponse>(MOCK);
  const [q, setQ] = useState("");
  const [catId, setCatId] = useState<string | "ALL">("ALL");

  /* Buscar catálogo */
  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/catalogo`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("fallback");
        const data = (await res.json()) as CatalogResponse;
        setCatalog({
          categorias: (data.categorias ?? []).map((c) => ({
            ...c,
            servicos: c.servicos ?? [],
          })),
        });
      } catch {
        setCatalog(MOCK);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  const flatServicos = useMemo(
    () => catalog.categorias.flatMap((c) => c.servicos.map((s) => ({ ...s, categoriaId: c.id }))),
    [catalog]
  );

  const categoriasOpts = useMemo(
    () => catalog.categorias.map((c) => ({ id: c.id, nome: c.nome })),
    [catalog]
  );

  const filtrados = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return flatServicos.filter((s) => {
      const byCat = catId === "ALL" || s.categoriaId === catId;
      const byText =
        !texto ||
        s.nome.toLowerCase().includes(texto) ||
        (s.descricao ?? "").toLowerCase().includes(texto);
      return byCat && byText;
    });
  }, [flatServicos, q, catId]);

  const kpis = useMemo(() => {
    const total = flatServicos.length;
    const ativos = flatServicos.filter((s) => s.ativo).length;
    const indisponiveis = total - ativos;
    return { total, ativos, indisponiveis };
  }, [flatServicos]);

  /* ----------------------------- Render ----------------------------- */
  return (
    <>
      {/* Topbar mínima (sem saudação; o layout já tem o cabeçalho global) */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">Selecione um serviço para abrir um novo chamado.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Catálogo: {kpis.ativos} serviços disponíveis • {kpis.indisponiveis} indisponíveis
          </p>
        </div>
        <MobileSidebarTriggerAluno />
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <CategoriaPill label="Todas categorias" active={catId === "ALL"} onClick={() => setCatId("ALL")} />
          {categoriasOpts.map((c) => (
            <CategoriaPill key={c.id} label={c.nome} active={catId === c.id} onClick={() => setCatId(c.id)} />
          ))}
        </div>

        <div className="relative w-full lg:w-[360px]">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            placeholder="Buscar por nome ou descrição"
            className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-9 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border border-[var(--border)] bg-card p-4 flex items-center gap-3">
          <Layers className="size-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Categorias</div>
            <div className="text-lg font-semibold">{catalog.categorias.length}</div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-card p-4 flex items-center gap-3">
          <BookOpen className="size-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Serviços</div>
            <div className="text-lg font-semibold">{kpis.total}</div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-card p-4 flex items-center gap-3">
          <Plus className="size-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Disponíveis</div>
            <div className="text-lg font-semibold">{kpis.ativos}</div>
          </div>
        </div>
      </div>

      {/* Lista de serviços */}
      <div className="rounded-xl border border-[var(--border)] bg-card p-4">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Loader2 className="size-4 animate-spin" />
            Carregando catálogo...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            Nenhum serviço encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtrados.map((s) => (
              <ServicoCard key={s.id} s={s} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
