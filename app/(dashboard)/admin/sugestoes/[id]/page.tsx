"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../../utils/api";
import SugestaoDetalheLayout from "../../../../components/shared/SugestaoDetalheLayout";
import FormRespostaSugestao from "../../_components/FormRespostaSugestao";
import type { SugestaoEditorValor } from "../../../../components/shared/SugestaoEditor";
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
  usuario?: { nome?: string | null; ra?: string | null } | null;
};

export default function DetalheSugestaoAdminPage() {
  const params = useParams();
  const id = params?.id as string;

  const [sugestao, setSugestao] = useState<SugestaoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [resposta, setResposta] = useState("");
  const [respostaDocumento, setRespostaDocumento] = useState<JSONContent | null>(null);
  const [status, setStatus] = useState<StatusSugestao>("NAO_RESPONDIDO");

  const load = useCallback(async () => {
    if (!id) return;

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

      const data: SugestaoDetalhe = await res.json();
      setSugestao(data);
      setResposta(data.resposta ?? "");
      setRespostaDocumento(data.respostaDocumento ?? null);
      setStatus(data.status);
    } catch {
      setErro("Não foi possível carregar a sugestão.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const statusFinal = sugestao?.status === "RESPONDIDO";
  const respostaJaSalva = !!sugestao?.resposta;
  const respostaBloqueada = statusFinal || respostaJaSalva;
  const statusBloqueado = statusFinal;

  return (
    <SugestaoDetalheLayout
      voltarHref="/admin/sugestoes"
      loading={loading}
      erro={erro}
      sugestao={sugestao}
      identificacao={
        sugestao && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {sugestao.usuario?.nome ?? "Aluno"}
            {sugestao.usuario?.ra ? ` · R.A. ${sugestao.usuario.ra}` : ""}
            {sugestao.emailContato ? ` · ${sugestao.emailContato}` : ""}
          </div>
        )
      }
    >
      <FormRespostaSugestao
        sugestaoId={id}
        resposta={resposta}
        respostaDocumento={respostaDocumento}
        onRespostaChange={(valor: SugestaoEditorValor) => {
          setResposta(valor.texto);
          setRespostaDocumento(valor.documento);
        }}
        status={status}
        onStatusChange={setStatus}
        respostaBloqueada={respostaBloqueada}
        statusBloqueado={statusBloqueado}
        statusFinal={statusFinal}
        respostaJaSalva={respostaJaSalva}
        onSaved={load}
      />
    </SugestaoDetalheLayout>
  );
}
