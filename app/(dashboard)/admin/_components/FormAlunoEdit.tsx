"use client";
import { apiFetch } from "../../../../utils/api";
import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const TURNOS = ["Manhã", "Tarde", "Noite"] as const;
const CANAIS = ["E-mail", "WhatsApp", "Telefone", "Presencial"] as const;
const PERIODOS = ["Manhã", "Tarde", "Noite", "Qualquer horário"] as const;

type AlunoData = {
  id: string;
  nome?: string | null;
  emailPessoal?: string | null;
  emailEducacional?: string | null;
  ra?: string | null;
  ativo?: boolean;
  cursoNome?: string | null;
  cursoSigla?: string | null;
  unidadeFatec?: string | null;
  curso?: string | null;
  eixoTecnologico?: string | null;
  turno?: string | null;
  turma?: string | null;
  semestreAtual?: string | null;
  matrizCurricular?: string | null;
  situacaoAcademica?: string | null;
  anoSemestreIngresso?: string | null;
  coordenadorCurso?: string | null;
  telefoneCelular?: string | null;
  whatsapp?: string | null;
  canalPreferencialContato?: string | null;
  melhorPeriodoContato?: string | null;
  necessitaAtendimentoAcessivel?: boolean | null;
  tipoAcessibilidade?: string | null;
  observacoesAtendimento?: string | null;
};

type Props = {
  aluno: AlunoData;
  onClose: () => void;
  onSaved: (updated: AlunoData) => void;
};

const inputCls = "mt-1 w-full h-10 rounded-lg border border-[var(--border)] bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";
const labelCls = "block text-sm text-muted-foreground";
const sectionCls = "text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 pb-1 border-b border-[var(--border)]";

