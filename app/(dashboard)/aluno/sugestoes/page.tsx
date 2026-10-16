"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Info, Loader2, MessageSquarePlus, Send } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, extractApiError } from "../../../../utils/api";
import SugestaoStatusBadge from "../../../components/shared/SugestaoStatusBadge";
import SugestoesPaginacao from "../../../components/shared/SugestoesPaginacao";
import SugestaoEditor, {
  type SugestaoEditorValor,
} from "../../../components/shared/SugestaoEditor";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const CONTEUDO_MAX = 1000;
const PAGE_SIZE = 10;

type StatusSugestao = "NAO_RESPONDIDO" | "RESPONDIDO";

type SugestaoResumo = {
  id: string;
  conteudo: string;
  status: StatusSugestao;
  criadoEm: string;
};

export default function SugestoesPage() {
  const [ra, setRa] = useState("");
  const [emailContato, setEmailContato] = useState("");
  const [editorValor, setEditorValor] =
    useState<SugestaoEditorValor | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [sugestoes, setSugestoes] = useState<SugestaoResumo[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const texto = editorValor?.texto.trim() ?? "";
  const excedeuLimite = texto.length > CONTEUDO_MAX;

  useEffect(() => {
    apiFetch(`${API}/auth/me`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { ra?: string | number } | null) => {
        if (data?.ra != null) setRa(String(data.ra));
      })
      .catch(() => {});
  }, []);

  const fetchSugestoes = useCallback(async (targetPage: number) => {
    try {
      setLoadingList(true);

      const res = await apiFetch(
        `${API}/sugestoes?page=${targetPage}&pageSize=${PAGE_SIZE}`,
        { cache: "no-store" },
      );

      if (!res.ok) {
        throw new Error(
          await extractApiError(res, "Não foi possível carregar as sugestões."),
        );
      }

      const data = await res.json();
      setSugestoes(data?.items ?? []);
      setTotal(data?.total ?? 0);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as sugestões.",
      );
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void fetchSugestoes(page);
  }, [page, fetchSugestoes]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting) return;

    const email = emailContato.trim();

    if (!email) {
      toast.error("Informe um e-mail para contato.");
      return;
    }

    if (!editorValor || texto.length < 3) {
      toast.error("Escreva uma sugestão com pelo menos 3 caracteres.");
      return;
    }

    if (excedeuLimite) {
      toast.error(`A sugestão deve ter no máximo ${CONTEUDO_MAX} caracteres.`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiFetch(`${API}/sugestoes`, {
        method: "POST",
        body: JSON.stringify({
          emailContato: email,
          conteudo: texto,
          documento: editorValor.documento,
        }),
      });

      if (!res.ok) {
        throw new Error(
          await extractApiError(res, "Falha ao enviar sugestão."),
        );
      }

      toast.success("Sugestão enviada com sucesso!");
      setEditorValor(null);
      setEditorKey((atual) => atual + 1);
      setEmailContato("");

      if (page === 1) {
        void fetchSugestoes(1);
      } else {
        setPage(1);
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao enviar sugestão.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-grotesk text-2xl font-semibold tracking-tight">
          Caixa de Sugestões
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envie uma sugestão, elogio ou crítica. Sua mensagem fica vinculada ao
          seu cadastro. Depois de enviada, a sugestão não pode ser editada.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[var(--border)] bg-card p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquarePlus className="size-4 text-muted-foreground" />
          Nova sugestão
        </div>

        {ra && (
          <div className="rounded-lg border border-[var(--border)] px-4 py-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">R.A.:</span> {ra}
          </div>
        )}

        <label className="space-y-1 text-sm block">
          <span className="font-medium">
            E-mail <span className="text-destructive">*</span>
          </span>
          <input
            type="email"
            value={emailContato}
            onChange={(e) => setEmailContato(e.target.value)}
            disabled={submitting}
            placeholder="Insira e-mail para contato"
            className="w-full rounded-lg border border-[var(--border)] bg-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </label>

        <div className="space-y-1 text-sm">
          <p className="font-medium">
            Sugestão <span className="text-destructive">*</span>
          </p>

          <SugestaoEditor
            key={editorKey}
            disabled={submitting}
            onChange={setEditorValor}
          />

          <p
            className={`text-right text-xs ${
              excedeuLimite ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {texto.length}/{CONTEUDO_MAX}
          </p>

          {excedeuLimite && (
            <p role="alert" className="text-xs text-destructive">
              Reduza o texto para até {CONTEUDO_MAX} caracteres antes de enviar.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || excedeuLimite}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Enviar
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-[var(--border)] bg-card p-5 space-y-3">
        <div className="text-sm font-semibold">Sugestões enviadas</div>

        {loadingList ? (
          <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Carregando…
          </div>
        ) : sugestoes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-muted-foreground inline-flex items-center gap-2 justify-center w-full">
            <Info className="size-4" />
            Você não enviou nenhuma sugestão.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {sugestoes.map((s) => (
              <li key={s.id} className="py-3">
                <Link
                  href={`/aluno/sugestoes/${s.id}`}
                  className="flex items-center justify-between gap-3 hover:underline"
                >
                  <span className="line-clamp-1 text-sm">{s.conteudo}</span>
                  <SugestaoStatusBadge status={s.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="pt-2">
            <SugestoesPaginacao
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
