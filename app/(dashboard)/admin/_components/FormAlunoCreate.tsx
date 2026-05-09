"use client";
import { apiFetch } from "../../../../utils/api";
import { useMemo, useState } from "react";
import { Loader2, Info, Mail } from "lucide-react";

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

const inputCls = "mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";
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

  const [submitting, setSubmitting] = useState(false);

  function handleCourseChange(val: string) {
    setCourseKey(val);
    if (!val) { setCursoNome(""); setCursoSigla(""); return; }
    if (val === "OUTRO") return;
    const c = COURSES.find((c) => c.key === val);
    if (c) { setCursoNome(c.nome); setCursoSigla(c.sigla); }
  }

  const canSubmit = useMemo(() => {
    const raOk = ra.trim().length > 0;
    const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEducacional);
    return raOk && mailOk && !submitting;
  }, [ra, emailEducacional, submitting]);

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
        const text = await res.text().catch(() => "");
        try {
          const json = JSON.parse(text);
          if (json?.issues?.length) {
            throw new Error(json.issues.map((i: any) => `${i.path}: ${i.message}`).join(" | "));
          }
          throw new Error(json?.message || `Falha ao criar aluno (${res.status})`);
        } catch {
          throw new Error(text || `Falha ao criar aluno (${res.status})`);
        }
      }

      const created = await res.json();
      onSuccess?.(created);

      setNome(""); setRa(""); setEmailEducacional(""); setEmailPessoal("");
      setCourseKey(""); setCursoNome(""); setCursoSigla("");
      setUnidadeFatec(""); setTurno(""); setTurma("");
      setSemestreAtual(""); setAnoSemestreIngresso("");
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Erro ao criar aluno");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Aviso de fluxo */}
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-[var(--border)] bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Ao cadastrar o aluno, o sistema define uma <strong>senha temporária</strong> automaticamente
          e, se configurado, envia um <strong>link de primeiro acesso</strong> para o e-mail educacional.
        </p>
      </div>

      {/* ── Seção: Identificação ── */}
      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Identificação
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nome completo <span className="text-muted-foreground/60">(opcional)</span></label>
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
              <Mail className="absolute right-3 top-1/2 translate-y-px -translate-y-1/2 mt-0.5 size-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Link de primeiro acesso será enviado para este endereço.
            </p>
          </div>
          <div>
            <label className={labelCls}>E-mail pessoal <span className="text-muted-foreground/60">(opcional)</span></label>
            <div className="relative">
              <input
                type="email"
                className={inputCls + " pr-9"}
                placeholder="Ex.: nome@gmail.com"
                value={emailPessoal}
                onChange={(e) => setEmailPessoal(e.target.value)}
              />
              <Mail className="absolute right-3 top-1/2 translate-y-px -translate-y-1/2 mt-0.5 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </fieldset>

      {/* ── Seção: Curso ── */}
      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Curso <span className="normal-case text-muted-foreground/60 font-normal">(opcional)</span>
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
          Dados Acadêmicos <span className="normal-case text-muted-foreground/60 font-normal">(opcionais)</span>
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
