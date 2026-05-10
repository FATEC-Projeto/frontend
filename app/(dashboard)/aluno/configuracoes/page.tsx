"use client";

import { useEffect, useState } from "react";
import { Bell, Globe, Loader2, Moon, RotateCcw, Save, Settings, Sun } from "lucide-react";
import { toast } from "sonner";
import MobileSidebarTriggerAluno from "../_components/MobileSidebarTriggerAluno";
import { cx } from "../../../../utils/cx";

const LS_KEYS = {
  theme: "theme",
  emailNotif: "email_notifications",
} as const;

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(LS_KEYS.theme) as "light" | "dark" | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cx(
        "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors",
        checked ? "bg-primary" : "bg-[var(--muted)]"
      )}
    >
      <span
        className={cx(
          "absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export default function ConfiguracoesAlunoPage() {
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  const [platNotif, setPlatNotif] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = localStorage.getItem(LS_KEYS.emailNotif);
    if (v !== null) setPlatNotif(v === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(LS_KEYS.theme, theme);
  }, [theme]);

  function handleRestoreDefaults() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LS_KEYS.theme);
    localStorage.removeItem(LS_KEYS.emailNotif);
    const defaultTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(defaultTheme);
    setPlatNotif(true);
    toast.info("Preferências restauradas para o padrão.");
  }

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_KEYS.emailNotif, platNotif ? "1" : "0");
      }
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Falha ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-end">
        <MobileSidebarTriggerAluno />
      </div>

      <form
        onSubmit={saveConfig}
        className="rounded-xl border border-[var(--border)] bg-card p-5 sm:p-6 grid gap-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Settings className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Preferências gerais</h2>
        </div>

        {/* Tema */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div className="flex items-center gap-3">
            {theme === "dark"
              ? <Moon className="size-5 text-muted-foreground" />
              : <Sun className="size-5 text-muted-foreground" />}
            <div>
              <div className="font-medium">Tema escuro</div>
              <div className="text-sm text-muted-foreground">
                Alterna entre o modo claro e escuro da interface.
              </div>
            </div>
          </div>
          <Toggle checked={theme === "dark"} onChange={() => setTheme((t) => t === "dark" ? "light" : "dark")} />
        </div>

        {/* Idioma */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div className="flex items-center gap-3">
            <Globe className="size-5 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Idioma</span>
                <span className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  em breve
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                O sistema está disponível apenas em Português (Brasil).
              </div>
            </div>
          </div>
          <select
            disabled
            className="h-9 rounded-lg border border-[var(--border)] bg-input px-3 text-sm opacity-50 cursor-not-allowed"
            value="pt-BR"
          >
            <option value="pt-BR">Português (Brasil)</option>
          </select>
        </div>

        {/* Notificações na plataforma */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Notificações na plataforma</div>
              <div className="text-sm text-muted-foreground">
                Receba alertas sobre atualizações de solicitações e mensagens diretamente aqui no sistema.
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Envio de e-mail é gerenciado pela instituição e não é configurável aqui.
              </div>
            </div>
          </div>
          <Toggle checked={platNotif} onChange={() => setPlatNotif((v) => !v)} />
        </div>

        {/* Restaurar preferências */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCcw className="size-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Restaurar preferências padrão</div>
              <div className="text-sm text-muted-foreground">
                Volta as configurações de tema e notificações para o padrão original.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border)] bg-background hover:bg-[var(--muted)] text-sm"
          >
            <RotateCcw className="size-4" />
            Restaurar
          </button>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className={cx(
              "inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm",
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
