"use client";
import { apiFetch } from "../../../../utils/api";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Shield, User, Mail, IdCard, Eye, EyeOff} from "lucide-react";
import { toast } from "sonner";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";
import { logoutAndRedirect } from "../../../../utils/auth";

type Usuario = {
  id: string;
  nome: string;
  emailPessoal: string;
  emailEducacional: string;
  ra?: string | null;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
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

export default function MeusDadosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);
  const [user, setUser] = useState<Usuario | null>(null);

  const [nome, setNome] = useState("");
  const [emailPessoal, setEmailPessoal] = useState("");
  const [emailEducacional, setEmailEducacional] = useState("");

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [showPass, setShowPass] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Carrega o usuário e preenche o formulário (sem saudação)
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
        setEmailEducacional(data?.emailEducacional ?? "");
      } catch (e: any) {
        toast.error("Falha ao carregar seus dados", { description: e?.message });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiBase]);

  /* ---------- VALIDAÇÕES ---------- */
  const canSave = useMemo(() => {
    if (!user) return false;
    const changed =
      nome !== (user.nome ?? "") ||
      emailPessoal !== (user.emailPessoal ?? "") || 
      emailEducacional !== (user.emailEducacional ?? "");
    const emailOk = /\S+@\S+\.\S+/.test(emailPessoal);
    const eduOk = /\S+@\S+\.\S+/.test(emailEducacional);
    return changed && emailOk && eduOk;
  }, [user, nome, emailPessoal, emailEducacional]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!emailEducacional) {
      toast.error("O e-mail educacional é obrigatório para o aluno.");
      return;
    }

    try {
      setSaving(true);
      const res = await apiFetch(`${apiBase}/usuarios/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nome: nome.trim(),
          emailPessoal: emailPessoal.trim(),
          emailEducacional: emailEducacional.trim(),
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar alterações");
      const updated = (await res.json()) as Usuario;
      setUser(updated);
      toast.success("Dados atualizados com sucesso!");
    } catch (e: any) {
      toast.error("Falha ao salvar", { description: e?.message });
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

const canChangePass =
  currentPass.length > 0 && 
  meetsPolicy &&
  newPass === newPass2;

async function changePassword(e: React.FormEvent) {
  e.preventDefault();
  if (!canChangePass || !user) return;

  if (!meetsPolicy) {
     toast.error("Falha ao alterar senha", { 
       description: "A nova senha não cumpre todos os critérios de segurança (8+ caracteres, maiúscula, minúscula, número e símbolo)." 
     });
     return;
  }

  try {
    setChanging(true);
    const token = localStorage.getItem("accessToken") || "";
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");

    const res = await fetch(`${apiBase}/usuarios/${user.id}`, { 
      method: "PATCH", 
      headers: headers,
      body: JSON.stringify({
        senha: newPass
      }),
    });
    if (res.ok) {
      toast.success("Senha alterada com sucesso!");
      setCurrentPass("");
      setNewPass("");
      setNewPass2("");
    } 
    else if (res.status === 401 || res.status === 403) {
      toast.success("Senha alterada com sucesso!", {
        description: "Como esperado, a sua sessão foi terminada. Por favor, faça login novamente."
      });

      // Damos 2 segundos para o utilizador ler o toast e depois fazemos o logout
      setTimeout(() => {
        logoutAndRedirect(); 
      }, 5000);
    } 

    // Cenário 3: Erro real (400, 500, etc.)
    else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error || errData?.message || `Erro ${res.status} ao alterar senha`);
    }

  } catch (e: any) {
    // Este catch agora só apanha erros reais (Cenário 3) ou falhas de rede
    toast.error("Falha ao alterar senha", { description: e?.message });
  } finally {
    setChanging(false);
  }
}

  /* ---------- RENDER ---------- */
  return (
    <div className="space-y-6">
      {/* Apenas o trigger mobile da sidebar; sem boas-vindas */}
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
          {/* Dados do perfil */}
          <form
            onSubmit={saveProfile}
            className="rounded-xl border border-[var(--border)] bg-card p-5 sm:p-6 grid gap-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <User className="size-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Informações pessoais</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nome completo" required>
                <input
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </Field>

              <Field label="RA (somente leitura)">
                <div className="h-10 w-full rounded-lg border border-[var(--border)] bg-muted px-3 grid items-center text-sm">
                  {user.ra ?? "—"}
                </div>
              </Field>

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

              <Field label="E-mail educacional (somente leitura)">
                <div className="relative">
                  <div className="h-10 w-full rounded-lg border border-[var(--border)] bg-muted px-3 grid items-center text-sm">
                  {user.emailEducacional ?? "—"}
                </div>
                </div>
              </Field>
            </div>

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

          {/* Segurança */}
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
                    onClick={() => setShowPass(v => !v)}
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
                    onClick={() => setShowPass(v => !v)}
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
                    onClick={() => setShowPass(v => !v)}
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
