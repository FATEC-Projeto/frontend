"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../../../../utils/api";
import {
  CATALOGO_INSTITUCIONAL,
  enriquecerCatalogo,
  type CatalogResponse,
  type ServicoCatalogo,
} from "../../../../../utils/catalogo";
import { cx } from "../../../../../utils/cx";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/* ─── Tipos ─── */
type ServicoCom = ServicoCatalogo & { categoriaNome: string; categoriaId: string };

type Sugestao = { servico: ServicoCom; score: number };

type DadosAcademicos = {
  ra: string;
  unidadeFatec: string;
  curso: string;
  turno: string;
  semestre: string;
  turma: string;
};

/* ─── Stop words (português) ─── */
const STOP_WORDS = new Set([
  "de", "do", "da", "dos", "das", "e", "em", "que", "é", "um", "uma",
  "para", "com", "não", "se", "por", "mais", "como", "ele", "ela",
  "mas", "ao", "às", "no", "na", "nos", "nas", "meu", "minha",
  "meus", "minhas", "esse", "essa", "isso", "este", "esta", "isto",
  "sobre", "quando", "uma", "ser", "ter", "foi", "são", "ou", "pois",
]);

/* ─── Keyword matching ─── */
function sugerirServicos(descricao: string, catalog: CatalogResponse): Sugestao[] {
  const tokens = descricao
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/\W+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  if (tokens.length === 0) return [];

  const resultados: Sugestao[] = [];

  for (const cat of catalog.categorias) {
    for (const svc of cat.servicos) {
      if (!svc.ativo) continue;

      const haystack = [
        svc.nome,
        svc.descricao,
        cat.nome,
        ...svc.palavrasChave,
        ...cat.palavrasChave,
      ]
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");

      let score = 0;
      for (const token of tokens) {
        if (haystack.includes(token)) {
          score += token.length >= 6 ? 2 : 1;
        }
      }

      if (score > 0) {
        resultados.push({
          servico: { ...svc, categoriaNome: cat.nome, categoriaId: cat.id },
          score,
        });
      }
    }
  }

  return resultados
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/* ─── Componente principal ─── */
export default function OutrosPage() {
  const router = useRouter();

  const [catalog, setCatalog] = useState<CatalogResponse>(CATALOGO_INSTITUCIONAL);
  const [descricao, setDescricao] = useState("");
  const [titulo, setTitulo] = useState("");
  const [step, setStep] = useState<"descrever" | "sugestoes" | "formulario" | "sucesso">("descrever");
  const [confirmaNenhum, setConfirmaNenhum] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [dadosAcademicos, setDadosAcademicos] = useState<DadosAcademicos>({
    ra: "", unidadeFatec: "", curso: "", turno: "", semestre: "", turma: "",
  });

  /* Busca catálogo e dados acadêmicos do aluno */
  useEffect(() => {
    apiFetch(`${API}/catalogo`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: CatalogResponse | null) => {
        if (data?.categorias) setCatalog(enriquecerCatalogo(data));
      })
      .catch(() => {});

    apiFetch(`${API}/auth/me`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: Partial<DadosAcademicos & { semestreAtual?: string | number }> | null) => {
        if (!data) return;
        setDadosAcademicos((prev) => ({
          ra: String(data.ra ?? prev.ra),
          unidadeFatec: data.unidadeFatec ?? prev.unidadeFatec,
          curso: data.curso ?? prev.curso,
          turno: data.turno ?? prev.turno,
          semestre: data.semestreAtual != null ? String(data.semestreAtual) : prev.semestre,
          turma: data.turma ?? prev.turma,
        }));
      })
      .catch(() => {});
  }, []);

  const sugestoes = useMemo(
    () => (step === "sugestoes" ? sugerirServicos(descricao, catalog) : []),
    [step, descricao, catalog],
  );

  function handleVerificar() {
    if (descricao.trim().length < 20) {
      toast.error("Descreva sua necessidade com pelo menos 20 caracteres para encontrarmos sugestões.");
      return;
    }
    setConfirmaNenhum(false);
    setStep("sugestoes");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) { toast.error("Informe um título para a solicitação."); return; }
    if (descricao.trim().length < 20) { toast.error("A descrição deve ter ao menos 20 caracteres."); return; }

    setSubmitting(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        nivel: "N1",
        prioridade: "MEDIA",
        catalogoServicoId: "outros-solicitacao-geral",
        catalogoCategoriaId: "outros",
        catalogoCategoriaNome: "Outra solicitação",
        // Sem serviço de catálogo, o chamado nasceria sem setor e ficaria órfão
        // (ninguém notificado, invisível em filtros por setor). Roteia para a
        // Secretaria, que faz a triagem e redireciona se necessário.
        setorProvavel: "Secretaria",
        dadosAcademicos,
        camposEspecificos: { descricao: descricao.trim() },
        origem: "catalogo_wizard_aluno",
      };
      const res = await apiFetch(`${API}/tickets`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? `Erro ${res.status}`);
      }
      const data = await res.json() as { id?: string | number; ticket?: { id?: string | number } };
      const ticketId = data.id ?? data.ticket?.id;
      toast.success("Solicitação enviada com sucesso!");
      if (ticketId) router.push(`/aluno/chamados/${ticketId}`);
      else setStep("sucesso");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar solicitação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/aluno/catalogo"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar ao catálogo
        </Link>
        <h1 className="font-grotesk text-2xl font-semibold tracking-tight mt-3">
          Identificar minha solicitação
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Descreva o que precisa e vamos verificar se existe uma categoria adequada antes de abrir uma solicitação avulsa.
        </p>
      </div>

      {/* Step: Descrever */}
      {(step === "descrever" || step === "sugestoes") && (
        <div className="rounded-xl border border-[var(--border)] bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <HelpCircle className="size-4 text-muted-foreground" />
            Descreva sua necessidade
          </div>
          <textarea
            value={descricao}
            onChange={(e) => { setDescricao(e.target.value); if (step === "sugestoes") setStep("descrever"); }}
            rows={5}
            placeholder="Ex.: Preciso de um documento que comprove minha matrícula para usar no estágio…"
            className="w-full rounded-lg border border-[var(--border)] bg-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleVerificar}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90"
            >
              <Sparkles className="size-4" /> Verificar categorias
            </button>
          </div>
        </div>
      )}

      {/* Step: Sugestões */}
      {step === "sugestoes" && (
        <div className="rounded-xl border border-[var(--border)] bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="size-4 text-emerald-500" />
            {sugestoes.length > 0
              ? "Encontramos serviços que podem atender sua necessidade"
              : "Nenhum serviço específico foi identificado"}
          </div>

          {sugestoes.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Verifique se algum dos serviços abaixo atende sua necessidade. Se sim, clique em{" "}
                <strong>Abrir esta solicitação</strong> para usar o formulário correto.
              </p>
              <ul className="space-y-3">
                {sugestoes.map(({ servico: s }) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-[var(--border)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium text-sm">{s.nome}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {s.categoriaNome} · {s.descricao}
                      </div>
                    </div>
                    <Link
                      href={`/aluno/catalogo/${s.id}`}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm shrink-0 hover:opacity-90"
                    >
                      <ArrowRight className="size-4" /> Abrir esta solicitação
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="pt-2 border-t">
                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={confirmaNenhum}
                    onChange={(e) => setConfirmaNenhum(e.target.checked)}
                  />
                  <span className="text-muted-foreground">
                    Nenhuma das opções acima atende minha necessidade. Quero abrir uma solicitação avulsa.
                  </span>
                </label>
                {confirmaNenhum && (
                  <button
                    type="button"
                    onClick={() => setStep("formulario")}
                    className="mt-3 inline-flex items-center gap-2 h-10 px-4 rounded-md border border-[var(--border)] bg-background hover:bg-[var(--muted)] text-sm"
                  >
                    Continuar com solicitação avulsa <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Não conseguimos identificar uma categoria específica. Você pode abrir uma solicitação avulsa — nossa equipe irá analisá-la e direcionar para o setor correto.
              </p>
              <button
                type="button"
                onClick={() => setStep("formulario")}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90"
              >
                Continuar com solicitação avulsa <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step: Formulário */}
      {step === "formulario" && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Send className="size-4" /> Detalhe sua solicitação avulsa
          </div>
          <p className="text-xs text-muted-foreground rounded-lg bg-[var(--muted)] px-3 py-2">
            Esta solicitação será recebida pela equipe da Fatec e direcionada ao setor responsável após análise.
          </p>

          <label className="space-y-1 text-sm block">
            <span className="font-medium">Título <span className="text-destructive">*</span></span>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Resumo da sua necessidade"
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>

          <label className="space-y-1 text-sm block">
            <span className="font-medium">Descrição detalhada <span className="text-destructive">*</span></span>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={5}
              placeholder="Descreva com o máximo de detalhes possível…"
              className="w-full rounded-lg border border-[var(--border)] bg-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
            />
          </label>

          {/* Dados acadêmicos resumidos */}
          {(dadosAcademicos.ra || dadosAcademicos.curso) && (
            <div className="rounded-lg border border-[var(--border)] px-4 py-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Dados acadêmicos registrados:</span>{" "}
              {[dadosAcademicos.ra && `RA ${dadosAcademicos.ra}`, dadosAcademicos.curso, dadosAcademicos.turno, dadosAcademicos.semestre]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}

          <div className="flex justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep("sugestoes")}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-[var(--border)] bg-background hover:bg-[var(--muted)] text-sm"
            >
              <ArrowLeft className="size-4" /> Voltar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Enviar solicitação
            </button>
          </div>
        </form>
      )}

      {/* Step: Sucesso (fallback se não recebeu ID) */}
      {step === "sucesso" && (
        <div className="rounded-xl border border-[var(--border)] bg-card p-8 text-center space-y-4">
          <CheckCircle2 className="size-10 text-emerald-500 mx-auto" />
          <h2 className="font-semibold text-lg">Solicitação enviada!</h2>
          <p className="text-sm text-muted-foreground">
            Nossa equipe irá analisar e direcionar para o setor responsável.
          </p>
          <Link
            href="/aluno/chamados"
            className={cx(
              "inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90",
            )}
          >
            Ver minhas solicitações
          </Link>
        </div>
      )}
    </div>
  );
}
