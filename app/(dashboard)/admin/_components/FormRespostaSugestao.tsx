"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, extractApiError } from "../../../../utils/api";
import SugestaoEditor, { type SugestaoEditorValor } from "../../../components/shared/SugestaoEditor";
import SugestaoDocumentoView from "../../../components/shared/SugestaoDocumentoView";
import type { JSONContent } from "@tiptap/react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const RESPOSTA_MAX = 500;

type StatusSugestao = "NAO_RESPONDIDO" | "RESPONDIDO";

type Props = Readonly<{
  sugestaoId: string;
  resposta: string;
  respostaDocumento: JSONContent | null;
  onRespostaChange: (value: SugestaoEditorValor) => void;
  status: StatusSugestao;
  onStatusChange: (value: StatusSugestao) => void;
  respostaBloqueada: boolean;
  statusBloqueado: boolean;
  statusFinal: boolean;
  respostaJaSalva: boolean;
  onSaved: () => Promise<void> | void;
}>;

export default function FormRespostaSugestao({
  sugestaoId,
  resposta,
  respostaDocumento,
  onRespostaChange,
  status,
  onStatusChange,
  respostaBloqueada,
  statusBloqueado,
  statusFinal,
  respostaJaSalva,
  onSaved,
}: Props) {
  const [saving, setSaving] = useState(false);

  async function handleSalvar() {
    const texto = resposta.trim();

    if (texto.length > RESPOSTA_MAX) {
      toast.error(`A resposta deve ter no máximo ${RESPOSTA_MAX} caracteres.`);
      return;
    }

    setSaving(true);

    try {
      const res = await apiFetch(`${API}/sugestoes/${sugestaoId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(texto && !respostaJaSalva ? { resposta: texto, respostaDocumento } : {}),
          ...(!statusBloqueado ? { status } : {}),
        }),
      });

      if (!res.ok) {
        throw new Error(await extractApiError(res, "Falha ao salvar."));
      }

      toast.success("Sugestão atualizada!");
      await onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-5 space-y-3">
      <div className="space-y-1 text-sm">
        <span className="font-medium">
          Resposta do funcionário/professor
        </span>

        {respostaJaSalva ? (
          <SugestaoDocumentoView documento={respostaDocumento} conteudo={resposta} />
        ) : (
          <SugestaoEditor disabled={respostaBloqueada} onChange={onRespostaChange} />
        )}

        <span className="block text-right text-xs text-muted-foreground">
          {resposta.length}/{RESPOSTA_MAX}
        </span>

        {respostaBloqueada && (
          <span className="block text-xs text-muted-foreground">
            {statusFinal
              ? "Sugestão respondida: a resposta não pode mais ser alterada."
              : "Esta resposta já foi salva e não pode mais ser editada."}
          </span>
        )}
      </div>

      <label className="space-y-1 text-sm block">
        <span className="font-medium">Status</span>

        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as StatusSugestao)}
          disabled={statusBloqueado}
          className="w-full h-10 rounded-lg border border-[var(--border)] bg-input px-3 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <option value="NAO_RESPONDIDO">Não respondido</option>
          <option value="RESPONDIDO">Respondido</option>
        </select>

        {statusBloqueado && (
          <span className="block text-xs text-muted-foreground">
            Status &quot;Respondido&quot; é definitivo e não pode mais ser alterado.
          </span>
        )}
      </label>

      {!statusBloqueado && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSalvar}
            disabled={saving}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}
