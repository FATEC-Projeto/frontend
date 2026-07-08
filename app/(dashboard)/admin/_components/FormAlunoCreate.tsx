"use client";
import { apiFetch, extractApiError } from "../../../../utils/api";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  RotateCcw,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const COURSES = [
  { key: "DSM",   sigla: "DSM",   nome: "Desenvolvimento de Software Multiplataforma" },
  { key: "CD",    sigla: "CD",    nome: "Ciência de Dados" },
  { key: "GPI",   sigla: "GPI",   nome: "Gestão da Produção Industrial" },
  { key: "GE",    sigla: "GE",    nome: "Gestão Empresarial" },
  { key: "DP",    sigla: "DP",    nome: "Design de Produto (ênfase em processos de produção)" },
  { key: "COMEX", sigla: "COMEX", nome: "Comércio Exterior" },
] as const;

const TURNOS = ["Manhã", "Tarde", "Noite"] as const;

type Props = {
  onSuccess?: (createdUser: any) => void;
  onCancel?: () => void;
};

type SuccessInfo = {
  nome: string;
  ra: string;
  email: string;
  senhaUsada: string | null;
};

const inputCls =
  "mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";
const labelCls = "block text-sm text-muted-foreground";

export default function FormAlunoCreate({ onSuccess, onCancel }: Props) {
  /* ── Identificação ── */
  const [nome, setNome] = useState("");
  const [ra, setRa] = useState("");
  const [emailEducacional, setEmailEducacional] = useState("");
  const [emailPessoal, setEmailPessoal] = useState("");

  /* ── Curso ── */
  const [courseKey, setCourseKey] = useState("");
  const [cursoNome, setCursoNome] = useState("");
  const [cursoSigla, setCursoSigla] = useState("");

  /* ── Dados acadêmicos ── */
  const [unidadeFatec, setUnidadeFatec] = useState("");
  const [turno, setTurno] = useState("");
  const [turma, setTurma] = useState("");
  const [semestreAtual, setSemestreAtual] = useState("");
  const [anoSemestreIngresso, setAnoSemestreIngresso] = useState("");

  /* ── Senha inicial ── */
  const [usarSenhaPersonalizada, setUsarSenhaPersonalizada] = useState(false);
  const [senhaInicial, setSenhaInicial] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);
  const [lastCreated, setLastCreated] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  function handleCourseChange(val: string) {
    setCourseKey(val);
    if (!val) { setCursoNome(""); setCursoSigla(""); return; }
    if (val === "OUTRO") return;
    const c = COURSES.find((c) => c.key === val);
    if (c) { setCursoNome(c.nome); setCursoSigla(c.sigla); }
  }

  const senhaValida = !usarSenhaPersonalizada || senhaInicial.trim().length >= 8;

  const canSubmit = useMemo(() => {
    const raOk = ra.trim().length > 0;
    const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEducacional);
    return raOk && mailOk && senhaValida && !submitting;
  }, [ra, emailEducacional, senhaValida, submitting]);

  function handleCopiarSenha(senha: string) {
    navigator.clipboard.writeText(senha).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function resetForm() {
    setNome(""); setRa(""); setEmailEducacional(""); setEmailPessoal("");
    setCourseKey(""); setCursoNome(""); setCursoSigla("");
    setUnidadeFatec(""); setTurno(""); setTurma("");
    setSemestreAtual(""); setAnoSemestreIngresso("");
    setUsarSenhaPersonalizada(false); setSenhaInicial(""); setMostrarSenha(false);
    setSuccessInfo(null); setLastCreated(null); setCopied(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setSubmitting(true);

      const payload: Record<string, any> = {
        nome: nome.trim() || undefined,
        emailEducacional,
        emailPessoal: emailPessoal.trim() || emailEducacional,
        ra: ra.trim(),
        papel: "USUARIO",
        ativo: true,
      };

      if (usarSenhaPersonalizada && senhaInicial.trim()) {
        payload.senha = senhaInicial.trim();
      }

      if (cursoNome.trim())           payload.cursoNome           = cursoNome.trim();
      if (cursoSigla.trim())          payload.cursoSigla          = cursoSigla.trim();
      if (unidadeFatec.trim())        payload.unidadeFatec        = unidadeFatec.trim();
      if (turno)                      payload.turno               = turno;
      if (turma.trim())               payload.turma               = turma.trim();
      if (semestreAtual.trim())       payload.semestreAtual       = semestreAtual.trim();
      if (anoSemestreIngresso.trim()) payload.anoSemestreIngresso = anoSemestreIngresso.trim();

      const res = await apiFetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await extractApiError(res, `Falha ao criar aluno (${res.status})`));
      }

      const created = await res.json();

      setLastCreated(created);
      setSuccessInfo({
        nome: nome.trim() || created?.nome || "",
        ra: ra.trim(),
        email: emailEducacional,
        senhaUsada: usarSenhaPersonalizada && senhaInicial.trim() ? senhaInicial.trim() : null,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Erro ao criar aluno");
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
            <p className="font-semibold text-base">Aluno cadastrado com sucesso!</p>
            {successInfo.nome && (
              <p className="text-sm text-muted-foreground mt-0.5">{successInfo.nome}</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
          <div className="px-4 py-2.5 flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground w-24 shrink-0">RA</span>
            <span className="text-sm font-medium flex-1 text-right font-mono">{successInfo.ra}</span>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground w-24 shrink-0">E-mail</span>
            <span className="text-sm flex-1 text-right truncate">{successInfo.email}</span>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground w-24 shrink-0">Senha inicial</span>
            {successInfo.senhaUsada ? (
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-sm font-medium font-mono bg-[var(--muted)] px-2 py-0.5 rounded">
                  {successInfo.senhaUsada}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopiarSenha(successInfo.senhaUsada!)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                  title="Copiar senha"
                >
                  {copied ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground flex-1 text-right">
                Senha padrão do sistema
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground rounded-lg bg-[var(--muted)] px-3 py-2">
          O aluno deverá trocar a senha no primeiro acesso. Compartilhe as credenciais acima com o aluno.
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>
              Nome completo{" "}
              <span className="text-muted-foreground/60">(opcional)</span>
            </label>
            <input
              className={inputCls}
              placeholder="Ex.: Fulano da Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={160}
            />
          </div>
          <div>
            <label className={labelCls}>RA *</label>
            <input
              className={inputCls}
              placeholder="Ex.: 1234567890123"
              value={ra}
              onChange={(e) => setRa(e.target.value)}
              required
              maxLength={32}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>E-mail educacional *</label>
            <div className="relative">
              <input
                type="email"
                className={inputCls + " pr-9"}
                placeholder="nome.sobrenome@fatec.sp.gov.br"
                value={emailEducacional}
                onChange={(e) => setEmailEducacional(e.target.value)}
                required
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 size-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Link de primeiro acesso será enviado para este endereço.
            </p>
          </div>
          <div>
            <label className={labelCls}>
              E-mail pessoal{" "}
              <span className="text-muted-foreground/60">(opcional)</span>
            </label>
            <div className="relative">
              <input
                type="email"
                className={inputCls + " pr-9"}
                placeholder="Ex.: nome@gmail.com"
                value={emailPessoal}
                onChange={(e) => setEmailPessoal(e.target.value)}
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </fieldset>

      {/* ── Seção: Senha inicial ── */}
      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Senha inicial
        </legend>

        <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
          {/* Toggle */}
          <label className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none">
            <div className="flex items-center gap-2.5">
              <KeyRound className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium leading-tight">Definir senha personalizada</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {usarSenhaPersonalizada
                    ? "O aluno deverá trocar esta senha no primeiro acesso."
                    : "Por padrão, o sistema usa a senha temporária configurada pelo administrador."}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={usarSenhaPersonalizada}
              onClick={() => {
                setUsarSenhaPersonalizada((v) => !v);
                if (!usarSenhaPersonalizada) setSenhaInicial("");
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                usarSenhaPersonalizada ? "bg-primary" : "bg-[var(--muted-foreground)]/30"
              }`}
            >
              <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
                  usarSenhaPersonalizada ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </label>

          {/* Campo de senha — visível quando toggle ativo */}
          {usarSenhaPersonalizada && (
            <div className="px-4 py-3 space-y-1.5">
              <label className={labelCls}>
                Nova senha{" "}
                <span className="text-muted-foreground/60">(mín. 8 caracteres)</span>
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  className={inputCls + " pr-10 mt-0"}
                  placeholder="Digite a senha inicial"
                  value={senhaInicial}
                  onChange={(e) => setSenhaInicial(e.target.value)}
                  minLength={8}
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
              {senhaInicial && senhaInicial.length < 8 && (
                <p className="text-xs text-destructive">A senha deve ter pelo menos 8 caracteres.</p>
              )}
            </div>
          )}
        </div>
      </fieldset>

      {/* ── Seção: Curso ── */}
      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Curso{" "}
          <span className="normal-case text-muted-foreground/60 font-normal">(opcional)</span>
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Curso</label>
            <select
              className={inputCls}
              value={courseKey}
              onChange={(e) => handleCourseChange(e.target.value)}
            >
              <option value="">Selecione um curso…</option>
              {COURSES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.nome} — {c.sigla}
                </option>
              ))}
              <option value="OUTRO">Outro curso…</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Sigla</label>
              <input
                className={inputCls}
                placeholder="Ex.: DSM"
                value={cursoSigla}
                onChange={(e) => setCursoSigla(e.target.value)}
                disabled={!courseKey}
                maxLength={16}
              />
            </div>
            <div>
              <label className={labelCls}>Nome do curso</label>
              <input
                className={inputCls}
                placeholder="Nome completo"
                value={cursoNome}
                onChange={(e) => setCursoNome(e.target.value)}
                disabled={!courseKey}
                maxLength={128}
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* ── Seção: Dados Acadêmicos ── */}
      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Dados Acadêmicos{" "}
          <span className="normal-case text-muted-foreground/60 font-normal">(opcionais)</span>
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Unidade Fatec</label>
            <input
              className={inputCls}
              placeholder="Ex.: Fatec Cotia"
              value={unidadeFatec}
              onChange={(e) => setUnidadeFatec(e.target.value)}
              maxLength={128}
            />
          </div>
          <div>
            <label className={labelCls}>Turno</label>
            <select
              className={inputCls}
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
            >
              <option value="">Selecione…</option>
              {TURNOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Turma</label>
            <input
              className={inputCls}
              placeholder="Ex.: DSM-3A"
              value={turma}
              onChange={(e) => setTurma(e.target.value)}
              maxLength={64}
            />
          </div>
          <div>
            <label className={labelCls}>Semestre atual</label>
            <input
              className={inputCls}
              placeholder="Ex.: 3"
              value={semestreAtual}
              onChange={(e) => setSemestreAtual(e.target.value)}
              maxLength={32}
            />
          </div>
          <div>
            <label className={labelCls}>Ano/semestre de ingresso</label>
            <input
              className={inputCls}
              placeholder="Ex.: 2023/1"
              value={anoSemestreIngresso}
              onChange={(e) => setAnoSemestreIngresso(e.target.value)}
              maxLength={32}
            />
          </div>
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
            "Criar aluno"
          )}
        </button>
      </div>
    </form>
  );
}
