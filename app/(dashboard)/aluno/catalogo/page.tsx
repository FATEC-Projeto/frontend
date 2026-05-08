"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Layers, BookOpen, Plus, Loader2, X } from "lucide-react";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";
import { CATALOGO_INSTITUCIONAL, type CatalogResponse, type ServicoCatalogo } from "../../../../utils/catalogo";
import { cx } from "../../../../utils/cx";
import {
  getServiceFormConfig,
  validateServicePayload,
  type ServiceFormConfig,
  type ServiceFormField,
  type ServiceFormValues,
} from "../../../../utils/serviceForms";

type Servico = ServicoCatalogo & { categoriaNome?: string };
type FormErrors = Record<string, string>;

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function getInitialValues(config: ServiceFormConfig): ServiceFormValues {
  return config.campos.reduce<ServiceFormValues>((acc, campo) => {
    acc[campo.id] = campo.tipo === "checkbox" ? false : campo.tipo === "arquivo" ? [] : "";
    return acc;
  }, {});
}

function formatFieldValue(campo: ServiceFormField, value: ServiceFormValues[string]) {
  if (campo.tipo === "checkbox") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.join(", ");
  return String(value ?? "");
}

function buildTicketDescription(servico: Servico, config: ServiceFormConfig, values: ServiceFormValues) {
  const detalhes = config.campos
    .map((campo) => `- ${campo.label}: ${formatFieldValue(campo, values[campo.id]) || "Não informado"}`)
    .join("\n");

  return `${servico.descricao || "Solicitação aberta via catálogo"}\n\nDados do formulário:\n${detalhes}`;
}

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

