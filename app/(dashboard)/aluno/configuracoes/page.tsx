"use client";

import { useEffect, useState } from "react";
import { Bell, Globe, Loader2, Moon, Save, Settings, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const LS_KEYS = {
  theme: "theme",
  lang: "lang",
  emailNotif: "email_notifications",
} as const;

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(LS_KEYS.theme) as "light" | "dark" | null;
  if (stored === "light" || stored === "dark") return stored;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function ConfiguracoesAlunoPage() {
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  const [lang, setLang] = useState<string>(() => localStorage.getItem(LS_KEYS.lang) || "pt-BR");
  const [emailNotif, setEmailNotif] = useState<boolean>(() => {
    const v = localStorage.getItem(LS_KEYS.emailNotif);
    return v ? v === "1" : true; // default: ligado
  });

  // aplica o tema no <html> e persiste
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(LS_KEYS.theme, theme);
  }, [theme]);

  function handleThemeToggle() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function handleClearCache() {
    // limpa apenas as chaves locais desta página
    localStorage.removeItem(LS_KEYS.theme);
    localStorage.removeItem(LS_KEYS.lang);
    localStorage.removeItem(LS_KEYS.emailNotif);
    toast.info("Preferências locais limpas!");
    // re-aplica defaults
    setTheme(getInitialTheme());
    setLang("pt-BR");
    setEmailNotif(true);
  }

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      // persistência local
      localStorage.setItem(LS_KEYS.lang, lang);
      localStorage.setItem(LS_KEYS.emailNotif, emailNotif ? "1" : "0");

      // se quiser, aqui dá pra chamar o backend no futuro (/me/preferences)
      // await apiFetch(`${apiBase}/me/preferences`, { method: "PATCH", body: JSON.stringify({ theme, lang, emailNotif }) })

      toast.success("Configurações salvas com sucesso!");
    } catch (e) {
      toast.error("Falha ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Topbar mínima (sem saudação; o layout já tem cabeçalho global) */}
      <div className="mb-2 flex items-center justify-end">
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
            {theme === "dark" ? (
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
              checked={theme === "dark"}
              onChange={handleThemeToggle}
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
              checked={emailNotif}
              onChange={() => setEmailNotif((v) => !v)}
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
