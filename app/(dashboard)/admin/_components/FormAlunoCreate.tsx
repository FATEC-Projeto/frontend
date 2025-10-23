"use client";
import { apiFetch } from "../../../../utils/api"

import { useState } from "react";
import { BadgeCheck, Loader2, KeyRound, Sparkles } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type Props = {
  onSuccess?: (createdUser: any) => void;
  onCancel?: () => void;
};

function randPassword(len = 12) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export default function FormAlunoCreate({ onSuccess, onCancel }: Props) {
  const [nome, setNome] = useState("");
  const [emailEducacional, setEmailEducacional] = useState("");
  const [ra, setRa] = useState("");
  const [senha, setSenha] = useState("");
  const [gerada, setGerada] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function gerarSenha() {
    setSenha(randPassword());
    setGerada(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailEducacional || !ra) {
      alert("E-mail educacional e RA são obrigatórios.");
      return;
    }

    try {
      setSubmitting(true);

      const token =
        (typeof window !== "undefined" && localStorage.getItem("accessToken")) ||
        process.env.NEXT_PUBLIC_ACCESS_TOKEN ||
        "";

        const res = await apiFetch(`${API_URL}/usuarios`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: nome || null,
            emailEducacional,
            emailPessoal: emailEducacional,
            ra,
            papel: "USUARIO", // aluno sempre é USUARIO
            senha: senha || undefined, // opcional — backend pode gerar
          }),
        });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Falha ao criar aluno (${res.status})`);
      }

      const created = await res.json();
      onSuccess?.(created);
      setNome("");
      setEmailEducacional("");
      setRa("");
      setSenha("");
      setGerada(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Erro ao criar aluno");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Linha 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">Nome (opcional)</label>
          <input
            className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3"
            placeholder="Ex.: Fulano da Silva"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">RA *</label>
          <input
            className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3"
            placeholder="Ex.: 123456"
            value={ra}
            onChange={(e) => setRa(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Linha 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">E-mail educacional *</label>
          <input
            type="email"
            className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3"
            placeholder="nome.sobrenome@fatec.sp.gov.br"
            value={emailEducacional}
            onChange={(e) => setEmailEducacional(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Senha (opcional)</label>
          <div className="mt-1 flex gap-2">
            <input
              className="flex-1 h-10 rounded-lg border border-[var(--border)] bg-background px-3 font-mono"
              placeholder="(deixe vazio para o sistema gerar)"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button
              type="button"
              onClick={gerarSenha}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
              title="Gerar senha aleatória"
            >
              <Sparkles className="size-4" />
              Gerar
            </button>
          </div>
          {gerada && senha && (
            <div className="mt-1 text-xs inline-flex items-center gap-1 text-[var(--success)]">
              <BadgeCheck className="size-3" />
              Senha gerada — copie e entregue ao aluno com segurança
            </div>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-3 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm hover:brightness-95 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Salvando…
            </>
          ) : (
            <>
              <KeyRound className="size-4" /> Criar aluno
            </>
          )}
        </button>
      </div>
    </form>
  );
}