function FormField({
  campo,
  value,
  error,
  onChange,
}: {
  campo: ServiceFormField;
  value: ServiceFormValues[string];
  error?: string;
  onChange: (id: string, value: ServiceFormValues[string]) => void;
}) {
  const baseClass = cx(
    "w-full rounded-lg border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]",
    error ? "border-red-500" : "border-[var(--border)]"
  );

  function handleTextChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    onChange(campo.id, e.target.value);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(campo.id, Array.from(e.target.files ?? []).map((file) => file.name));
  }

  return (
    <label className={cx("block", campo.tipo === "checkbox" && "flex items-start gap-3 rounded-lg border border-[var(--border)] p-3")}>
      {campo.tipo === "checkbox" ? (
        <input
          type="checkbox"
          className="mt-1 size-4 accent-[var(--primary)]"
          checked={Boolean(value)}
          onChange={(e) => onChange(campo.id, e.target.checked)}
        />
      ) : null}

      <span className="block flex-1">
        <span className="mb-1 block text-sm font-medium">
          {campo.label} {campo.obrigatorio && <span className="text-red-500">*</span>}
        </span>

        {campo.tipo === "textarea" && (
          <textarea className={cx(baseClass, "min-h-24 resize-y")} value={String(value ?? "")} placeholder={campo.placeholder} onChange={handleTextChange} />
        )}

        {campo.tipo === "select" && (
          <select className={baseClass} value={String(value ?? "")} onChange={handleTextChange}>
            <option value="">Selecione uma opção</option>
            {campo.opcoes?.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
        )}

        {campo.tipo === "arquivo" && (
          <input type="file" className={baseClass} accept={campo.accept} onChange={handleFileChange} />
        )}

        {(campo.tipo === "texto" || campo.tipo === "data" || campo.tipo === "numero") && (
          <input
            type={campo.tipo === "data" ? "date" : campo.tipo === "numero" ? "number" : "text"}
            step={campo.tipo === "numero" ? "any" : undefined}
            className={baseClass}
            value={String(value ?? "")}
            placeholder={campo.placeholder}
            onChange={handleTextChange}
          />
        )}

        {campo.ajuda && <span className="mt-1 block text-xs text-muted-foreground">{campo.ajuda}</span>}
        {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
      </span>
    </label>
  );
}

function ServiceRequestModal({ servico, onClose }: { servico: Servico; onClose: () => void }) {
  const router = useRouter();
  const config = getServiceFormConfig(servico.id);
  const [values, setValues] = useState<ServiceFormValues>(() => (config ? getInitialValues(config) : {}));
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validation = useMemo(
    () => (config ? validateServicePayload(servico.id, values) : { valid: true as const, values }),
    [config, servico.id, values]
  );

  if (!config) return null;
  const activeConfig = config;

  function updateField(id: string, value: ServiceFormValues[string]) {
    setValues((current) => ({ ...current, [id]: value }));
    setErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const currentValidation = validateServicePayload(servico.id, values);
    if (!currentValidation.valid) {
      setErrors(currentValidation.errors);
      toast.error("Preencha os campos obrigatórios antes de enviar.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Sessão expirada. Faça login novamente.");

      const res = await fetch("/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: servico.nome,
          descricao: buildTicketDescription(servico, activeConfig, values),
          servicoId: servico.id,
          formulario: {
            servicoId: servico.id,
            versao: 1,
            campos: values,
          },
          nivel: "N1",
          prioridade: "MEDIA",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao criar solicitação acadêmica");
      }

      const data = await res.json();
      toast.success("Solicitação acadêmica criada com sucesso!");
      router.push(`/aluno/chamados/${data.id}`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Falha ao criar solicitação acadêmica"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5">
          <div>
            <h2 className="font-grotesk text-xl font-semibold tracking-tight">{activeConfig.titulo}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{activeConfig.descricao}</p>
          </div>
          <button className="rounded-md p-1 hover:bg-[var(--muted)]" onClick={onClose} aria-label="Fechar formulário">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-96px)] overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {activeConfig.campos.map((campo) => (
              <div key={campo.id} className={cx((campo.tipo === "textarea" || campo.tipo === "arquivo") && "sm:col-span-2")}>
                <FormField campo={campo} value={values[campo.id]} error={errors[campo.id]} onChange={updateField} />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-end">
            <button type="button" onClick={onClose} className="h-10 rounded-md border border-[var(--border)] px-4 text-sm hover:bg-[var(--muted)]">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !validation.valid}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Enviar solicitação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ----------------------------- Card de Serviço ----------------------------- */
function ServicoCard({ s, onSelect }: { s: Servico; onSelect: (servico: Servico) => void }) {
  const hasForm = Boolean(getServiceFormConfig(s.id));

  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-4 flex flex-col justify-between">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium leading-tight">{s.nome}</h3>
          <div className="flex flex-col items-end gap-1">
            {!s.ativo && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--muted)] text-muted-foreground">
                Indisponível
              </span>
            )}
            {hasForm && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                Formulário ativo
              </span>
            )}
          </div>
        </div>
        {s.descricao && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.descricao}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">ID: {s.id}</div>
        <button
          disabled={!s.ativo || !hasForm}
          onClick={() => onSelect(s)}
          className={cx(
            "inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm transition",
            s.ativo && hasForm
              ? "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
              : "bg-[var(--muted)] text-muted-foreground cursor-not-allowed"
          )}
          title={hasForm ? "Iniciar solicitação" : "Formulário ainda não disponível"}
        >
          <Plus className="size-4" /> Iniciar solicitação
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
  const [selectedService, setSelectedService] = useState<Servico | null>(null);


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
    const ativos = flatServicos.filter((s) => s.ativo && Boolean(getServiceFormConfig(s.id))).length;
    const indisponiveis = total - ativos;
    return { total, ativos, indisponiveis };
  }, [flatServicos]);

  /* ----------------------------- Render ----------------------------- */
  return (
    <>
      {selectedService && <ServiceRequestModal servico={selectedService} onClose={() => setSelectedService(null)} />}

      {/* Topbar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-grotesk text-2xl font-semibold tracking-tight">Serviços acadêmicos da Fatec</h1>
          <p className="text-xs text-muted-foreground mt-2">
            Central de Solicitações Acadêmicas Fatec: {kpis.ativos} disponíveis • {kpis.indisponiveis} indisponíveis
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
              <ServicoCard key={s.id} s={s} onSelect={setSelectedService} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
