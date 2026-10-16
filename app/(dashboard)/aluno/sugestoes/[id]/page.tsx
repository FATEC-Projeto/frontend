"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../../utils/api";
import SugestaoDetalheLayout from "../../../../components/shared/SugestaoDetalheLayout";
import SugestaoDocumentoView from "../../../../components/shared/SugestaoDocumentoView";
import type { JSONContent } from "@tiptap/react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type StatusSugestao = "NAO_RESPONDIDO" | "RESPONDIDO";

type SugestaoDetalhe = {
  id: string;
  conteudo: string;
  emailContato: string;
  status: StatusSugestao;
  resposta: string | null;
  respostaDocumento: JSONContent | null;
  criadoEm: string;
  respondidoPor?: { nome?: string | null } | null;
};

export default function DetalheSugestaoAlunoPage() {
  const params = useParams();
  const id = params?.id as string;

  const [sugestao, setSugestao] = useState<SugestaoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`${API}/sugestoes/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          setErro(
            res.status === 404
              ? "Sugestão não encontrada."
              : "Não foi possível carregar a sugestão.",
          );
          return;
        }

        setSugestao(await res.json());
      } catch {
        setErro("Não foi possível carregar a sugestão.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <SugestaoDetalheLayout
      voltarHref="/aluno/sugestoes"
      loading={loading}
      erro={erro}
      sugestao={sugestao}
    >
      {sugestao?.status === "RESPONDIDO" && sugestao.resposta && (
        <div className="rounded-xl border border-[var(--border)] bg-card p-5">
          <div className="text-sm font-semibold mb-2">
            {sugestao.respondidoPor?.nome
              ? `Resposta de "${sugestao.respondidoPor.nome}"`
              : "Resposta do funcionário/professor"}
          </div>

          <div className="text-muted-foreground">
            <SugestaoDocumentoView documento={sugestao.respostaDocumento} conteudo={sugestao.resposta} />
          </div>
        </div>
      )}
    </SugestaoDetalheLayout>
  );
}
