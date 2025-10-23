"use client";
import { apiFetch } from "../../../../utils/api"
import { useEffect, useState } from "react";
import { Bell, Globe, Loader2, Moon, Save, Settings, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function ConfiguracoesAlunoPage() {
  const [saudacao, setSaudacao] = useState("Olá 👋");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState("pt-BR");
  const [notificacoes, setNotificacoes] = useState(true);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

      useEffect(() => {
        async function loadUser() {
          try {
            const res = await apiFetch(`${apiBase}/auth/me`, { cache: "no-store" });
            const data = await res.json();

            if (data?.nome) {
              const primeiro = String(data.nome).split(" ")[0];
              setSaudacao(`Olá, ${primeiro} 👋`);
            }
          } catch {
            // ignora — apiFetch já cuida de redirecionar se o token estiver inválido
          } finally {
            setLoading(false);
          }
        }

        loadUser();
      }, [apiBase]);

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      // opcional: salvar preferências no backend futuramente
      toast.success("Configurações salvas com sucesso!");
    } catch {
      toast.error("Falha ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  function handleThemeChange() {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
  }

  function handleClearCache() {
    localStorage.clear();
    toast.info("Cache e sessões locais limpos!");
  }

  return (
    <div className="space-y-6">
      {/* Topbar */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="font-grotesk text-2xl sm:text-3xl font-semibold tracking-tight">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Carregando…
              </span>
            ) : (
              saudacao
            )}
          </h1>
          <p className="text-muted-foreground">Gerencie preferências da sua conta e da plataforma.</p>
        </div>
        <MobileSidebarTriggerAluno />
      </div>

      {/* Form */}
      <form
        onSubmit={saveConfig}
        className="rounded-xl border border-[var(--border)] bg-card p-5 sm:p-6 grid gap-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Settings className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Preferências gerais</h2>
        </div>

        {/* Tema */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Moon className="size-5 text-muted-foreground" />
            ) : (
              <Sun className="size-5 text-muted-foreground" />
            )}
            <div>
              <div className="font-medium">Tema escuro</div>
              <div className="text-sm text-muted-foreground">
                Altere entre o modo claro e escuro da interface.
              </div>
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={darkMode}
              onChange={handleThemeChange}
            />
            <div className="w-10 h-5 bg-[var(--muted)] rounded-full peer peer-checked:bg-primary transition-all relative">
              <span className="absolute top-[2px] left-[2px] w-4 h-4 bg-background rounded-full transition-all peer-checked:translate-x-5" />
            </div>
          </label>
        </div>

        {/* Idioma */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-3">
            <Globe className="size-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Idioma</div>
              <div className="text-sm text-muted-foreground">
                Escolha o idioma da interface e das notificações.
              </div>
            </div>
          </div>
          <select
            className="h-9 rounded-lg border border-[var(--border)] bg-input px-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-sm"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>

        {/* Notificações */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Notificações por e-mail</div>
              <div className="text-sm text-muted-foreground">
                Receba alertas sobre atualizações de chamados e mensagens.
              </div>
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={notificacoes}
              onChange={() => setNotificacoes(!notificacoes)}
            />
            <div className="w-10 h-5 bg-[var(--muted)] rounded-full peer peer-checked:bg-primary transition-all relative">
              <span className="absolute top-[2px] left-[2px] w-4 h-4 bg-background rounded-full transition-all peer-checked:translate-x-5" />
            </div>
          </label>
        </div>

        {/* Limpar cache */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="size-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Limpar cache e sessões</div>
              <div className="text-sm text-muted-foreground">
                Remove dados salvos localmente, como tokens e preferências.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearCache}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] bg-background hover:bg-[var(--muted)] text-sm"
          >
            <Trash2 className="size-4" />
            Limpar
          </button>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className={cx(
              "inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-medium",
              saving && "opacity-60 cursor-not-allowed"
            )}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Salvar alterações
          </button>
        </div>
      </form>
    </div>
  );
}
