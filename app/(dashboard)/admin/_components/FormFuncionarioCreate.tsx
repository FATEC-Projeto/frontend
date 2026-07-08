"use client";
import { apiFetch, extractApiError } from "../../../../utils/api";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  RotateCcw,
  Shield,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const PAPEIS = [
  { value: "BACKOFFICE",    label: "Backoffice",    desc: "Atende chamados e gerencia solicitações." },
  { value: "TECNICO",       label: "Técnico",       desc: "Resolve chamados técnicos atribuídos ao setor." },
  { value: "ADMINISTRADOR", label: "Administrador", desc: "Acesso total: usuários, setores e configurações." },
] as const;

type PapelValue = (typeof PAPEIS)[number]["value"];

type Props = {
  onSuccess?: (createdUser: any) => void;
  onCancel?: () => void;
};

type SuccessInfo = {
  nome: string;
  email: string;
  papel: string;
  senha: string;
};

const inputCls =
  "mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";
const labelCls = "block text-sm text-muted-foreground";

export default function FormFuncionarioCreate({ onSuccess, onCancel }: Props) {
  const [nome, setNome] = useState("");
  const [emailPessoal, setEmailPessoal] = useState("");
  const [papel, setPapel] = useState<PapelValue | "">("");

  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);
  const [lastCreated, setLastCreated] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const senhaValida = senha.trim().length >= 8;

  const canSubmit = useMemo(() => {
    const nomeOk = nome.trim().length >= 2;
    const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPessoal);
    const papelOk = papel !== "";
    return nomeOk && mailOk && papelOk && senhaValida && !submitting;
  }, [nome, emailPessoal, papel, senhaValida, submitting]);

  function handleCopiarSenha(valor: string) {
    navigator.clipboard.writeText(valor).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function resetForm() {
    setNome(""); setEmailPessoal(""); setPapel("");
    setSenha(""); setMostrarSenha(false);
    setSuccessInfo(null); setLastCreated(null); setCopied(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setSubmitting(true);

      const payload: Record<string, any> = {
        nome: nome.trim(),
        emailPessoal: emailPessoal.trim(),
        papel,
        ativo: true,
        senha: senha.trim(),
      };

      const res = await apiFetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await extractApiError(res, `Falha ao criar funcionário (${res.status})`));
      }

      const created = await res.json();
      const papelLabel = PAPEIS.find((p) => p.value === payload.papel)?.label ?? payload.papel;

      setLastCreated(created);
      setSuccessInfo({
        nome: nome.trim() || created?.nome || "",
        email: emailPessoal.trim(),
        papel: papelLabel,
        senha: senha.trim(),
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Erro ao criar funcionário");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Tela de sucesso ── */
  if (successInfo) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle2 className="size-10 text-emerald-500" />
          <div className="text-center">
            <p className="font-semibold text-base">Funcionário cadastrado com sucesso!</p>
            {successInfo.nome && (
              <p className="text-sm text-muted-foreground mt-0.5">{successInfo.nome}</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
          <div className="px-4 py-2.5 flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground w-24 shrink-0">Papel</span>
            <span className="text-sm font-medium flex-1 text-right">{successInfo.papel}</span>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground w-24 shrink-0">E-mail</span>
            <span className="text-sm flex-1 text-right truncate">{successInfo.email}</span>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground w-24 shrink-0">Senha inicial</span>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="text-sm font-medium font-mono bg-[var(--muted)] px-2 py-0.5 rounded">
                {successInfo.senha}
              </span>
              <button
                type="button"
                onClick={() => handleCopiarSenha(successInfo.senha)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                title="Copiar senha"
              >
                {copied ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground rounded-lg bg-[var(--muted)] px-3 py-2">
          O funcionário deverá trocar a senha no primeiro acesso. Compartilhe as credenciais acima com segurança.
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)]"
          >
            <RotateCcw className="size-3.5" /> Cadastrar outro
          </button>
          {(onSuccess || onCancel) && (
            <button
              type="button"
              onClick={() => onSuccess ? onSuccess(lastCreated) : onCancel?.()}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm hover:brightness-95"
            >
              Concluído
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Seção: Identificação ── */}
      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Identificação
        </legend>

        <div>
          <label className={labelCls}>Nome completo *</label>
          <input
            className={inputCls}
            placeholder="Ex.: Ana Pereira"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            minLength={2}
            maxLength={160}
          />
        </div>

        <div>
          <label className={labelCls}>E-mail *</label>
          <div className="relative">
            <input
              type="email"
              className={inputCls + " pr-9"}
              placeholder="nome.sobrenome@fatec.sp.gov.br"
              value={emailPessoal}
              onChange={(e) => setEmailPessoal(e.target.value)}
              required
            />
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 size-4 text-muted-foreground pointer-events-none" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Usado para login e para o link de primeiro acesso.
          </p>
        </div>
      </fieldset>

      {/* ── Seção: Papel ── */}
      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Papel de acesso *
        </legend>

        <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
          {PAPEIS.map((p) => (
            <label
              key={p.value}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-[var(--muted)]/50"
            >
              <input
                type="radio"
                name="papel"
                value={p.value}
                checked={papel === p.value}
                onChange={() => setPapel(p.value)}
                className="size-4 accent-[var(--primary)]"
              />
              <Shield className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium leading-tight">{p.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── Seção: Senha inicial ── */}
      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Senha inicial *
        </legend>

        <div className="space-y-1.5">
          <label className={labelCls}>
            Senha{" "}
            <span className="text-muted-foreground/60">(mín. 8 caracteres)</span>
          </label>
          <div className="relative">
            <input
              type={mostrarSenha ? "text" : "password"}
              className={inputCls + " pr-10 mt-0"}
              placeholder="Digite a senha inicial"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {senha && senha.length < 8 && (
            <p className="text-xs text-destructive">A senha deve ter pelo menos 8 caracteres.</p>
          )}
          <p className="text-xs text-muted-foreground">
            O funcionário deverá trocar esta senha no primeiro acesso.
          </p>
        </div>
      </fieldset>

      {/* ── Ações ── */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
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
            <><Loader2 className="size-4 animate-spin" /> Salvando…</>
          ) : (
            "Criar funcionário"
          )}
        </button>
      </div>
    </form>
  );
}