export default function FormAlunoEdit({ aluno, onClose, onSaved }: Props) {
  const [nome,                        setNome]                        = useState(aluno.nome ?? "");
  const [emailPessoal,                setEmailPessoal]                = useState(aluno.emailPessoal ?? "");
  const [emailEducacional,            setEmailEducacional]            = useState(aluno.emailEducacional ?? "");
  const [ra,                          setRa]                          = useState(aluno.ra ?? "");
  const [ativo,                       setAtivo]                       = useState(aluno.ativo ?? true);

  const [cursoNome,                   setCursoNome]                   = useState(aluno.cursoNome ?? "");
  const [cursoSigla,                  setCursoSigla]                  = useState(aluno.cursoSigla ?? "");
  const [curso,                       setCurso]                       = useState(aluno.curso ?? "");
  const [eixoTecnologico,             setEixoTecnologico]             = useState(aluno.eixoTecnologico ?? "");
  const [matrizCurricular,            setMatrizCurricular]            = useState(aluno.matrizCurricular ?? "");

  const [unidadeFatec,                setUnidadeFatec]                = useState(aluno.unidadeFatec ?? "");
  const [turno,                       setTurno]                       = useState(aluno.turno ?? "");
  const [turma,                       setTurma]                       = useState(aluno.turma ?? "");
  const [semestreAtual,               setSemestreAtual]               = useState(aluno.semestreAtual ?? "");
  const [anoSemestreIngresso,         setAnoSemestreIngresso]         = useState(aluno.anoSemestreIngresso ?? "");
  const [situacaoAcademica,           setSituacaoAcademica]           = useState(aluno.situacaoAcademica ?? "");
  const [coordenadorCurso,            setCoordenadorCurso]            = useState(aluno.coordenadorCurso ?? "");

  const [telefoneCelular,             setTelefoneCelular]             = useState(aluno.telefoneCelular ?? "");
  const [whatsapp,                    setWhatsapp]                    = useState(aluno.whatsapp ?? "");
  const [canalPreferencialContato,    setCanalPreferencialContato]    = useState(aluno.canalPreferencialContato ?? "");
  const [melhorPeriodoContato,        setMelhorPeriodoContato]        = useState(aluno.melhorPeriodoContato ?? "");

  const [necessitaAtendimentoAcessivel, setNecessitaAtendimentoAcessivel] = useState(aluno.necessitaAtendimentoAcessivel ?? false);
  const [tipoAcessibilidade,          setTipoAcessibilidade]          = useState(aluno.tipoAcessibilidade ?? "");
  const [observacoesAtendimento,      setObservacoesAtendimento]      = useState(aluno.observacoesAtendimento ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fecha ao pressionar Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload: Record<string, any> = {
        nome:             nome.trim()             || null,
        emailPessoal:     emailPessoal.trim()     || null,
        emailEducacional: emailEducacional.trim() || null,
        ra:               ra.trim()               || null,
        ativo,
        cursoNome:           cursoNome.trim()           || null,
        cursoSigla:          cursoSigla.trim()          || null,
        curso:               curso.trim()               || null,
        eixoTecnologico:     eixoTecnologico.trim()     || null,
        matrizCurricular:    matrizCurricular.trim()    || null,
        unidadeFatec:        unidadeFatec.trim()        || null,
        turno:               turno                      || null,
        turma:               turma.trim()               || null,
        semestreAtual:       semestreAtual.trim()       || null,
        anoSemestreIngresso: anoSemestreIngresso.trim() || null,
        situacaoAcademica:   situacaoAcademica.trim()   || null,
        coordenadorCurso:    coordenadorCurso.trim()    || null,
        telefoneCelular:     telefoneCelular.trim()     || null,
        whatsapp:            whatsapp.trim()            || null,
        canalPreferencialContato: canalPreferencialContato || null,
        melhorPeriodoContato:     melhorPeriodoContato     || null,
        necessitaAtendimentoAcessivel,
        tipoAcessibilidade:     tipoAcessibilidade.trim()     || null,
        observacoesAtendimento: observacoesAtendimento.trim() || null,
      };

      const res = await apiFetch(`${API_URL}/usuarios/${aluno.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        try {
          const json = JSON.parse(text);
          throw new Error(json?.message || `Falha ao atualizar (${res.status})`);
        } catch {
          throw new Error(text || `Falha ao atualizar (${res.status})`);
        }
      }

      const updated = await res.json();
      onSaved(updated);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 mt-8 w-[95%] max-w-3xl max-h-[90vh] overflow-y-auto bg-background rounded-xl shadow-xl border border-[var(--border)]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-base">Editar aluno</h2>
          <button onClick={onClose} className="inline-grid place-items-center size-8 rounded-md hover:bg-[var(--muted)]">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-7">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* ── Identificação ── */}
          <section>
            <p className={sectionCls}>Identificação</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={labelCls}>Nome completo</label>
                <input className={inputCls} placeholder="Ex.: Fulano da Silva" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={160} />
              </div>
              <div>
                <label className={labelCls}>RA</label>
                <input className={inputCls} placeholder="Ex.: 1234567890123" value={ra} onChange={(e) => setRa(e.target.value)} maxLength={32} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border)]"
                />
                <label htmlFor="ativo" className="text-sm cursor-pointer">Conta ativa</label>
              </div>
              <div>
                <label className={labelCls}>E-mail educacional</label>
                <input type="email" className={inputCls} placeholder="nome@fatec.sp.gov.br" value={emailEducacional} onChange={(e) => setEmailEducacional(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>E-mail pessoal</label>
                <input type="email" className={inputCls} placeholder="nome@gmail.com" value={emailPessoal} onChange={(e) => setEmailPessoal(e.target.value)} />
              </div>
            </div>
          </section>

          {/* ── Curso ── */}
          <section>
            <p className={sectionCls}>Curso</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nome do curso</label>
                <input className={inputCls} placeholder="Ex.: Desenvolvimento de Software Multiplataforma" value={cursoNome} onChange={(e) => setCursoNome(e.target.value)} maxLength={128} />
              </div>
              <div>
                <label className={labelCls}>Sigla do curso</label>
                <input className={inputCls} placeholder="Ex.: DSM" value={cursoSigla} onChange={(e) => setCursoSigla(e.target.value)} maxLength={16} />
              </div>
              <div>
                <label className={labelCls}>Curso (campo livre)</label>
                <input className={inputCls} placeholder="Denominação oficial" value={curso} onChange={(e) => setCurso(e.target.value)} maxLength={128} />
              </div>
              <div>
                <label className={labelCls}>Eixo tecnológico</label>
                <input className={inputCls} placeholder="Ex.: Informação e Comunicação" value={eixoTecnologico} onChange={(e) => setEixoTecnologico(e.target.value)} maxLength={128} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Matriz curricular</label>
                <input className={inputCls} placeholder="Ex.: 2023" value={matrizCurricular} onChange={(e) => setMatrizCurricular(e.target.value)} maxLength={128} />
              </div>
            </div>
          </section>

          {/* ── Dados Acadêmicos ── */}
          <section>
            <p className={sectionCls}>Dados Acadêmicos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Unidade Fatec</label>
                <input className={inputCls} placeholder="Ex.: Fatec Cotia" value={unidadeFatec} onChange={(e) => setUnidadeFatec(e.target.value)} maxLength={128} />
              </div>
              <div>
                <label className={labelCls}>Turno</label>
                <select className={inputCls} value={turno} onChange={(e) => setTurno(e.target.value)}>
                  <option value="">Selecione…</option>
                  {TURNOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Turma</label>
                <input className={inputCls} placeholder="Ex.: DSM-3A" value={turma} onChange={(e) => setTurma(e.target.value)} maxLength={64} />
              </div>
              <div>
                <label className={labelCls}>Semestre atual</label>
                <input className={inputCls} placeholder="Ex.: 3" value={semestreAtual} onChange={(e) => setSemestreAtual(e.target.value)} maxLength={32} />
              </div>
              <div>
                <label className={labelCls}>Ano/semestre de ingresso</label>
                <input className={inputCls} placeholder="Ex.: 2023/1" value={anoSemestreIngresso} onChange={(e) => setAnoSemestreIngresso(e.target.value)} maxLength={32} />
              </div>
              <div>
                <label className={labelCls}>Situação acadêmica</label>
                <input className={inputCls} placeholder="Ex.: Regular, Trancado…" value={situacaoAcademica} onChange={(e) => setSituacaoAcademica(e.target.value)} maxLength={128} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Coordenador do curso</label>
                <input className={inputCls} placeholder="Ex.: Prof. Fulano de Tal" value={coordenadorCurso} onChange={(e) => setCoordenadorCurso(e.target.value)} maxLength={128} />
              </div>
            </div>
          </section>

          {/* ── Contato ── */}
          <section>
            <p className={sectionCls}>Contato</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Telefone celular</label>
                <input className={inputCls} placeholder="Ex.: (11) 99999-9999" value={telefoneCelular} onChange={(e) => setTelefoneCelular(e.target.value)} maxLength={20} />
              </div>
              <div>
                <label className={labelCls}>WhatsApp</label>
                <input className={inputCls} placeholder="Ex.: (11) 99999-9999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={20} />
              </div>
              <div>
                <label className={labelCls}>Canal preferencial de contato</label>
                <select className={inputCls} value={canalPreferencialContato} onChange={(e) => setCanalPreferencialContato(e.target.value)}>
                  <option value="">Selecione…</option>
                  {CANAIS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Melhor período para contato</label>
                <select className={inputCls} value={melhorPeriodoContato} onChange={(e) => setMelhorPeriodoContato(e.target.value)}>
                  <option value="">Selecione…</option>
                  {PERIODOS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* ── Acessibilidade ── */}
          <section>
            <p className={sectionCls}>Acessibilidade</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="acessivel"
                  checked={necessitaAtendimentoAcessivel}
                  onChange={(e) => setNecessitaAtendimentoAcessivel(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border)]"
                />
                <label htmlFor="acessivel" className="text-sm cursor-pointer">
                  Necessita de atendimento acessível
                </label>
              </div>

              {necessitaAtendimentoAcessivel && (
                <>
                  <div>
                    <label className={labelCls}>Tipo de acessibilidade</label>
                    <input
                      className={inputCls}
                      placeholder="Ex.: Auditiva, Visual, Motora…"
                      value={tipoAcessibilidade}
                      onChange={(e) => setTipoAcessibilidade(e.target.value)}
                      maxLength={256}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Observações de atendimento</label>
                    <textarea
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] min-h-[80px] resize-y"
                      placeholder="Descreva as necessidades específicas…"
                      value={observacoesAtendimento}
                      onChange={(e) => setObservacoesAtendimento(e.target.value)}
                      maxLength={2000}
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ── Ações ── */}
          <div className="sticky bottom-0 bg-background pt-4 pb-1 border-t border-[var(--border)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm hover:brightness-95 disabled:opacity-60"
            >
              {submitting ? <><Loader2 className="size-4 animate-spin" /> Salvando…</> : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
