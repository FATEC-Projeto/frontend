"use client";
import { apiFetch } from "../../../../utils/api";
import { useMemo, useState } from "react";
import { Loader2, Info, Mail } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

/** Catálogo prático — Fatec Cotia */
const COURSES = [
  { key: "DSM",  sigla: "DSM",  nome: "Desenvolvimento de Software Multiplataforma" },
  { key: "CD",   sigla: "CD",   nome: "Ciência de Dados" },
  { key: "GPI",  sigla: "GPI",  nome: "Gestão da Produção Industrial" },
  { key: "GE",   sigla: "GE",   nome: "Gestão Empresarial" },
  { key: "DP",   sigla: "DP",   nome: "Design de Produto (ênfase em processos de produção)" },
  { key: "COMEX",sigla: "COMEX",nome: "Comércio Exterior" },
] as const;

type Props = {
  onSuccess?: (createdUser: any) => void;
  onCancel?: () => void;
};

export default function FormAlunoCreate({ onSuccess, onCancel }: Props) {
  const [nome, setNome] = useState("");
  const [emailEducacional, setEmailEducacional] = useState("");
  const [ra, setRa] = useState("");

  // seleção guiada de curso
  const [courseKey, setCourseKey] = useState<string>(""); // "", "DSM", "CD", ... ou "OUTRO"
  const [cursoNome, setCursoNome] = useState("");
  const [cursoSigla, setCursoSigla] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // quando troca o select, preenche automatico; "OUTRO" libera campos manuais
  function handleCourseChange(val: string) {
    setCourseKey(val);
    if (!val) {
      setCursoNome("");
      setCursoSigla("");
      return;
    }
    if (val === "OUTRO") {
      // libera os campos sem preencher
      return;
    }
    const c = COURSES.find(c => c.key === val);
    if (c) {
      setCursoNome(c.nome);
      setCursoSigla(c.sigla);
    }
  }

  const canSubmit = useMemo(() => {
    const idOk = ra.trim().length > 0;
    const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEducacional);
    return idOk && mailOk && !submitting;
  }, [ra, emailEducacional, submitting]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);

      const payload: any = {
        nome: nome || undefined,
        emailEducacional,
        emailPessoal: emailEducacional, // fallback
        ra,
        papel: "USUARIO",
        ativo: true,
        // ❗ não envia senha: o backend define a senha temporária
        // e marca precisaTrocarSenha = true para alunos (tem RA)
      };

      // só envia curso se tiver algo preenchido (seletor ou manual)
      if (cursoNome?.trim()) payload.cursoNome = cursoNome.trim();
      if (cursoSigla?.trim()) payload.cursoSigla = cursoSigla.trim();

      const res = await apiFetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        try {
          const json = JSON.parse(text);
          if (json?.issues?.length) {
            const msg = json.issues.map((i: any) => `${i.path}: ${i.message}`).join(" | ");
            throw new Error(`Validação falhou: ${msg}`);
          }
          throw new Error(json?.message || `Falha ao criar aluno (${res.status})`);
        } catch {
          throw new Error(text || `Falha ao criar aluno (${res.status})`);
        }
      }

      const created = await res.json();
      onSuccess?.(created);

      // reset
      setNome("");
      setEmailEducacional("");
      setRa("");
      setCourseKey("");
      setCursoNome("");
      setCursoSigla("");
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Erro ao criar aluno");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Linha 0 — aviso de fluxo */}
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-[var(--border)] bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4" />
        <p>
          Ao cadastrar o aluno, o sistema define uma <strong>senha temporária</strong> automaticamente
          e, se configurado no backend, envia um <strong>link de primeiro acesso</strong> para o e-mail educacional.
        </p>
      </div>

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
          <div className="relative">
            <input
              type="email"
              className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3 pr-9"
              placeholder="nome.sobrenome@fatec.sp.gov.br"
              value={emailEducacional}
              onChange={(e) => setEmailEducacional(e.target.value)}
              required
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Mail className="size-4" />
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            É para esse e-mail que será enviado o link de primeiro acesso / redefinição de senha.
          </p>
        </div>

        <div className="text-xs text-muted-foreground flex items-start gap-2 mt-6 sm:mt-7">
          <Info className="size-3 mt-0.5" />
          <p>
            Você não precisa informar a senha ao aluno. Ele definirá uma <strong>senha nova</strong> no primeiro acesso,
            usando o link enviado por e-mail.
          </p>
        </div>
      </div>

      {/* Linha 3 — Curso (UX prática) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">Curso</label>
          <select
            className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3"
            value={courseKey}
            onChange={(e) => handleCourseChange(e.target.value)}
          >
            <option value="">Selecione um curso…</option>
            {COURSES.map(c => (
              <option key={c.key} value={c.key}>{c.nome} — {c.sigla}</option>
            ))}
            <option value="OUTRO">Outro curso…</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Ao selecionar, os campos abaixo são preenchidos automaticamente.
          </p>
        </div>

        {/* quando OUTRO, mostra os campos pra digitar; caso contrário, exibe preenchidos e editáveis */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm text-muted-foreground">Sigla</label>
            <input
              className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3"
              placeholder="Ex.: DSM"
              value={cursoSigla}
              onChange={(e) => setCursoSigla(e.target.value)}
              disabled={!courseKey} // só habilita após selecionar algo (inclui OUTRO)
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Nome do curso</label>
            <input
              className="mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3"
              placeholder="Ex.: Desenvolvimento de Software Multiplataforma"
              value={cursoNome}
              onChange={(e) => setCursoNome(e.target.value)}
              disabled={!courseKey}
            />
          </div>
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
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm hover:brightness-95 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Salvando…
            </>
          ) : (
            <>
              Criar aluno
            </>
          )}
        </button>
      </div>
    </form>
  );
}
