"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Layers, BookOpen, Plus, Loader2, ArrowRight } from "lucide-react";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";
import { CATALOGO_INSTITUCIONAL, type CatalogResponse, type ServicoCatalogo } from "../../../../utils/catalogo";
import { cx } from "../../../../utils/cx";

type Servico = ServicoCatalogo & { categoriaNome?: string };


/* ----------------------------- MOCK (fallback) ----------------------------- */
const MOCK: CatalogResponse = CATALOGO_INSTITUCIONAL;

/* ----------------------------- Componentes ----------------------------- */
function CategoriaPill({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      className={cx(
        "h-9 px-3 rounded-lg border text-sm transition",
        active ? "bg-primary text-primary-foreground border-transparent" : "bg-background hover:bg-[var(--muted)] border-[var(--border)]"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/* ----------------------------- Card de Serviço ----------------------------- */
function ServicoCard({ s }: { s: Servico }) {
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
        {s.descricao && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.descricao}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">ID: {s.id}</div>
        {s.ativo ? (
          <Link
            href={`/aluno/catalogo/${s.id}`}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm transition hover:opacity-90"
          >
            <ArrowRight className="size-4" /> Preencher solicitação
          </Link>
        ) : (
          <button
            disabled
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[var(--muted)] text-muted-foreground text-sm cursor-not-allowed"
          >
            <Plus className="size-4" /> Indisponível
          </button>
        )}
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
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const url = apiBaseUrl ? `${apiBaseUrl}/catalogo` : "/catalogo";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("fallback");
        const data = (await res.json()) as CatalogResponse;
        setCatalog({
          categorias: (data.categorias ?? []).map((c) => ({ ...c, servicos: c.servicos ?? [] })),
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
    () => catalog.categorias.flatMap((c) => c.servicos.map((s) => ({ ...s, categoriaId: c.id, categoriaNome: c.nome }))),
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
      const searchable = [s.nome, s.descricao, s.categoriaNome, ...(s.palavrasChave ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const byText = !texto || searchable.includes(texto);
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
      {/* Topbar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-grotesk text-2xl font-semibold tracking-tight">Serviços acadêmicos da Fatec</h1>
          <p className="text-xs text-muted-foreground mt-2">
            Escolha um serviço para iniciar o preenchimento guiado. O ticket só será criado após a revisão final: {kpis.ativos} disponíveis • {kpis.indisponiveis} indisponíveis
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
            placeholder="Buscar por nome, descrição, categoria ou CPS/Fatec"
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
          <div className="py-10 text-center text-muted-foreground">Nenhum serviço encontrado com os filtros atuais.</div>
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
