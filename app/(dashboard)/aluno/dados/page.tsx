"use client";
import { apiFetch } from "../../../../utils/api";
import { useEffect, useMemo, useState } from "react";
import {
  Accessibility,
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  Loader2,
  Mail,
  Phone,
  Save,
  Shield,
  User,
} from "lucide-react";
import { toast } from "sonner";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";
import { logoutAndRedirect } from "../../../../utils/auth";
import { cx } from "../../../../utils/cx";

type Usuario = {
  id: string;
  nome: string;
  emailPessoal: string;
  emailEducacional: string;
  ra?: string | null;
  unidadeFatec?: string | null;
  curso?: string | null;
  eixoTecnologico?: string | null;
  turno?: string | null;
  turma?: string | null;
  semestreAtual?: string | number | null;
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

const CANAIS_CONTATO = ["E-mail pessoal", "E-mail educacional", "Telefone", "WhatsApp"];
const PERIODOS_CONTATO = ["Manhã", "Tarde", "Noite", "Comercial"];

function valueOrDash(value?: string | number | boolean | null) {
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : undefined;
}

function getResponseErrorMessage(value: unknown) {
  if (typeof value !== "object" || value === null) return undefined;
  const data = value as { error?: unknown; message?: unknown };
  return typeof data.error === "string" ? data.error : typeof data.message === "string" ? data.message : undefined;
}

function Field({
  label,
  children,
  desc,
  required,
}: {
  label: string;
  children: React.ReactNode;
  desc?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-[var(--brand-red)]">*</span>}
      </label>
      {children}
      {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value?: string | number | boolean | null }) {
  return (
    <Field label={`${label} (somente leitura)`}>
      <div className="min-h-10 w-full rounded-lg border border-[var(--border)] bg-muted px-3 py-2 grid items-center text-sm">
        {valueOrDash(value)}
      </div>
    </Field>
  );
}

export default function MeusDadosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);
  const [user, setUser] = useState<Usuario | null>(null);

  const [nome, setNome] = useState("");
  const [emailPessoal, setEmailPessoal] = useState("");
  const [telefoneCelular, setTelefoneCelular] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [canalPreferencialContato, setCanalPreferencialContato] = useState("");
  const [melhorPeriodoContato, setMelhorPeriodoContato] = useState("");
  const [necessitaAtendimentoAcessivel, setNecessitaAtendimentoAcessivel] = useState(false);
  const [tipoAcessibilidade, setTipoAcessibilidade] = useState("");
  const [observacoesAtendimento, setObservacoesAtendimento] = useState("");

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [showPass, setShowPass] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`${apiBase}/auth/me`, { cache: "no-store" });
        const data: Usuario = await res.json();
        if (!alive) return;
        setUser(data);
        setNome(data?.nome ?? "");
        setEmailPessoal(data?.emailPessoal ?? "");
        setTelefoneCelular(data?.telefoneCelular ?? "");
        setWhatsapp(data?.whatsapp ?? "");
        setCanalPreferencialContato(data?.canalPreferencialContato ?? "");
        setMelhorPeriodoContato(data?.melhorPeriodoContato ?? "");
        setNecessitaAtendimentoAcessivel(Boolean(data?.necessitaAtendimentoAcessivel));
        setTipoAcessibilidade(data?.tipoAcessibilidade ?? "");
        setObservacoesAtendimento(data?.observacoesAtendimento ?? "");
      } catch (e: unknown) {
        toast.error("Falha ao carregar seus dados", { description: getErrorMessage(e) });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiBase]);

  const canSave = useMemo(() => {
    if (!user) return false;
    const changed =
      nome !== (user.nome ?? "") ||
      emailPessoal !== (user.emailPessoal ?? "") ||
      telefoneCelular !== (user.telefoneCelular ?? "") ||
      whatsapp !== (user.whatsapp ?? "") ||
      canalPreferencialContato !== (user.canalPreferencialContato ?? "") ||
      melhorPeriodoContato !== (user.melhorPeriodoContato ?? "") ||
      necessitaAtendimentoAcessivel !== Boolean(user.necessitaAtendimentoAcessivel) ||
      tipoAcessibilidade !== (user.tipoAcessibilidade ?? "") ||
      observacoesAtendimento !== (user.observacoesAtendimento ?? "");
    const emailOk = !emailPessoal || /\S+@\S+\.\S+/.test(emailPessoal);
    return changed && nome.trim().length > 0 && emailOk;
  }, [
    user,
    nome,
    emailPessoal,
    telefoneCelular,
    whatsapp,
    canalPreferencialContato,
    melhorPeriodoContato,
    necessitaAtendimentoAcessivel,
    tipoAcessibilidade,
    observacoesAtendimento,
  ]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      const res = await apiFetch(`${apiBase}/usuarios/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nome: nome.trim(),
          emailPessoal: emailPessoal.trim(),
          telefoneCelular: telefoneCelular.trim(),
          whatsapp: whatsapp.trim(),
          canalPreferencialContato,
          melhorPeriodoContato,
          necessitaAtendimentoAcessivel,
          tipoAcessibilidade: necessitaAtendimentoAcessivel ? tipoAcessibilidade.trim() : "",
          observacoesAtendimento: necessitaAtendimentoAcessivel ? observacoesAtendimento.trim() : "",
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar alterações");
      const updated = (await res.json()) as Usuario;
      setUser(updated);
      toast.success("Dados atualizados com sucesso!");
    } catch (e: unknown) {
      toast.error("Falha ao salvar", { description: getErrorMessage(e) });
    } finally {
      setSaving(false);
    }
  }

  const meetsPolicy =
    newPass.length >= 8 &&
    /[A-Z]/.test(newPass) &&
    /[a-z]/.test(newPass) &&
    /\d/.test(newPass) &&
    /[^A-Za-z0-9]/.test(newPass);

  const canChangePass = currentPass.length > 0 && meetsPolicy && newPass === newPass2;

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!canChangePass || !user) return;

    if (!meetsPolicy) {
      toast.error("Falha ao alterar senha", {
        description:
          "A nova senha não cumpre todos os critérios de segurança (8+ caracteres, maiúscula, minúscula, número e símbolo).",
      });
      return;
    }

    try {
      setChanging(true);

      // Fluxo reautenticado: exige a senha atual e é validado no backend.
      const res = await apiFetch(`${apiBase}/auth/trocar-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senhaAtual: currentPass,
          novaSenha: newPass,
        }),
      });

      if (res.ok) {
        setCurrentPass("");
        setNewPass("");
        setNewPass2("");
        toast.success("Senha alterada com sucesso!", {
          description: "Por segurança, suas sessões foram encerradas. Faça login novamente.",
        });
        // A troca revoga as sessões no servidor — encerra a sessão local.
        setTimeout(() => {
          logoutAndRedirect();
        }, 4000);
      } else {
        const errData: unknown = await res.json().catch(() => ({}));
        throw new Error(getResponseErrorMessage(errData) || `Erro ${res.status} ao alterar senha`);
      }
    } catch (e: unknown) {
      toast.error("Falha ao alterar senha", { description: getErrorMessage(e) });
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="xl:hidden">
        <MobileSidebarTriggerAluno />
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-card p-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Carregando dados…
        </div>
      ) : !user ? (
        <div className="rounded-xl border border-[var(--border)] bg-card p-8 text-center text-muted-foreground">
          Faça login para visualizar seus dados.
        </div>
      ) : (
        <>
          <form
            onSubmit={saveProfile}
            className="rounded-xl border border-[var(--border)] bg-card p-5 sm:p-6 grid gap-6"
          >
            <section className="grid gap-5">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <h2 className="text-base font-semibold">Informações pessoais</h2>
                  <p className="text-sm text-muted-foreground">
                    O nome é editável pelo aluno; RA e e-mail educacional vêm do sistema acadêmico.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nome completo" required>
                  <input
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </Field>

                <ReadOnlyField label="RA" value={user.ra} />

                <Field label="E-mail pessoal">
                  <div className="relative">
                    <Mail className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-input pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      value={emailPessoal}
                      onChange={(e) => setEmailPessoal(e.target.value)}
                      placeholder="voce@email.com"
                    />
                  </div>
                </Field>

                <ReadOnlyField label="E-mail educacional" value={user.emailEducacional} />
              </div>
            </section>

            <section className="grid gap-5 border-t border-[var(--border)] pt-5">
              <div className="flex items-start gap-3">
                <GraduationCap className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <h2 className="text-base font-semibold">Dados acadêmicos Fatec</h2>
                  <p className="text-sm text-muted-foreground">
                    Campos somente leitura sincronizados a partir do sistema acadêmico.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <ReadOnlyField label="Unidade Fatec" value={user.unidadeFatec} />
                <ReadOnlyField label="Curso" value={user.curso} />
                <ReadOnlyField label="Eixo tecnológico" value={user.eixoTecnologico} />
                <ReadOnlyField label="Turno" value={user.turno} />
                <ReadOnlyField label="Turma" value={user.turma} />
                <ReadOnlyField label="Semestre atual" value={user.semestreAtual} />
                <ReadOnlyField label="Matriz curricular" value={user.matrizCurricular} />
                <ReadOnlyField label="Situação acadêmica" value={user.situacaoAcademica} />
                <ReadOnlyField label="Ano/semestre de ingresso" value={user.anoSemestreIngresso} />
                <ReadOnlyField label="Coordenador do curso" value={user.coordenadorCurso} />
              </div>
            </section>

            <section className="grid gap-5 border-t border-[var(--border)] pt-5">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <h2 className="text-base font-semibold">Contato e atendimento</h2>
                  <p className="text-sm text-muted-foreground">
                    Campos editáveis pelo aluno. Dados de acessibilidade devem ser usados apenas para viabilizar atendimento adequado.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Telefone celular">
                  <input
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    value={telefoneCelular}
                    onChange={(e) => setTelefoneCelular(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </Field>

                <Field label="WhatsApp">
                  <input
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </Field>

                <Field label="Canal preferencial de contato">
                  <select
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    value={canalPreferencialContato}
                    onChange={(e) => setCanalPreferencialContato(e.target.value)}
                  >
                    <option value="">Não informado</option>
                    {CANAIS_CONTATO.map((canal) => (
                      <option key={canal} value={canal}>
                        {canal}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Melhor período para contato">
                  <select
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    value={melhorPeriodoContato}
                    onChange={(e) => setMelhorPeriodoContato(e.target.value)}
                  >
                    <option value="">Não informado</option>
                    {PERIODOS_CONTATO.map((periodo) => (
                      <option key={periodo} value={periodo}>
                        {periodo}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-background/60 p-4 grid gap-4">
                <div className="flex items-start gap-3">
                  <Accessibility className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="grid gap-1">
                    <label className="inline-flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-[var(--border)]"
                        checked={necessitaAtendimentoAcessivel}
                        onChange={(e) => setNecessitaAtendimentoAcessivel(e.target.checked)}
                      />
                      Necessito de atendimento acessível
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Opcional e sujeito à regra de privacidade: preencha apenas se desejar registrar necessidades para atendimento.
                    </p>
                  </div>
                </div>

                {necessitaAtendimentoAcessivel && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Tipo de acessibilidade">
                      <input
                        className="h-10 w-full rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        value={tipoAcessibilidade}
                        onChange={(e) => setTipoAcessibilidade(e.target.value)}
                        placeholder="Ex.: Libras, mobilidade, leitor de tela"
                      />
                    </Field>

                    <Field label="Observações de atendimento">
                      <textarea
                        className="min-h-20 w-full rounded-lg border border-[var(--border)] bg-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        value={observacoesAtendimento}
                        onChange={(e) => setObservacoesAtendimento(e.target.value)}
                        placeholder="Informe orientações úteis para a equipe de atendimento"
                      />
                    </Field>
                  </div>
                )}
              </div>
            </section>

            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={!canSave || saving}
                className={cx(
                  "inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-medium",
                  !canSave || saving ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
                )}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar alterações
              </button>
            </div>
          </form>

          <section className="rounded-xl border border-[var(--border)] bg-card p-5 sm:p-6 grid gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <h2 className="text-base font-semibold">Regra de edição dos dados</h2>
                <p className="text-sm text-muted-foreground">
                  Dados pessoais de contato e atendimento são editáveis pelo aluno; dados acadêmicos Fatec são somente leitura e devem ser alterados no sistema acadêmico de origem.
                </p>
              </div>
            </div>
          </section>

          <form
            onSubmit={changePassword}
            className="rounded-xl border border-[var(--border)] bg-card p-5 sm:p-6 grid gap-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="size-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Segurança</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Senha atual">
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-input px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    minLength={6}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--muted)]/60"
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Nova senha">
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-input px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    minLength={6}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--muted)]/60"
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Confirmar nova senha">
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-input px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    value={newPass2}
                    onChange={(e) => setNewPass2(e.target.value)}
                    minLength={6}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--muted)]/60"
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={!canChangePass || changing}
                className={cx(
                  "inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--border)] bg-background",
                  !canChangePass || changing ? "opacity-60 cursor-not-allowed" : "hover:bg-[var(--muted)]"
                )}
              >
                {changing ? <Loader2 className="size-4 animate-spin" /> : <IdCard className="size-4" />}
                Alterar senha
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
